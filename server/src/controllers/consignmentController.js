const Consignment = require('../models/Consignment');
const Rate = require('../models/Rate');
const Branch = require('../models/Branch');
const { runAutomaticAllocation } = require('../services/allocationService');

// Helper to generate unique consignment number: TCC-CN-YYYYMMDD-XXXX
const generateConsignmentNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `TCC-CN-${dateStr}-${randNum}`;
};

// @desc    Get all consignments with filters & search
// @route   GET /api/consignments
// @access  Private
const getConsignments = async (req, res, next) => {
  try {
    const { status, sourceBranch, destinationBranch, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (sourceBranch) filter.sourceBranch = sourceBranch;
    if (destinationBranch) filter.destinationBranch = destinationBranch;

    if (search) {
      filter.$or = [
        { consignmentNumber: { $regex: search, $options: 'i' } },
        { 'sender.name': { $regex: search, $options: 'i' } },
        { 'receiver.name': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Consignment.countDocuments(filter);
    const consignments = await Consignment.find(filter)
      .populate('sourceBranch', 'name city code')
      .populate('destinationBranch', 'name city code')
      .populate('assignedTruck', 'truckNumber capacity status')
      .populate('dispatchId', 'dispatchNumber dispatchTime status')
      .populate('createdBy', 'name email')
      .sort({ receivedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: consignments.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: consignments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consignment by ID with bill data
// @route   GET /api/consignments/:id
// @access  Private
const getConsignmentById = async (req, res, next) => {
  try {
    const consignment = await Consignment.findById(req.params.id)
      .populate('sourceBranch', 'name city code address phone')
      .populate('destinationBranch', 'name city code address phone')
      .populate('assignedTruck', 'truckNumber capacity driverName driverPhone')
      .populate('dispatchId')
      .populate('createdBy', 'name email');

    if (!consignment) {
      return res.status(404).json({ success: false, message: 'Consignment not found' });
    }

    // Individual waiting time calculation
    const endTime = consignment.allocatedAt || consignment.dispatchedAt || new Date();
    const diffMs = new Date(endTime).getTime() - new Date(consignment.receivedAt).getTime();
    const waitingTimeMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const waitingTimeHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

    res.json({
      success: true,
      data: {
        ...consignment.toObject(),
        waitingTimeMinutes,
        waitingTimeHours,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new consignment & auto calculate rate from DB & evaluate allocation
// @route   POST /api/consignments
// @access  Private
const createConsignment = async (req, res, next) => {
  try {
    const {
      sender,
      receiver,
      sourceBranch,
      destinationBranch,
      volume,
      paymentStatus,
      description,
    } = req.body;

    // Validate branches
    if (sourceBranch === destinationBranch) {
      return res.status(400).json({
        success: false,
        message: 'Source branch and destination branch cannot be the same',
      });
    }

    // Step 1: Look up origin -> destination corridor rate from DB (strictly not hardcoded)
    let rateDoc = await Rate.findOne({ origin: sourceBranch, destination: destinationBranch });
    if (!rateDoc) {
      rateDoc = await Rate.findOne({ destination: destinationBranch });
    }
    if (!rateDoc) {
      return res.status(400).json({
        success: false,
        message: 'No transport freight rate is configured in the database for the selected route. Please set a rate first.',
      });
    }

    const ratePerCubicMeter = rateDoc.ratePerCubicMeter;
    const parsedVolume = Number(volume);
    if (!parsedVolume || parsedVolume <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cargo volume must be greater than 0 cubic meters',
      });
    }

    // Calculate transport charge: volume × destination rate
    const charge = Number((parsedVolume * ratePerCubicMeter).toFixed(2));
    const consignmentNumber = generateConsignmentNumber();

    const consignment = await Consignment.create({
      consignmentNumber,
      sender,
      receiver,
      sourceBranch,
      destinationBranch,
      volume: parsedVolume,
      ratePerCubicMeter,
      charge,
      estimatedTransitHours: rateDoc.estimatedTransitHours || 24,
      paymentStatus: paymentStatus || 'PAID',
      description: description || 'General Consignment Freight',
      status: 'WAITING_FOR_TRUCK',
      receivedAt: new Date(),
      createdBy: req.user ? req.user.id : null,
    });

    // Populate for complete bill response
    const populated = await Consignment.findById(consignment._id)
      .populate('sourceBranch', 'name city code address phone')
      .populate('destinationBranch', 'name city code address phone');

    // Trigger automatic truck allocation engine check
    // If pending volume reaches >= 500m³, truck will be immediately allocated!
    let allocationResult = null;
    try {
      allocationResult = await runAutomaticAllocation(req.user ? req.user.id : null);
    } catch (allocErr) {
      console.warn('Auto allocation check warning:', allocErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Consignment booked successfully',
      data: populated,
      allocationTriggered: allocationResult && allocationResult.totalAllocated > 0,
      allocationResult,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update consignment
// @route   PUT /api/consignments/:id
// @access  Private (Manager/Staff)
const updateConsignment = async (req, res, next) => {
  try {
    const consignment = await Consignment.findById(req.params.id);
    if (!consignment) {
      return res.status(404).json({ success: false, message: 'Consignment not found' });
    }

    if (consignment.status === 'DISPATCHED' || consignment.status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit consignment in ${consignment.status} status`,
      });
    }

    // If volume, source, or destination changes, recalculate charge
    if (
      req.body.volume !== undefined ||
      req.body.sourceBranch !== undefined ||
      req.body.destinationBranch !== undefined
    ) {
      const srcId = req.body.sourceBranch || consignment.sourceBranch;
      const destId = req.body.destinationBranch || consignment.destinationBranch;
      let rateDoc = await Rate.findOne({ origin: srcId, destination: destId });
      if (!rateDoc) {
        rateDoc = await Rate.findOne({ destination: destId });
      }
      if (rateDoc) {
        req.body.ratePerCubicMeter = rateDoc.ratePerCubicMeter;
        req.body.estimatedTransitHours = rateDoc.estimatedTransitHours || 24;
        const vol = req.body.volume !== undefined ? Number(req.body.volume) : consignment.volume;
        req.body.charge = Number((vol * rateDoc.ratePerCubicMeter).toFixed(2));
      }
    }

    const updated = await Consignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('sourceBranch', 'name city code')
      .populate('destinationBranch', 'name city code');

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete consignment
// @route   DELETE /api/consignments/:id
// @access  Private (Manager/Admin)
const deleteConsignment = async (req, res, next) => {
  try {
    const consignment = await Consignment.findById(req.params.id);
    if (!consignment) {
      return res.status(404).json({ success: false, message: 'Consignment not found' });
    }

    if (consignment.status !== 'WAITING_FOR_TRUCK' && consignment.status !== 'RECEIVED') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete consignment that is already ${consignment.status}`,
      });
    }

    await Consignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Consignment cancelled and removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConsignments,
  getConsignmentById,
  createConsignment,
  updateConsignment,
  deleteConsignment,
};
