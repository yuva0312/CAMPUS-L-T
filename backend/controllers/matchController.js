const mongoose = require('mongoose');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Match = require('../models/Match');
const { getAIMatchScore } = require('../services/aiService');
const { createNotificationHelper } = require('./notificationController');
const { inMemoryLostItems, inMemoryFoundItems } = require('../utils/inMemoryStore');

// Helper to check DB connection state
const isDbConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

// @desc    Get potential matches for a reported lost item by invoking Python FastAPI AI Service & saving to Match model
// @route   GET /api/matches/lost/:lostItemId
// @access  Private
exports.getMatchesForLostItem = async (req, res) => {
  try {
    const { lostItemId } = req.params;

    console.log('[MatchEngine] Received match request for lostItemId:', lostItemId);

    let lostItem = null;
    let candidateFoundItems = [];

    // 1. Retrieve the exact Lost Item (DB first if connected, then in-memory store)
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(lostItemId)) {
      lostItem = await LostItem.findById(lostItemId);
    }

    if (!lostItem) {
      lostItem = inMemoryLostItems.find(
        (item) => item._id && item._id.toString() === lostItemId.toString()
      );
    }

    if (!lostItem) {
      console.warn(`[MatchEngine] Selected lost item with ID ${lostItemId} not found.`);
      return res.status(404).json({
        success: false,
        message: 'Selected lost item report not found.',
      });
    }

    console.log('[MatchEngine] Selected Lost Item Details:', {
      id: lostItem._id || lostItem.id,
      itemName: lostItem.itemName,
      category: lostItem.category,
      location: lostItem.location,
    });

    // 2. Fetch candidate found items (status not closed or returned)
    if (isDbConnected()) {
      candidateFoundItems = await FoundItem.find({ status: { $nin: ['closed', 'returned'] } });
    }

    // Include/fallback to in-memory found items if DB items are empty or DB not connected
    if (candidateFoundItems.length === 0 && inMemoryFoundItems.length > 0) {
      candidateFoundItems = inMemoryFoundItems.filter(
        (item) => !['closed', 'returned'].includes(item.status)
      );
    }

    console.log(`[MatchEngine] Number of Found Items Retrieved: ${candidateFoundItems.length}`);

    if (candidateFoundItems.length === 0) {
      console.log('[MatchEngine] No candidate found items available to match.');
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // 3. Process candidate found items through Python FastAPI AI Service
    const matches = [];

    for (const foundItem of candidateFoundItems) {
      const foundId = foundItem._id || foundItem.id;
      console.log(`[MatchEngine] Comparing Lost Item (${lostItem.itemName}) against Found Item ID: ${foundId} (${foundItem.itemName || foundItem.category})`);

      // Call Python FastAPI AI Service to calculate semantic similarity & score
      const aiResult = await getAIMatchScore(lostItem, foundItem);
      const score = aiResult.matchScore;
      const level = aiResult.matchLevel;

      console.log(`[MatchEngine] Found Item ID: ${foundId} -> Similarity Score: ${score}% (${level})`);

      // Store/upsert match record in MongoDB Match collection if DB is connected & IDs are valid ObjectIds
      if (isDbConnected() && mongoose.Types.ObjectId.isValid(lostItemId) && mongoose.Types.ObjectId.isValid(foundId)) {
        try {
          await Match.findOneAndUpdate(
            { lostItemId: lostItemId, foundItemId: foundId },
            {
              lostItemId: lostItemId,
              foundItemId: foundId,
              matchScore: score,
              matchLevel: level,
              status: 'potential_match',
            },
            { upsert: true, new: true }
          );

          if (score >= 60 && lostItem && lostItem.userId) {
            await createNotificationHelper({
              userId: lostItem.userId,
              title: 'Potential Match Found',
              message: `A potential match was found for your lost ${lostItem.itemName || 'item'}. Match Score: ${score}%.`,
              type: 'potential_match',
              relatedItemId: foundId,
            });
          }
        } catch (dbErr) {
          console.warn('[MatchEngine] Match model upsert warning:', dbErr.message);
        }
      }

      // PRIVACY GUARANTEE: Redact private found item details (brand, colour, uniqueMark, privateDescription, imageUrl)
      matches.push({
        foundItemId: foundId,
        category: foundItem.category || 'General',
        generalItemName: foundItem.itemName || 'Found Campus Item',
        foundLocation: foundItem.location || 'Campus Location',
        specificLocation: foundItem.specificLocation || '',
        foundDate: foundItem.foundDate || new Date(),
        approximateTime: foundItem.foundTime || 'N/A',
        timeRange: foundItem.timeRange || '',
        matchScore: score,
        matchLevel: level,
        status: foundItem.status || 'reported',
        aiSource: aiResult.source,
      });
    }

    // 4. Return potential matches sorted by highest match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    console.log(`[MatchEngine] Final Sorted Matches count: ${matches.length}`);

    return res.status(200).json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    console.error('[MatchEngine] Get matches error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching matches.',
      error: error.message,
    });
  }
};
