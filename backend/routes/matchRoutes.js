const express = require('express');
const router = express.Router();
const { getMatchesForLostItem } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/lost/:lostItemId', protect, getMatchesForLostItem);

module.exports = router;
