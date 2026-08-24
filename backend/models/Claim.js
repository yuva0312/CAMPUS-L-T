const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: true,
    },
    lostItemId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'LostItem',
    },
    foundItemId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'FoundItem',
      required: true,
    },
    matchId: {
      type: String,
    },
    verificationAnswers: {
      brand: { type: String, required: true },
      colour: { type: String, required: true },
      uniqueMark: { type: String, default: '' },
      lostLocation: { type: String, required: true },
      lostDateAndTime: { type: String, required: true },
      additionalFeature: { type: String, default: '' },
    },
    verificationScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Claim', claimSchema);
