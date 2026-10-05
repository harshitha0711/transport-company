const Dispatch = require('../models/Dispatch');
const Consignment = require('../models/Consignment');
const Truck = require('../models/Truck');
const Trip = require('../models/Trip');
const { runAutomaticAllocation } = require('../services/allocationService');

// @desc    Get all dispatch records
// @route   GET /api/dispatch
// @access  Private
const getDispatches = async (req, res, next) => {
  try {
    const { status, truck, destination } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (truck) filter.truck = truck;
    if (destination) filter.destinationBranch = destination;

    const dispatches = await Dispatch.find(filter)
      .populate('truck', 'truckNumber capacity status driverName driverPhone')
      .populate('sourceBranch', 'name city code')
      .populate('destinationBranch', 'name city code')
      .populate('consignments', 'consignmentNumber volume sender receiver charge status')
      .populate('dispatchedBy', 'name email')
      .sort({ dispatchTime: -1 });

    res.json({ success: true, count: dispatches.length, data: dispatches });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dispatch by ID with complete manifest / dispatch document details
// @route   GET /api/dispatch/:id
// @access  Private
const getDispatchById = async (req, res, next) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id)
      .populate('truck', 'truckNumber capacity status driverName driverPhone')
      .populate('sourceBranch', 'name city code address phone')
      .populate('destinationBranch', 'name city code address phone')
      .populate({
        path: 'consignments',
        populate: [
          { path: 'sourceBranch', select: 'name city' },
          { path: 'destinationBranch', select: 'name city' },
        ],
      })
      .populate('dispatchedBy', 'name email');

    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch record not found' });
    }

    res.json({ success: true, data: dispatch });
  } catch (error) {
    next(error);
  }
};

