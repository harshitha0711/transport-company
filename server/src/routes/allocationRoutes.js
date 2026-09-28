const express = require('express');
const router = express.Router();
const {
  getPendingStatus,
  triggerAllocation,
} = require('../controllers/allocationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/pending', protect, getPendingStatus);
router.post('/run', protect, authorize('ADMIN', 'MANAGER'), triggerAllocation);

module.exports = router;
