const express = require('express');
const router = express.Router();
const {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} = require('../controllers/branchController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getBranches)
  .post(protect, authorize('ADMIN', 'MANAGER'), createBranch);

router.route('/:id')
  .get(protect, getBranchById)
  .put(protect, authorize('ADMIN', 'MANAGER'), updateBranch)
  .delete(protect, authorize('ADMIN'), deleteBranch);

module.exports = router;
