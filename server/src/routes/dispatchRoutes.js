const express = require('express');
const router = express.Router();
const {
  getDispatches,
  getDispatchById,
  createDispatch,
  markDeparted,
  markDelivered,
} = require('../controllers/dispatchController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getDispatches)
  .post(protect, authorize('ADMIN', 'MANAGER'), createDispatch);

router.get('/:id', protect, getDispatchById);
router.post('/:id/depart', protect, markDeparted);
router.post('/:id/deliver', protect, markDelivered);

module.exports = router;
