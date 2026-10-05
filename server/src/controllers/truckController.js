const Truck = require('../models/Truck');
const Trip = require('../models/Trip');
const Rate = require('../models/Rate');

// @desc    Get all trucks with optional status & branch filters
// @route   GET /api/trucks
// @access  Private
const getTrucks = async (req, res, next) => {
  try {
    const { status, branch } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (branch) filter.currentBranch = branch;

    const trucks = await Truck.find(filter)
      .populate('currentBranch', 'name city code')
      .populate('destination', 'name city code')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: trucks.length, data: trucks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get truck by ID with trip history
// @route   GET /api/trucks/:id
// @access  Private
const getTruckById = async (req, res, next) => {
  try {
    const truck = await Truck.findById(req.params.id)
      .populate('currentBranch', 'name city code')
      .populate('destination', 'name city code');

    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    const rawTrips = await Trip.find({ truck: truck._id })
      .populate('source', 'name city')
      .populate('destination', 'name city')
      .sort({ departureTime: -1 })
      .limit(10);

    const rates = await Rate.find();

    const trips = rawTrips.map((trip) => {
      const tObj = trip.toObject();

      // Ensure realistic transit hours (no 0 hrs from quick demo click)
      let transitHours = tObj.durationHours || 0;
      if (transitHours < 1) {
        const corridorRate = rates.find(
          (r) =>
            r.destination?.toString() === trip.destination?._id?.toString() &&
            (!r.origin || r.origin?.toString() === trip.source?._id?.toString())
        );
        transitHours = corridorRate?.estimatedTransitHours || (trip.status === 'IN_PROGRESS' ? 8 : 24);
      }
      tObj.durationHours = transitHours;

      // Mathematical Idle Time: Departure Time (T2) - Dock Available Time (T1)
      const idleMins = tObj.idleTimeBeforeTripMinutes || 0;
      const depTime = new Date(tObj.departureTime);
      const availTime = tObj.availableTimeBeforeTrip
        ? new Date(tObj.availableTimeBeforeTrip)
        : new Date(depTime.getTime() - idleMins * 60 * 1000);

      tObj.availableTimeBeforeTrip = availTime;
      tObj.idleMinutes = idleMins;
      tObj.idleHours = Number((idleMins / 60).toFixed(1));
      tObj.idleCalculation = `${depTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${availTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} = ${idleMins} mins (${Number((idleMins / 60).toFixed(1))} hrs)`;

      return tObj;
    });

    res.json({ success: true, data: { ...truck.toObject(), trips } });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new truck to fleet
// @route   POST /api/trucks
// @access  Private (Manager/Admin)
const createTruck = async (req, res, next) => {
  try {
    const {
      truckNumber,
      capacity,
      currentBranch,
      status,
      driverName,
      driverPhone,
      notes,
    } = req.body;

    const existing = await Truck.findOne({ truckNumber: truckNumber.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Truck number '${truckNumber.toUpperCase()}' is already registered`,
      });
    }

    const truck = await Truck.create({
      truckNumber: truckNumber.toUpperCase(),
      capacity: Number(capacity),
      currentBranch,
      status: status || 'AVAILABLE',
      driverName: driverName || 'Unassigned',
      driverPhone: driverPhone || '',
      lastAvailableAt: new Date(),
      notes,
    });

    const populated = await Truck.findById(truck._id).populate('currentBranch', 'name city code');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update truck
// @route   PUT /api/trucks/:id
// @access  Private (Manager/Admin)
const updateTruck = async (req, res, next) => {
  try {
    const truck = await Truck.findById(req.params.id);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    const oldStatus = truck.status;
    const newStatus = req.body.status;

    // Maintain timestamps when transitioning states
    if (newStatus && newStatus !== oldStatus) {
      if (newStatus === 'AVAILABLE' || newStatus === 'IDLE') {
        req.body.lastAvailableAt = new Date();
      } else if (newStatus === 'LOADING') {
        req.body.lastAllocatedAt = new Date();
      }
    }

    if (req.body.truckNumber) {
      req.body.truckNumber = req.body.truckNumber.toUpperCase();
    }

    const updatedTruck = await Truck.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('currentBranch', 'name city code')
      .populate('destination', 'name city code');

    res.json({ success: true, data: updatedTruck });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick status change (e.g. MAINTENANCE, IDLE, AVAILABLE)
// @route   PATCH /api/trucks/:id/status
// @access  Private (Manager/Admin)
const updateTruckStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['AVAILABLE', 'LOADING', 'ON_TRIP', 'IDLE', 'MAINTENANCE'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const truck = await Truck.findById(req.params.id);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    truck.status = status;
    if (notes !== undefined) truck.notes = notes;

    if (status === 'AVAILABLE' || status === 'IDLE') {
      truck.lastAvailableAt = new Date();
      truck.destination = null;
    } else if (status === 'LOADING') {
      truck.lastAllocatedAt = new Date();
    }

    await truck.save();

    const populated = await Truck.findById(truck._id)
      .populate('currentBranch', 'name city code')
      .populate('destination', 'name city code');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete truck
// @route   DELETE /api/trucks/:id
// @access  Private (Admin)
const deleteTruck = async (req, res, next) => {
  try {
    const truck = await Truck.findById(req.params.id);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    if (truck.status === 'LOADING' || truck.status === 'ON_TRIP') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete truck while it is ${truck.status}. Complete dispatch or free the truck first.`,
      });
    }

    await Truck.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Truck deleted from fleet' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  updateTruckStatus,
  deleteTruck,
};
