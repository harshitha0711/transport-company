const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema(
  {
    dispatchNumber: {
      type: String,
      required: [true, 'Dispatch number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
      required: [true, 'Allocated truck is required'],
    },
    sourceBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Source branch is required'],
    },
    destinationBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Destination branch is required'],
    },
    consignments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consignment',
      },
    ],
    totalVolume: {
      type: Number,
      required: [true, 'Total volume is required'],
      min: [0.01, 'Total volume must be greater than 0'],
    },
    dispatchTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['PREPARED', 'IN_TRANSIT', 'COMPLETED'],
      default: 'PREPARED',
    },
    driverName: {
      type: String,
      trim: true,
      default: 'Assigned Driver',
    },
    driverPhone: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispatch', dispatchSchema);
