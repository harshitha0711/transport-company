const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema(
  {
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Destination branch is required'],
      unique: true,
    },
    ratePerCubicMeter: {
      type: Number,
      required: [true, 'Rate per cubic meter is required'],
      min: [1, 'Rate must be greater than 0'],
    },
    estimatedTransitHours: {
      type: Number,
      default: 24,
      min: [1, 'Transit hours must be at least 1'],
    },
    description: {
      type: String,
      trim: true,
      default: 'Standard Freight Tariff',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rate', rateSchema);
