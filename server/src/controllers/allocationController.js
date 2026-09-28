const {
  getPendingCargoSummary,
  runAutomaticAllocation,
} = require('../services/allocationService');

// @desc    Get pending cargo status grouped by destination
// @route   GET /api/allocation/pending
// @access  Private
const getPendingStatus = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const summary = await getPendingCargoSummary(branchId);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger automatic truck allocation algorithm
// @route   POST /api/allocation/run
// @access  Private (Manager/Admin)
const triggerAllocation = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await runAutomaticAllocation(userId);
    res.json({
      success: true,
      message:
        result.totalAllocated > 0
          ? `Successfully allocated ${result.totalAllocated} truck(s) for pending destinations`
          : 'Allocation run completed. No new trucks met allocation criteria.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingStatus,
  triggerAllocation,
};
