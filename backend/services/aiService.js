const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Format item object into a rich semantic text string for AI embedding comparison.
 */
const formatItemText = (item, isLost = true) => {
  const parts = [];

  if (item.itemName) parts.push(`Item: ${item.itemName}`);
  if (item.category) parts.push(`Category: ${item.category}`);
  if (item.location) parts.push(`Location: ${item.location}`);
  if (item.specificLocation) parts.push(`Specific Location: ${item.specificLocation}`);
  if (item.brand) parts.push(`Brand: ${item.brand}`);
  if (item.colour) parts.push(`Colour: ${item.colour}`);
  if (item.privateDescription) parts.push(`Description: ${item.privateDescription}`);

  return parts.join('. ');
};

/**
 * Compute AI match score between a lost item and a found item by calling Python FastAPI.
 */
const getAIMatchScore = async (lostItem, foundItem) => {
  const lostText = formatItemText(lostItem, true);
  const foundText = formatItemText(foundItem, false);

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/match`,
      {
        lost_text: lostText,
        found_text: foundText,
      },
      { timeout: 3500 }
    );

    if (response.data && response.data.success) {
      return {
        matchScore: response.data.matchScore,
        matchLevel: response.data.matchLevel,
        details: response.data.details,
        source: 'Python FastAPI AI Service',
      };
    }
  } catch (error) {
    console.warn(`[AI Service Warning] Python FastAPI unreachable (${error.message}). Using Node fallback math.`);
  }

  // Node.js fallback math if Python AI service is offline
  let score = 0;
  if (lostItem.category && foundItem.category && lostItem.category.toLowerCase() === foundItem.category.toLowerCase()) {
    score += 45;
  }
  if (lostItem.location && foundItem.location) {
    if (lostItem.location.toLowerCase() === foundItem.location.toLowerCase()) {
      score += 42;
    } else {
      score += 20;
    }
  }

  score = Math.min(95, Math.max(35, score));
  let matchLevel = 'Low Similarity';
  if (score >= 80) matchLevel = 'High Potential Match';
  else if (score >= 60) matchLevel = 'Possible Match';

  return {
    matchScore: score,
    matchLevel,
    source: 'Node.js Fallback',
  };
};

module.exports = {
  getAIMatchScore,
  formatItemText,
};
