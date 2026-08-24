const mongoose = require('mongoose');

const foundItemSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Campus location is required'],
      trim: true,
    },
    specificLocation: {
      type: String,
      trim: true,
      default: '',
    },
    foundDate: {
      type: Date,
      required: [true, 'Found date is required'],
    },
    foundTime: {
      type: String,
      trim: true,
      default: '',
    },
    timeRange: {
      type: String,
      trim: true,
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    colour: {
      type: String,
      trim: true,
      default: '',
    },
    uniqueMark: {
      type: String,
      trim: true,
      default: '',
    },
    specialFeature: {
      type: String,
      trim: true,
      default: '',
    },
    damage: {
      type: String,
      trim: true,
      default: '',
    },
    privateDescription: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['reported', 'under_review', 'matched', 'claimed', 'returned', 'closed'],
      default: 'reported',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

foundItemSchema.virtual('actualBrand').get(function () {
  return this.brand || 'Unspecified';
});

foundItemSchema.virtual('actualColour').get(function () {
  return this.colour || 'Unspecified';
});

module.exports = mongoose.model('FoundItem', foundItemSchema);
