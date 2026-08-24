const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getDashboardStats,
  getAllClaims,
  approveClaim,
  markClaimAsRecovered,
  rejectClaim,
  requestMoreVerification,
  getAllLostItems,
  getAllFoundItems,
  getAllMatches,
} = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminMiddleware');

// Public Admin Login
router.post('/login', adminLogin);

// Protected Admin Endpoints
router.get('/dashboard', adminProtect, getDashboardStats);
router.get('/claims', adminProtect, getAllClaims);
router.put('/claims/:id/approve', adminProtect, approveClaim);
router.put('/claims/:id/recover', adminProtect, markClaimAsRecovered);
router.put('/claims/:id/reject', adminProtect, rejectClaim);
router.put('/claims/:id/request-info', adminProtect, requestMoreVerification);

router.get('/lost-items', adminProtect, getAllLostItems);
router.get('/found-items', adminProtect, getAllFoundItems);
router.get('/matches', adminProtect, getAllMatches);

module.exports = router;
