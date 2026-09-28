const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema(
  {
    truckNumber: {
      type: String,
      required: [true, 'Truck number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Truck capacity is required'],
      min: [1, 'Capacity must be greater than 0'],
    },
    currentBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Current branch is required'],
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'LOADING', 'ON_TRIP', 'IDLE', 'MAINTENANCE'],
      default: 'AVAILABLE',
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    driverName: {
      type: String,
      trim: true,
      default: 'Unassigned',
    },
    driverPhone: {
      type: String,
      trim: true,
      default: '',
    },
    // Timestamps for idle and trip tracking
    lastAvailableAt: {
      type: Date,
      default: Date.now,
    },
    lastAllocatedAt: {
      type: Date,
      default: null,
    },
    lastTripCompletedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Truck', truckSchema);
