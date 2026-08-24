const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['potential_match', 'claim_submitted', 'claim_approved', 'claim_rejected', 'item_returned', 'item_recovered', 'recovered'],
      required: true,
    },
    relatedItemId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    relatedClaimId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
