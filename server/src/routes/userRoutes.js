const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize('ADMIN', 'MANAGER'), getUsers)
  .post(protect, authorize('ADMIN', 'MANAGER'), createUser);

router.route('/:id')
  .put(protect, authorize('ADMIN', 'MANAGER'), updateUser)
  .delete(protect, authorize('ADMIN'), deleteUser);

module.exports = router;
