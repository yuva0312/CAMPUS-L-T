const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const {
  createClaim,
  getMyClaims,
  getClaimById,
  updateClaimStatus,
} = require('../controllers/claimController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/claims
 * @desc    Submit a new claim with proof image upload (Multer parses field 'proofImage')
 * @access  Private
 */
router.post(
  '/',
  protect,
  (req, res, next) => {
    upload.single('proofImage')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading proof image.',
        });
      }
      next();
    });
  },
  createClaim
);

/**
 * @route   GET /api/claims/my
 * @desc    Fetch all claims submitted by the logged-in user
 * @access  Private
 */
router.get('/my', protect, getMyClaims);

/**
 * @route   GET /api/claims/all
 * @desc    Fetch all claims for admin review panel
 * @access  Private/Admin
 */
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const Claim = require('../models/Claim');
    const { inMemoryClaims } = require('../utils/inMemoryStore');

    let dbClaims = [];
    try {
      dbClaims = await Claim.find()
        .populate('studentId', 'fullName studentId email phone department year')
        .populate('foundItemId')
        .sort({ createdAt: -1 });
    } catch (err) {
      console.warn('DB fetch failed, relying on in-memory store:', err.message);
    }

    // Merge DB and in-memory claims to prevent duplication
    const map = new Map();
    dbClaims.forEach((c) => {
      const cObj = c.toObject ? c.toObject() : { ...c };
      map.set(String(cObj._id), cObj);
    });

    inMemoryClaims.forEach((memC) => {
      map.set(String(memC._id), memC);
    });

    const allClaims = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())
    );

    return res.status(200).json({
      success: true,
      count: allClaims.length,
      data: allClaims,
    });
  } catch (error) {
    console.error('Fetch All Claims Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve claims for admin panel.',
    });
  }
});

/**
 * @route   GET /api/claims/:id
 * @desc    Fetch details for a specific claim by ID
 * @access  Private
 */
router.get('/:id', protect, getClaimById);

/**
 * @route   PATCH /api/claims/:id/status
 * @desc    Update claim status (approve/reject)
 * @access  Private/Admin
 */
router.patch('/:id/status', protect, adminOnly, updateClaimStatus);

module.exports = router;