const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRevenueReport,
  getVolumeReport,
  getTruckUsage,
  getWaitingTime,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardStats);
router.get('/revenue', protect, authorize('ADMIN', 'MANAGER'), getRevenueReport);
router.get('/volume', protect, authorize('ADMIN', 'MANAGER'), getVolumeReport);
router.get('/truck-usage', protect, authorize('ADMIN', 'MANAGER'), getTruckUsage);
router.get('/waiting-time', protect, authorize('ADMIN', 'MANAGER'), getWaitingTime);

module.exports = router;
