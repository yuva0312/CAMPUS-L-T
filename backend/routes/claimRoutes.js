const express = require('express');
const router = express.Router();
const { createClaim, getMyClaims, getClaimById } = require('../controllers/claimController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createClaim);
router.get('/my', protect, getMyClaims);
router.get('/:id', protect, getClaimById);

module.exports = router;
