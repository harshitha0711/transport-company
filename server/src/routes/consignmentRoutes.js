const express = require('express');
const router = express.Router();
const {
  getConsignments,
  getConsignmentById,
  createConsignment,
  updateConsignment,
  deleteConsignment,
} = require('../controllers/consignmentController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getConsignments)
  .post(protect, createConsignment);

router.route('/:id')
  .get(protect, getConsignmentById)
  .put(protect, updateConsignment)
  .delete(protect, authorize('ADMIN', 'MANAGER'), deleteConsignment);

module.exports = router;
