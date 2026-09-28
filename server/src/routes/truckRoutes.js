const express = require('express');
const router = express.Router();
const {
  getTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  updateTruckStatus,
  deleteTruck,
} = require('../controllers/truckController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getTrucks)
  .post(protect, authorize('ADMIN', 'MANAGER'), createTruck);

router.patch('/:id/status', protect, authorize('ADMIN', 'MANAGER'), updateTruckStatus);

router.route('/:id')
  .get(protect, getTruckById)
  .put(protect, authorize('ADMIN', 'MANAGER'), updateTruck)
  .delete(protect, authorize('ADMIN'), deleteTruck);

module.exports = router;
