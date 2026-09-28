const express = require('express');
const router = express.Router();
const {
  getRates,
  getRateByDestination,
  createRate,
  updateRate,
  deleteRate,
} = require('../controllers/rateController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getRates)
  .post(protect, authorize('ADMIN', 'MANAGER'), createRate);

router.get('/destination/:destinationId', protect, getRateByDestination);

router.route('/:id')
  .put(protect, authorize('ADMIN', 'MANAGER'), updateRate)
  .delete(protect, authorize('ADMIN'), deleteRate);

module.exports = router;
