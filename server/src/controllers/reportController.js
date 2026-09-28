const {
  getDashboardMetrics,
  getDestinationMetrics,
  getTruckUsageReport,
  getWaitingTimeReport,
} = require('../services/analyticsService');

// @desc    Get manager dashboard KPIs & summary
// @route   GET /api/reports/dashboard
// @access  Private (Manager/Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await getDashboardMetrics();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue by destination with date filters
// @route   GET /api/reports/revenue
// @access  Private (Manager/Admin)
const getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getDestinationMetrics(startDate, endDate);
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cargo volume handled by destination
// @route   GET /api/reports/volume
// @access  Private (Manager/Admin)
const getVolumeReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getDestinationMetrics(startDate, endDate);
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get truck usage report (trips, hours, idle)
// @route   GET /api/reports/truck-usage
// @access  Private (Manager/Admin)
const getTruckUsage = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await getTruckUsageReport(startDate, endDate);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consignment waiting time analytics
// @route   GET /api/reports/waiting-time
// @access  Private (Manager/Admin)
const getWaitingTime = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await getWaitingTimeReport(startDate, endDate);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getVolumeReport,
  getTruckUsage,
  getWaitingTime,
};
