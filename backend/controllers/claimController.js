const mongoose = require('mongoose');
const Claim = require('../models/Claim');
const FoundItem = require('../models/FoundItem');
const LostItem = require('../models/LostItem');
const { createNotificationHelper } = require('./notificationController');
const { inMemoryClaims, inMemoryFoundItems, inMemoryLostItems, saveInMemoryStore } = require('../utils/inMemoryStore');

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

const isValidObjectId = (id) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
};

// @desc    Submit a new claim request for a potential match
// @route   POST /api/claims
// @access  Private
const createClaim = async (req, res) => {
  try {
    const { matchId, lostItemId, foundItemId } = req.body;
    let { verificationAnswers } = req.body;

    // Parse verificationAnswers if sent as stringified JSON via multipart/form-data
    if (typeof verificationAnswers === 'string') {
      try {
        verificationAnswers = JSON.parse(verificationAnswers);
      } catch (err) {
        console.warn('Failed to parse verificationAnswers JSON:', err.message);
      }
    }

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

    // Capture Cloudinary URL directly from Multer upload or fallback body string
    const proofImageUrl = req.file ? (req.file.path || req.file.secure_url) : (req.body.proofImage || '');

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

    if (isDbConnected() && isValidObjectId(foundItemId)) {
      foundItem = await FoundItem.findById(foundItemId).catch(() => null);
    }
    if (!foundItem) {
      foundItem = inMemoryFoundItems.find(
        (i) => String(i._id) === String(foundItemId) || String(i.id) === String(foundItemId)
      );
    }

    if (lostItemId) {
      if (isDbConnected() && isValidObjectId(lostItemId)) {
        lostItem = await LostItem.findById(lostItemId).catch(() => null);
      }
      if (!lostItem) {
        lostItem = inMemoryLostItems.find(
          (i) => String(i._id) === String(lostItemId) || String(i.id) === String(lostItemId)
        );
      }
    }

    const verificationScore = calculateVerificationScore(verificationAnswers, foundItem, lostItem);

    let claimObj = null;
    const canSaveToDb =
      isDbConnected() &&
      isValidObjectId(studentId) &&
      isValidObjectId(foundItemId) &&
      (!lostItemId || isValidObjectId(lostItemId));

    if (canSaveToDb) {
      try {
        const claim = await Claim.create({
          studentId,
          lostItemId: lostItemId || null,
          foundItemId: foundItemId,
          matchId: matchId || `match_${Date.now()}`,
          verificationAnswers,
          verificationScore,
          proofImage: proofImageUrl,
          status: 'pending',
        });
        claimObj = claim.toObject ? claim.toObject() : { ...claim };
      } catch (dbErr) {
        console.warn('DB Claim creation warning, storing in memory:', dbErr.message);
      }
    }

    if (!claimObj) {
      claimObj = {
        _id: 'CLAIM-' + Date.now(),
        studentId: userProfile,
        studentName: userProfile.fullName,
        studentEmail: userProfile.email,
        studentPhone: userProfile.phone,
        studentRegId: userProfile.studentId,
        studentDept: userProfile.department,
        studentYear: userProfile.year,
        lostItemId: lostItemId || null,
        foundItemId: foundItemId,
        matchId: matchId || `match_${Date.now()}`,
        verificationAnswers,
        verificationScore,
        proofImage: proofImageUrl,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      claimObj.studentId = userProfile;
      claimObj.studentName = userProfile.fullName;
      claimObj.studentEmail = userProfile.email;
      claimObj.studentPhone = userProfile.phone;
      claimObj.studentRegId = userProfile.studentId;
      claimObj.studentDept = userProfile.department;
      claimObj.studentYear = userProfile.year;
    }

    const existingIdx = inMemoryClaims.findIndex((c) => String(c._id) === String(claimObj._id));
    if (existingIdx >= 0) {
      inMemoryClaims[existingIdx] = claimObj;
    } else {
      inMemoryClaims.unshift(claimObj);
    }
    if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

    await createNotificationHelper({
      userId: studentId,
      title: 'Claim Submitted',
      message: 'Your claim has been submitted to the Lost & Found Team.',
      type: 'claim_submitted',
      relatedClaimId: claimObj._id,
      relatedItemId: foundItemId,
    }).catch(() => null);

    return res.status(201).json({
      success: true,
      message: 'Your verification has been submitted. Waiting for Lost & Found Team review.',
      data: claimObj,
    });
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
    const userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : '';
    const userRegId = req.user?.studentId ? req.user.studentId.trim() : '';

    if (!studentId && !userEmail) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const targetId = studentId ? studentId.toString() : '';
    let dbClaims = [];

    if (isDbConnected() && isValidObjectId(studentId)) {
      dbClaims = await Claim.find({ studentId }).sort({ createdAt: -1 }).catch(() => []);
    }

    const memClaims = inMemoryClaims.filter((c) => {
      if (!c) return false;
      const sObj = typeof c.studentId === 'object' && c.studentId !== null ? c.studentId : {};
      const sId = sObj._id || sObj.id || (typeof c.studentId === 'string' ? c.studentId : '');
      const sEmail = (c.studentEmail || sObj.email || '').toLowerCase().trim();
      const sReg = (c.studentRegId || sObj.studentId || '').trim();

      if (targetId && String(sId) === targetId) return true;
      if (userEmail && sEmail === userEmail) return true;
      if (userRegId && sReg === userRegId) return true;
      return false;
    });

    const map = new Map();
    dbClaims.forEach((c) => {
      const cObj = c.toObject ? c.toObject() : { ...c };
      map.set(String(cObj._id), cObj);
    });

    memClaims.forEach((memC) => {
      const memId = String(memC._id);
      if (map.has(memId)) {
        const existing = map.get(memId);
        if (memC.status) {
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
    const studentId = req.user ? (req.user.id || req.user._id) : null;

    let claim = null;
    if (isDbConnected() && isValidObjectId(id)) {
      claim = await Claim.findById(id)
        .populate('studentId', 'fullName studentId email phone department year')
        .populate('foundItemId', 'itemName category brand colour actualBrand actualColour uniqueMark specialFeature damage privateDescription imageUrl')
        .catch(() => null);
    }

    if (!claim) {
      claim = inMemoryClaims.find((c) => String(c._id) === String(id) || String(c.id) === String(id));
    }

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim request not found.',
      });
    }

    const claimantId = typeof claim.studentId === 'object' ? (claim.studentId._id || claim.studentId.id) : claim.studentId;
    const isStaffOrAdmin = req.user.role === 'admin' || req.user.role === 'staff' || req.user.role === 'STUDENT_CARE';

    if (!isStaffOrAdmin && studentId && String(claimantId) !== String(studentId)) {
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

// @desc    Update claim status (Approve / Reject)
// @route   PATCH /api/claims/:id/status
// @access  Private (Admin / Staff)
const updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Choose approved, rejected, or pending.',
      });
    }

    let claim = null;

    if (isDbConnected() && isValidObjectId(id)) {
      claim = await Claim.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );
    }

    const memIdx = inMemoryClaims.findIndex((c) => String(c._id) === String(id) || String(c.id) === String(id));
    if (memIdx >= 0) {
      inMemoryClaims[memIdx].status = status;
      if (!claim) claim = inMemoryClaims[memIdx];
    }
    if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim request not found.',
      });
    }

    const targetUserId = typeof claim.studentId === 'object' ? (claim.studentId._id || claim.studentId.id) : claim.studentId;
    await createNotificationHelper({
      userId: targetUserId,
      title: `Claim ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your claim request has been ${status} by the Lost & Found team.`,
      type: `claim_${status}`,
      relatedClaimId: claim._id,
    }).catch(() => null);

    return res.status(200).json({
      success: true,
      message: `Claim status successfully updated to ${status}.`,
      data: claim,
    });
  } catch (error) {
    console.error('Update Claim Status Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating claim status.',
    });
  }
};

module.exports = {
  createClaim,
  getMyClaims,
  getClaimById,
  updateClaimStatus,
};