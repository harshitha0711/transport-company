const Rate = require('../models/Rate');

// @desc    Get all destination freight rates
// @route   GET /api/rates
// @access  Private
const getRates = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.origin) query.origin = req.query.origin;
    if (req.query.destination) query.destination = req.query.destination;

    const rates = await Rate.find(query)
      .populate('origin', 'name city code type')
      .populate('destination', 'name city code type')
      .sort({ 'origin.city': 1, 'destination.city': 1 });

    res.json({ success: true, count: rates.length, data: rates });
  } catch (error) {
    next(error);
  }
};

// @desc    Get rate for a specific corridor or destination
// @route   GET /api/rates/destination/:destinationId
// @access  Private
const getRateByDestination = async (req, res, next) => {
  try {
    const destId = req.params.destinationId;
    const originId = req.query.origin;

    let rate = null;
    if (originId) {
      rate = await Rate.findOne({ origin: originId, destination: destId })
        .populate('origin', 'name city code')
        .populate('destination', 'name city code');
    }

    if (!rate) {
      rate = await Rate.findOne({ destination: destId })
        .populate('origin', 'name city code')
        .populate('destination', 'name city code');
    }

    if (!rate) {
      return res.status(404).json({
        success: false,
        message: 'No rate tariff configured for this corridor / destination',
      });
    }

    res.json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a corridor freight rate
// @route   POST /api/rates
// @access  Private (Manager/Admin)
const createRate = async (req, res, next) => {
  try {
    const { origin, destination, ratePerCubicMeter, estimatedTransitHours, description } = req.body;

    const query = { destination };
    if (origin) {
      query.origin = origin;
    }

    const existing = await Rate.findOne(query);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A tariff rate is already configured for this corridor. Update the existing rate instead.',
      });
    }

    const rate = await Rate.create({
      origin: origin || null,
      destination,
      ratePerCubicMeter: Number(ratePerCubicMeter),
      estimatedTransitHours: Number(estimatedTransitHours) || 24,
      description,
    });

    const populated = await Rate.findById(rate._id)
      .populate('origin', 'name city code')
      .populate('destination', 'name city code');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update destination rate
// @route   PUT /api/rates/:id
// @access  Private (Manager/Admin)
const updateRate = async (req, res, next) => {
  try {
    const rate = await Rate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('origin', 'name city code')
      .populate('destination', 'name city code');

    if (!rate) {
      return res.status(404).json({ success: false, message: 'Rate tariff not found' });
    }

    res.json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete destination rate
// @route   DELETE /api/rates/:id
// @access  Private (Admin)
const deleteRate = async (req, res, next) => {
  try {
    const rate = await Rate.findByIdAndDelete(req.params.id);
    if (!rate) {
      return res.status(404).json({ success: false, message: 'Rate tariff not found' });
    }
    res.json({ success: true, message: 'Tariff rate deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRates,
  getRateByDestination,
  createRate,
  updateRate,
  deleteRate,
};
