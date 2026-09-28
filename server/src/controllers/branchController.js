const Branch = require('../models/Branch');

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private
const getBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find().sort({ type: 1, name: 1 });
    res.json({ success: true, count: branches.length, data: branches });
  } catch (error) {
    next(error);
  }
};

// @desc    Get branch by ID
// @route   GET /api/branches/:id
// @access  Private
const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

// @desc    Create branch
// @route   POST /api/branches
// @access  Private (Manager/Admin)
const createBranch = async (req, res, next) => {
  try {
    const { name, city, code, address, type, phone, contactPerson } = req.body;

    const existing = await Branch.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Branch code '${code.toUpperCase()}' is already in use`,
      });
    }

    const branch = await Branch.create({
      name,
      city,
      code: code.toUpperCase(),
      address,
      type: type || 'BRANCH_OFFICE',
      phone,
      contactPerson,
    });

    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Manager/Admin)
const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    res.json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete branch
// @route   DELETE /api/branches/:id
// @access  Private (Admin)
const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.json({ success: true, message: 'Branch removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
};
