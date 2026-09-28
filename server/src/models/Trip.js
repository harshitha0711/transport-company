const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
      required: [true, 'Truck reference is required'],
    },
    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Source branch is required'],
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Destination branch is required'],
    },
    dispatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispatch',
      default: null,
    },
    departureTime: {
      type: Date,
      required: [true, 'Departure time is required'],
      default: Date.now,
    },
    arrivalTime: {
      type: Date,
      default: null,
    },
    durationHours: {
      type: Number,
      default: 0,
    },
    idleTimeBeforeTripMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED'],
      default: 'IN_PROGRESS',
    },
    totalCargoVolume: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
