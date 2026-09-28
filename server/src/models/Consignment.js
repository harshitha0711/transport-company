const mongoose = require('mongoose');

const consignmentSchema = new mongoose.Schema(
  {
    consignmentNumber: {
      type: String,
      required: [true, 'Consignment number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    sender: {
      name: { type: String, required: [true, 'Sender name is required'], trim: true },
      phone: { type: String, required: [true, 'Sender phone is required'], trim: true },
      address: { type: String, required: [true, 'Sender address is required'], trim: true },
      gstNumber: { type: String, trim: true, default: '' },
    },
    receiver: {
      name: { type: String, required: [true, 'Receiver name is required'], trim: true },
      phone: { type: String, required: [true, 'Receiver phone is required'], trim: true },
      address: { type: String, required: [true, 'Receiver address is required'], trim: true },
      gstNumber: { type: String, trim: true, default: '' },
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
    volume: {
      type: Number,
      required: [true, 'Volume in cubic meters is required'],
      min: [0.01, 'Volume must be greater than 0'],
    },
    ratePerCubicMeter: {
      type: Number,
      required: [true, 'Rate per cubic meter is required'],
      min: [1, 'Rate must be greater than 0'],
    },
    charge: {
      type: Number,
      required: [true, 'Transport charge is required'],
      min: [0, 'Charge must be positive'],
    },
    status: {
      type: String,
      enum: ['RECEIVED', 'WAITING_FOR_TRUCK', 'ALLOCATED', 'DISPATCHED', 'DELIVERED'],
      default: 'WAITING_FOR_TRUCK',
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    allocatedAt: {
      type: Date,
      default: null,
    },
    dispatchedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    assignedTruck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
      default: null,
    },
    dispatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispatch',
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'TO_PAY', 'CREDIT'],
      default: 'PAID',
    },
    description: {
      type: String,
      trim: true,
      default: 'General Cargo Goods',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Virtual for consignment waiting time in hours
consignmentSchema.virtual('waitingTimeHours').get(function () {
  const endTime = this.allocatedAt || this.dispatchedAt || new Date();
  const startTime = this.receivedAt;
  if (!startTime) return 0;
  const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
  return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
});

consignmentSchema.set('toJSON', { virtuals: true });
consignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Consignment', consignmentSchema);
