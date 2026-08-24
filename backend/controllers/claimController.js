const mongoose = require('mongoose');
const Claim = require('../models/Claim');
const FoundItem = require('../models/FoundItem');
const LostItem = require('../models/LostItem');
const { createNotificationHelper } = require('./notificationController');
const { inMemoryClaims, saveInMemoryStore } = require('../utils/inMemoryStore');

const isDbConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

/**
 * Calculate string match confidence between submitted answer and item property
 */
const compareField = (input, target) => {
  if (!target || !target.trim()) return 0.6; // Neutral baseline if field is unpopulated in record
  if (!input || !input.trim()) return 0.2;

  const str1 = input.toLowerCase().trim();
  const str2 = target.toLowerCase().trim();

  if (str1 === str2) return 1.0; // Exact match (100%)
  if (str1.includes(str2) || str2.includes(str1)) return 0.75; // Substring match (75%)

  const words1 = str1.split(/\s+/).filter((w) => w.length > 2);
  const words2 = str2.split(/\s+/).filter((w) => w.length > 2);
  const common = words1.filter((w) => words2.includes(w));
  if (common.length > 0) return 0.5; // Partial word match (50%)

  return 0.25;
};

/**
 * Calculate Student Care verification score comparing student's claim answers with actual found/lost item record.
 * Evaluates: Brand, Colour, Unique Mark, Location, Time, Special Feature.
 */
const calculateVerificationScore = (answers, foundItem, lostItem) => {
  if (!foundItem && !lostItem) return 82; // Fallback demo score

  const brandTarget = (foundItem?.brand || lostItem?.brand || '').trim();
  const colourTarget = (foundItem?.colour || lostItem?.colour || '').trim();
  const markTarget = (foundItem?.uniqueMark || lostItem?.uniqueMark || '').trim();
  const locTarget = `${foundItem?.location || ''} ${foundItem?.specificLocation || ''}`.trim();
  const timeTarget = `${foundItem?.foundTime || ''} ${foundItem?.timeRange || ''} ${foundItem?.foundDate ? new Date(foundItem.foundDate).toLocaleDateString() : ''}`.trim();
  const featureTarget = `${foundItem?.specialFeature || ''} ${foundItem?.privateDescription || ''} ${foundItem?.damage || ''}`.trim();

  const brandScore = compareField(answers.brand, brandTarget);
  const colourScore = compareField(answers.colour, colourTarget);
  const markScore = answers.uniqueMark ? compareField(answers.uniqueMark, markTarget) : 0.6;
  const locScore = compareField(answers.lostLocation, locTarget);
  const timeScore = compareField(answers.lostDateAndTime, timeTarget);
  const featureScore = answers.additionalFeature ? compareField(answers.additionalFeature, featureTarget) : 0.6;

  // Weighted calculation (100% total)
  const score =
    brandScore * 20 +
    colourScore * 20 +
    markScore * 20 +
    locScore * 15 +
    timeScore * 15 +
    featureScore * 10;

  return Math.round(Math.min(100, Math.max(25, score)));
};