// @desc    Manual creation of dispatch if needed
// @route   POST /api/dispatch
// @access  Private (Manager)
const createDispatch = async (req, res, next) => {
  try {
    const { truckId, destinationBranchId, consignmentIds, notes } = req.body;

    const truck = await Truck.findById(truckId);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }
    if (truck.status !== 'AVAILABLE' && truck.status !== 'IDLE') {
      return res.status(400).json({
        success: false,
        message: `Truck ${truck.truckNumber} is currently in ${truck.status} status and cannot be dispatched`,
      });
    }

    const consignments = await Consignment.find({ _id: { $in: consignmentIds } });
    const totalVolume = consignments.reduce((sum, c) => sum + c.volume, 0);

    if (totalVolume > truck.capacity) {
      return res.status(400).json({
        success: false,
        message: `Total cargo volume (${totalVolume} m³) exceeds truck capacity (${truck.capacity} m³)`,
      });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const dispatchNumber = `TCC-DSP-${dateStr}-${randSuffix}`;

    const dispatch = await Dispatch.create({
      dispatchNumber,
      truck: truck._id,
      sourceBranch: truck.currentBranch,
      destinationBranch: destinationBranchId,
      consignments: consignmentIds,
      totalVolume: Number(totalVolume.toFixed(2)),
      dispatchTime: new Date(),
      status: 'PREPARED',
      driverName: truck.driverName,
      driverPhone: truck.driverPhone,
      dispatchedBy: req.user ? req.user.id : null,
      notes,
    });

    // Update consignments
    await Consignment.updateMany(
      { _id: { $in: consignmentIds } },
      {
        $set: {
          status: 'ALLOCATED',
          allocatedAt: new Date(),
          assignedTruck: truck._id,
          dispatchId: dispatch._id,
        },
      }
    );

    // Update truck
    truck.status = 'LOADING';
    truck.destination = destinationBranchId;
    truck.lastAllocatedAt = new Date();
    await truck.save();

    res.status(201).json({ success: true, data: dispatch });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark truck as departed / on trip
// @route   POST /api/dispatch/:id/depart
// @access  Private (Manager/Staff)
const markDeparted = async (req, res, next) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch record not found' });
    }

    if (dispatch.status !== 'PREPARED') {
      return res.status(400).json({
        success: false,
        message: `Dispatch is already in ${dispatch.status} status`,
      });
    }

    const truck = await Truck.findById(dispatch.truck);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Allocated truck not found' });
    }

    const now = new Date();

    // Calculate idle time in minutes before this trip
    let idleMinutes = 0;
    if (truck.lastAvailableAt) {
      const diffMs = now.getTime() - new Date(truck.lastAvailableAt).getTime();
      idleMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    }

    // Create Trip record
    const trip = await Trip.create({
      truck: truck._id,
      source: dispatch.sourceBranch,
      destination: dispatch.destinationBranch,
      dispatch: dispatch._id,
      availableTimeBeforeTrip: truck.lastAvailableAt || new Date(now.getTime() - idleMinutes * 60 * 1000),
      departureTime: now,
      status: 'IN_PROGRESS',
      totalCargoVolume: dispatch.totalVolume,
      idleTimeBeforeTripMinutes: idleMinutes,
      remarks: `Trip departed under Dispatch #${dispatch.dispatchNumber}`,
    });

    // Update dispatch
    dispatch.status = 'IN_TRANSIT';
    await dispatch.save();

    // Update truck status
    truck.status = 'ON_TRIP';
    truck.destination = dispatch.destinationBranch;
    await truck.save();

    // Update consignments to DISPATCHED
    await Consignment.updateMany(
      { _id: { $in: dispatch.consignments } },
      {
        $set: {
          status: 'DISPATCHED',
          dispatchedAt: now,
        },
      }
    );

    res.json({
      success: true,
      message: `Truck ${truck.truckNumber} has departed for destination`,
      data: { dispatch, trip },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark trip/dispatch as delivered / arrived
// @route   POST /api/dispatch/:id/deliver
// @access  Private (Manager/Staff)
const markDelivered = async (req, res, next) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch record not found' });
    }

    if (dispatch.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Dispatch is already completed and marked as delivered',
      });
    }

    const truck = await Truck.findById(dispatch.truck);
    const now = new Date();

    // Update Trip record if exists
    const trip = await Trip.findOne({ dispatch: dispatch._id, status: 'IN_PROGRESS' });
    if (trip) {
      trip.arrivalTime = now;
      const durationMs = now.getTime() - new Date(trip.departureTime).getTime();
      let durationHours = Number((durationMs / (1000 * 60 * 60)).toFixed(2));

      // If delivery is marked quickly in a demo (duration < 1 hour), look up realistic corridor transit time
      if (durationHours < 1) {
        const Rate = require('../models/Rate');
        const corridorRate = await Rate.findOne({
          origin: dispatch.sourceBranch,
          destination: dispatch.destinationBranch,
        }) || await Rate.findOne({ destination: dispatch.destinationBranch });
        durationHours = corridorRate?.estimatedTransitHours || 24;
      }

      trip.durationHours = durationHours;
      trip.status = 'COMPLETED';
      await trip.save();
    }

    // Update Dispatch
    dispatch.status = 'COMPLETED';
    await dispatch.save();

    // Update Consignments
    await Consignment.updateMany(
      { _id: { $in: dispatch.consignments } },
      {
        $set: {
          status: 'DELIVERED',
          deliveredAt: now,
        },
      }
    );

    // Update Truck: now AVAILABLE at the DESTINATION branch!
    if (truck) {
      truck.status = 'AVAILABLE';
      truck.currentBranch = dispatch.destinationBranch; // relocated to destination!
      truck.destination = null;
      truck.lastAvailableAt = now;
      truck.lastTripCompletedAt = now;
      await truck.save();
    }

    // Trigger auto-allocation check at the new branch in case pending cargo is waiting!
    try {
      await runAutomaticAllocation();
    } catch (allocErr) {
      console.warn('Auto allocation check warning:', allocErr.message);
    }

    res.json({
      success: true,
      message: 'Dispatch delivered successfully. Truck is now available at destination branch.',
      data: dispatch,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDispatches,
  getDispatchById,
  createDispatch,
  markDeparted,
  markDelivered,
};
