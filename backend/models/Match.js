const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    lostItemId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'LostItem',
      required: true,
    },
    foundItemId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'FoundItem',
      required: true,
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchLevel: {
      type: String,
      enum: ['High Potential Match', 'Possible Match', 'Low Similarity'],
      required: true,
    },
    status: {
      type: String,
      enum: ['potential_match', 'claim_requested', 'under_review', 'verified', 'rejected'],
      default: 'potential_match',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure fast match lookup & uniqueness
matchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