// @desc    Submit a new claim request for a potential match
// @route   POST /api/claims
// @access  Private
const createClaim = async (req, res) => {
  try {
    const { matchId, lostItemId, foundItemId, verificationAnswers } = req.body;
    const studentId = req.user.id || req.user._id;

    if (
      !verificationAnswers ||
      !verificationAnswers.brand ||
      !verificationAnswers.colour ||
      !verificationAnswers.lostLocation ||
      !verificationAnswers.lostDateAndTime
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required verification questions.',
      });
    }

    const userProfile = {
      _id: studentId,
      id: studentId,
      fullName: req.user.fullName || 'Pavi',
      studentId: req.user.studentId || 'PAVI1234',
      email: req.user.email || '231501177@rajalakshmi.edu.in',
      phone: req.user.phone || '9600929978',
      department: req.user.department || 'Artificial Intelligence & Machine Learning',
      year: req.user.year || '4th Year (Senior)',
    };

    let foundItem = null;
    let lostItem = null;

    if (isDbConnected()) {
      try {
        foundItem = await FoundItem.findById(foundItemId);
      } catch (err) {
        foundItem = await FoundItem.findOne({ _id: foundItemId });
      }
      if (lostItemId) {
        try {
          lostItem = await LostItem.findById(lostItemId);
        } catch (err) {
          lostItem = await LostItem.findOne({ _id: lostItemId });
        }
      }
    }

    const verificationScore = calculateVerificationScore(verificationAnswers, foundItem, lostItem);

    if (isDbConnected()) {
      const claim = await Claim.create({
        studentId,
        lostItemId: lostItemId || null,
        foundItemId: foundItemId,
        matchId: matchId || `match_${Date.now()}`,
        verificationAnswers,
        verificationScore,
        status: 'pending',
      });

      // Synchronize into inMemoryStore so admin and student portals ALWAYS see exact student profile immediately
      const claimObj = claim.toObject ? claim.toObject() : { ...claim };
      claimObj.studentId = userProfile;
      claimObj.studentName = userProfile.fullName;
      claimObj.studentEmail = userProfile.email;
      claimObj.studentPhone = userProfile.phone;
      claimObj.studentRegId = userProfile.studentId;
      claimObj.studentDept = userProfile.department;
      claimObj.studentYear = userProfile.year;

      const existingIdx = inMemoryClaims.findIndex((c) => String(c._id) === String(claimObj._id));
      if (existingIdx >= 0) {
        inMemoryClaims[existingIdx] = claimObj;
      } else {
        inMemoryClaims.unshift(claimObj);
      }
      if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

      // Dispatch notification
      await createNotificationHelper({
        userId: studentId,
        title: 'Claim Submitted',
        message: 'Your claim has been submitted to the Lost & Found Team.',
        type: 'claim_submitted',
        relatedClaimId: claim._id,
        relatedItemId: foundItemId,
      });

      return res.status(201).json({
        success: true,
        message: 'Your verification has been submitted. Waiting for Lost & Found Team review.',
        data: claimObj,
      });
    } else {
      // In-memory dev fallback
      const newClaim = {
        _id: 'CLAIM-' + Date.now(),
        studentId: userProfile,
        studentName: userProfile.fullName,
        studentEmail: userProfile.email,
        studentPhone: userProfile.phone,
        studentRegId: userProfile.studentId,
        studentDept: userProfile.department,
        studentYear: userProfile.year,
        lostItemId,
        foundItemId,
        matchId: matchId || `match_${Date.now()}`,
        verificationAnswers,
        verificationScore,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inMemoryClaims.unshift(newClaim);
      if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

      await createNotificationHelper({
        userId: studentId,
        title: 'Claim Submitted',
        message: 'Your claim has been submitted to the Lost & Found Team.',
        type: 'claim_submitted',
        relatedClaimId: newClaim._id,
        relatedItemId: foundItemId,
      });

      return res.status(201).json({
        success: true,
        message: 'Your verification has been submitted. Waiting for Lost & Found Team review.',
        data: newClaim,
      });
    }
  } catch (error) {
    console.error('Create Claim Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error submitting claim request.',
    });
  }
};

// @desc    Get claims submitted by current user
// @route   GET /api/claims/my
// @access  Private
const getMyClaims = async (req, res) => {
  try {
    const studentId = req.user ? (req.user.id || req.user._id) : null;

    if (!studentId) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const targetId = studentId ? studentId.toString() : '';
    let dbClaims = [];

    if (isDbConnected() && studentId) {
      dbClaims = await Claim.find({ studentId }).sort({ createdAt: -1 });
    }

    const memClaims = inMemoryClaims.filter(
      (c) => c && c.studentId && c.studentId.toString() === targetId
    );

    const map = new Map();
    dbClaims.forEach((c) => {
      const cObj = c.toObject ? c.toObject() : { ...c };
      map.set(String(cObj._id), cObj);
    });

    memClaims.forEach((memC) => {
      const memId = String(memC._id);
      if (map.has(memId)) {
        const existing = map.get(memId);
        if (memC.status && memC.status !== 'pending') {
          existing.status = memC.status;
        }
      } else {
        map.set(memId, memC);
      }
    });

    const finalClaimsList = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())
    );

    return res.status(200).json({
      success: true,
      count: finalClaimsList.length,
      data: finalClaimsList,
    });
  } catch (error) {
    console.error('Get My Claims Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving claims.',
    });
  }
};

// @desc    Get claim by ID
// @route   GET /api/claims/:id
// @access  Private
const getClaimById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id || req.user._id;

    let claim;
    if (isDbConnected()) {
      claim = await Claim.findById(id)
        .populate('studentId', 'fullName studentId email phone department year')
        .populate('foundItemId', 'itemName category brand colour actualBrand actualColour uniqueMark specialFeature damage privateDescription imageUrl');
    } else {
      claim = inMemoryClaims.find((c) => c._id.toString() === id.toString());
    }

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim request not found.',
      });
    }

    const claimantId = typeof claim.studentId === 'object' ? (claim.studentId._id || claim.studentId.id) : claim.studentId;
    const isStaffOrAdmin = req.user.role === 'admin' || req.user.role === 'staff' || req.user.role === 'STUDENT_CARE';

    if (!isStaffOrAdmin && String(claimantId) !== String(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this claim.',
      });
    }

    return res.status(200).json({
      success: true,
      data: claim,
    });
  } catch (error) {
    console.error('Get Claim By ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving claim details.',
    });
  }
};

module.exports = {
  createClaim,
  getMyClaims,
  getClaimById,
};
