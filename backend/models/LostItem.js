const mongoose = require('mongoose');

const lostItemSchema = new mongoose.Schema(
  {
    userId: {
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
    lostDate: {
      type: Date,
      required: [true, 'Lost date is required'],
    },
    lostTime: {
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
      enum: ['searching', 'potential_match', 'claimed', 'recovered', 'closed'],
      default: 'searching',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LostItem', lostItemSchema);
