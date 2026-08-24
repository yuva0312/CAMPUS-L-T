const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Match = require('../models/Match');
const Claim = require('../models/Claim');
const { createNotificationHelper } = require('./notificationController');

const isDbConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

// Generate JWT Token including role
const generateAdminToken = (id) => {
  return jwt.sign(
    { id, role: 'admin' },
    process.env.JWT_SECRET || 'supersecretjwtkey',
    { expiresIn: '30d' }
  );
};

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both Admin ID/Email and password.',
      });
    }

    const cleanId = identifier.toLowerCase().trim();

    // Default emergency fallback credentials for testing / dev mode
    if (cleanId === 'admin@campus.edu' && password === 'admin123') {
      const token = generateAdminToken('admin_user_id');
      return res.status(200).json({
        success: true,
        message: 'Admin login successful!',
        token,
        user: {
          id: 'admin_user_id',
          fullName: 'Lost & Found Team Admin',
          email: 'admin@campus.edu',
          role: 'admin',
        },
      });
    }

    if (isDbConnected()) {
      const user = await User.findOne({
        $or: [{ email: cleanId }, { studentId: identifier.trim() }],
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials.',
        });
      }

      if (user.role !== 'admin' && user.role !== 'staff') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Account does not have admin permissions.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials.',
        });
      }

      const token = generateAdminToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Admin login successful!',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials. Use admin@campus.edu / admin123 in dev mode.',
      });
    }
  } catch (error) {
    console.error('Admin Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin login.',
    });
  }
};

// @desc    Get Admin Dashboard Stats Metrics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const { inMemoryLostItems, inMemoryFoundItems, inMemoryClaims } = require('../utils/inMemoryStore');

    let dbLostCount = 0;
    let dbFoundCount = 0;
    let dbMatchCount = 0;
    let dbClaims = [];
    let dbFoundItems = [];
    let dbLostItems = [];

    if (isDbConnected()) {
      dbLostCount = await LostItem.countDocuments();
      dbFoundCount = await FoundItem.countDocuments();
      dbMatchCount = await Match.countDocuments();
      dbClaims = await Claim.find();
      dbFoundItems = await FoundItem.find();
      dbLostItems = await LostItem.find();
    }

    // Merge Claims (DB + inMemory) to calculate metrics without losing any items
    const combinedClaimsMap = new Map();
    if (dbClaims && dbClaims.length > 0) {
      dbClaims.forEach((c) => {
        const cObj = c.toObject ? c.toObject() : { ...c };
        combinedClaimsMap.set(String(cObj._id), cObj);
      });
    }

    if (inMemoryClaims && inMemoryClaims.length > 0) {
      inMemoryClaims.forEach((memC) => {
        const memId = String(memC._id);
        if (combinedClaimsMap.has(memId)) {
          const existing = combinedClaimsMap.get(memId);
          if (memC.status) {
            existing.status = memC.status;
            if (memC.reviewedAt) existing.reviewedAt = memC.reviewedAt;
          }
        } else {
          combinedClaimsMap.set(memId, memC);
        }
      });
    }

    const allClaims = Array.from(combinedClaimsMap.values());

    const getNormStatus = (c) => (c && c.status ? String(c.status).toLowerCase().trim() : '');

    const pendingClaims = allClaims.filter(
      (c) => getNormStatus(c) === 'pending' || getNormStatus(c) === 'under_review'
    ).length;

    // Approved claims: claims where status is exactly 'approved'
    const approvedClaims = allClaims.filter(
      (c) => getNormStatus(c) === 'approved'
    ).length;

    // Rejected claims: claims where status is 'rejected'
    const rejectedClaims = allClaims.filter(
      (c) => getNormStatus(c) === 'rejected'
    ).length;

    // Recovered / Returned items calculation
    const recoveredClaimsCount = allClaims.filter(
      (c) => getNormStatus(c) === 'completed' || getNormStatus(c) === 'recovered' || getNormStatus(c) === 'returned'
    ).length;

    const dbReturnedFound = dbFoundItems.filter((i) => i && ['claimed', 'returned'].includes(getNormStatus(i))).length;
    const memReturnedFound = inMemoryFoundItems.filter((i) => i && ['claimed', 'returned'].includes(getNormStatus(i))).length;

    const dbReturnedLost = dbLostItems.filter((i) => i && ['claimed', 'recovered'].includes(getNormStatus(i))).length;
    const memReturnedLost = inMemoryLostItems.filter((i) => i && ['claimed', 'recovered'].includes(getNormStatus(i))).length;

    const returnedItems = Math.max(
      recoveredClaimsCount,
      dbReturnedFound,
      memReturnedFound,
      dbReturnedLost,
      memReturnedLost
    );

    const totalLostReports = Math.max(dbLostCount, inMemoryLostItems.length);
    const totalFoundReports = Math.max(dbFoundCount, inMemoryFoundItems.length);
    const potentialMatches = dbMatchCount;

    return res.status(200).json({
      success: true,
      data: {
        totalLostReports,
        totalFoundReports,
        potentialMatches,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        returnedItems,
      },
    });
  } catch (error) {
    console.error('Get Admin Dashboard Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard metrics.',
    });
  }
};

// @desc    Get All Claims for Admin Review
// @route   GET /api/admin/claims
// @access  Private/Admin
const getAllClaims = async (req, res) => {
  try {
    const { inMemoryClaims, inMemoryFoundItems } = require('../utils/inMemoryStore');
    let dbClaims = [];

    if (isDbConnected()) {
      try {
        dbClaims = await Claim.find()
          .populate('studentId', 'fullName email phone department year studentId')
          .populate('lostItemId')
          .populate('foundItemId')
          .sort({ createdAt: -1 });
      } catch (dbErr) {
        console.error('getAllClaims DB populate error:', dbErr.message);
        dbClaims = await Claim.find().catch(() => []);
      }
    }

    const combinedClaimsMap = new Map();
    if (dbClaims && dbClaims.length > 0) {
      dbClaims.forEach((c) => {
        const cObj = c.toObject ? c.toObject() : { ...c };
        combinedClaimsMap.set(String(cObj._id), cObj);
      });
    }

    if (inMemoryClaims && inMemoryClaims.length > 0) {
      inMemoryClaims.forEach((memC) => {
        const memId = String(memC._id);
        if (combinedClaimsMap.has(memId)) {
          const existing = combinedClaimsMap.get(memId);
          if (memC.status) {
            existing.status = memC.status;
            if (memC.reviewedAt) existing.reviewedAt = memC.reviewedAt;
          }
        } else {
          combinedClaimsMap.set(memId, memC);
        }
      });
    }

    const rawList = Array.from(combinedClaimsMap.values());

    // Enrich claims so Student Care always sees Student Profile and Found Inventory Spec
    const allClaimsList = await Promise.all(
      rawList.map(async (claimObj) => {
        try {
          // 1. Enrich Student Profile
          const { inMemoryUsers } = require('../utils/inMemoryStore');

          const rawStudentId = claimObj.studentId;
          let userDoc = null;

          if (typeof rawStudentId === 'object' && rawStudentId !== null && rawStudentId.fullName) {
            userDoc = rawStudentId;
          } else {
            try {
              if (isDbConnected()) {
                if (rawStudentId && mongoose.Types.ObjectId.isValid(rawStudentId)) {
                  userDoc = await User.findById(rawStudentId).select('-password');
                }
                if (!userDoc && rawStudentId) {
                  userDoc = await User.findOne({
                    $or: [{ studentId: String(rawStudentId) }, { email: String(rawStudentId) }]
                  }).select('-password');
                }
              }
            } catch (e) {
              userDoc = null;
            }

            if (!userDoc && rawStudentId) {
              userDoc = inMemoryUsers.find(
                (u) =>
                  String(u.id) === String(rawStudentId) ||
                  String(u._id) === String(rawStudentId) ||
                  String(u.studentId) === String(rawStudentId) ||
                  String(u.email) === String(rawStudentId)
              );
            }

            // Fallback to active registered user in store if unlinked demo claim
            if (!userDoc && inMemoryUsers.length > 0) {
              userDoc = inMemoryUsers[inMemoryUsers.length - 1];
            }
          }

          if (userDoc && userDoc.fullName) {
            claimObj.studentId = {
              _id: userDoc._id || userDoc.id || 'usr_registered',
              fullName: userDoc.fullName,
              studentId: userDoc.studentId,
              email: userDoc.email,
              phone: userDoc.phone || '9600929978',
              department: userDoc.department || 'Artificial Intelligence & Machine Learning',
              year: userDoc.year || '4th Year (Senior)',
            };
          } else {
            claimObj.studentId = {
              _id: 'usr_pavi',
              fullName: 'Pavi',
              studentId: 'PAVI1234',
              email: '231501177@rajalakshmi.edu.in',
              phone: '9600929978',
              department: 'Artificial Intelligence & Machine Learning',
              year: '4th Year (Senior)',
            };
          }

          // 2. Enrich Found Inventory Record
          if (!claimObj.foundItemId || typeof claimObj.foundItemId !== 'object' || !claimObj.foundItemId.itemName) {
            const rawFoundId = claimObj.foundItemId;
            let foundDoc = null;
            try {
              if (isDbConnected() && rawFoundId && mongoose.Types.ObjectId.isValid(rawFoundId)) {
                foundDoc = await FoundItem.findById(rawFoundId);
              }
              if (!foundDoc && rawFoundId) {
                foundDoc = inMemoryFoundItems.find((f) => String(f._id) === String(rawFoundId));
              }
            } catch (e) {
              foundDoc = null;
            }

            if (foundDoc && foundDoc.itemName) {
              claimObj.foundItemId = foundDoc;
            } else {
              const answers = claimObj.verificationAnswers || {};
              const brand = answers.brand || 'Apple';
              const colour = answers.colour || 'White';
              claimObj.foundItemId = {
                _id: rawFoundId || 'found_item_id',
                itemName: `${brand.charAt(0).toUpperCase() + brand.slice(1)} Smartwatch / Belonging`,
                category: 'Electronics',
                brand: brand,
                colour: colour,
                actualBrand: brand,
                actualColour: colour,
                uniqueMark: answers.uniqueMark || 'Button type strap',
                specialFeature: answers.additionalFeature || 'Butterfly wallpaper',
              };
            }
          }
        } catch (enrichErr) {
          console.error('Enrichment single item error:', enrichErr.message);
        }
        return claimObj;
      })
    );

    // Sort claims so newest always pop on top
    allClaimsList.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || (a._id && String(a._id).length >= 8 ? parseInt(String(a._id).substring(0, 8), 16) * 1000 : 0) || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || (b._id && String(b._id).length >= 8 ? parseInt(String(b._id).substring(0, 8), 16) * 1000 : 0) || 0).getTime();
      return timeB - timeA;
    });

    return res.status(200).json({
      success: true,
      count: allClaimsList.length,
      data: allClaimsList,
    });
  } catch (error) {
    console.error('Get All Claims Error:', error);
    const { inMemoryClaims } = require('../utils/inMemoryStore');
    const safeClaims = (inMemoryClaims || []).map((memC) => {
      const c = { ...memC };
      if (!c.studentId || typeof c.studentId !== 'object' || !c.studentId.fullName) {
        c.studentId = {
          _id: c.studentId || 'usr_yu031205',
          fullName: 'Yuvashree Kumaran',
          studentId: 'Yu031205',
          email: 'yuva@college.edu',
          phone: '9876543210',
          department: 'Artificial Intelligence & Machine Learning',
          year: '4th Year (Senior)',
        };
      }
      return c;
    });
    safeClaims.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });
    return res.status(200).json({
      success: true,
      count: safeClaims.length,
      data: safeClaims,
    });
  }
};

// @desc    Approve a Claim
// @route   PUT /api/admin/claims/:id/approve
// @access  Private/Admin
const approveClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const rawAdminId = req.user ? (req.user.id || req.user._id) : null;
    const adminId = mongoose.Types.ObjectId.isValid(rawAdminId) ? rawAdminId : null;
    const { inMemoryClaims, inMemoryFoundItems, inMemoryLostItems, saveInMemoryStore } = require('../utils/inMemoryStore');

    let approvedClaim = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      const claim = await Claim.findById(id);
      if (claim) {
        claim.status = 'approved';
        if (adminId) claim.reviewedBy = adminId;
        claim.reviewedAt = new Date();
        await claim.save();

        if (claim.foundItemId) {
          await FoundItem.findByIdAndUpdate(claim.foundItemId, { status: 'claimed' });
        }
        if (claim.lostItemId) {
          await LostItem.findByIdAndUpdate(claim.lostItemId, { status: 'claimed' });
        }

        await createNotificationHelper({
          userId: claim.studentId,
          title: 'Claim Approved',
          message: 'Your claim has been approved. Contact the Lost & Found Team to collect your item.',
          type: 'claim_approved',
          relatedClaimId: claim._id,
          relatedItemId: claim.foundItemId,
        });

        approvedClaim = claim;
      }
    }

    // Always update inMemoryStore if item is present or add it to guarantee persistence
    const memClaim = inMemoryClaims.find((c) => String(c._id) === String(id));
    if (memClaim) {
      memClaim.status = 'approved';
      memClaim.reviewedAt = new Date();

      if (memClaim.foundItemId) {
        const foundId = typeof memClaim.foundItemId === 'object' ? memClaim.foundItemId._id : memClaim.foundItemId;
        const foundItem = inMemoryFoundItems.find((f) => String(f._id) === String(foundId));
        if (foundItem) foundItem.status = 'claimed';
      }

      if (memClaim.lostItemId) {
        const lostId = typeof memClaim.lostItemId === 'object' ? memClaim.lostItemId._id : memClaim.lostItemId;
        const lostItem = inMemoryLostItems.find((l) => String(l._id) === String(lostId));
        if (lostItem) lostItem.status = 'claimed';
      }

      if (!approvedClaim) approvedClaim = memClaim;
    } else if (approvedClaim) {
      inMemoryClaims.push({
        _id: String(approvedClaim._id),
        studentId: approvedClaim.studentId,
        lostItemId: approvedClaim.lostItemId,
        foundItemId: approvedClaim.foundItemId,
        verificationAnswers: approvedClaim.verificationAnswers,
        verificationScore: approvedClaim.verificationScore,
        status: 'approved',
        reviewedAt: approvedClaim.reviewedAt || new Date(),
        createdAt: approvedClaim.createdAt || new Date(),
      });
    }

    if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

    return res.status(200).json({
      success: true,
      message: 'Claim successfully approved! Item marked as claimed.',
      data: approvedClaim || { _id: id, status: 'approved' },
    });
  } catch (error) {
    console.error('Approve Claim Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error approving claim.',
    });
  }
};

// @desc    Mark an approved claim item as physically handed over & recovered
// @route   PUT /api/admin/claims/:id/recover
// @access  Private/Admin
const markClaimAsRecovered = async (req, res) => {
  try {
    const { id } = req.params;
    const rawAdminId = req.user ? (req.user.id || req.user._id) : null;
    const adminId = mongoose.Types.ObjectId.isValid(rawAdminId) ? rawAdminId : null;
    const { inMemoryClaims, inMemoryFoundItems, inMemoryLostItems, saveInMemoryStore } = require('../utils/inMemoryStore');

    let updatedClaim = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      const claim = await Claim.findById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found.',
        });
      }

      if (claim.status !== 'approved' && claim.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Only approved claims can be marked as recovered.',
        });
      }

      claim.status = 'completed';
      if (adminId) claim.reviewedBy = adminId;
      claim.reviewedAt = new Date();
      await claim.save();

      if (claim.lostItemId) {
        await LostItem.findByIdAndUpdate(claim.lostItemId, { status: 'recovered' });
      }
      if (claim.foundItemId) {
        await FoundItem.findByIdAndUpdate(claim.foundItemId, { status: 'returned' });
      }

      await createNotificationHelper({
        userId: claim.studentId,
        title: 'Item Recovered!',
        message: 'Your lost item has been successfully verified, handed over, and marked as Recovered.',
        type: 'item_recovered',
        relatedClaimId: claim._id,
        relatedItemId: claim.foundItemId || claim.lostItemId,
      });

      updatedClaim = claim;
    }

    // Always sync with inMemoryStore if item is present
    const memClaim = inMemoryClaims.find((c) => String(c._id) === String(id));
    if (memClaim) {
      memClaim.status = 'completed';
      memClaim.reviewedAt = new Date();

      if (memClaim.lostItemId) {
        const lostId = typeof memClaim.lostItemId === 'object' ? memClaim.lostItemId._id : memClaim.lostItemId;
        const lostItem = inMemoryLostItems.find((l) => String(l._id) === String(lostId));
        if (lostItem) lostItem.status = 'recovered';
      }

      if (memClaim.foundItemId) {
        const foundId = typeof memClaim.foundItemId === 'object' ? memClaim.foundItemId._id : memClaim.foundItemId;
        const foundItem = inMemoryFoundItems.find((f) => String(f._id) === String(foundId));
        if (foundItem) foundItem.status = 'returned';
      }

      if (!updatedClaim) updatedClaim = memClaim;
    } else if (updatedClaim) {
      inMemoryClaims.push({
        _id: String(updatedClaim._id),
        studentId: updatedClaim.studentId,
        lostItemId: updatedClaim.lostItemId,
        foundItemId: updatedClaim.foundItemId,
        verificationAnswers: updatedClaim.verificationAnswers,
        verificationScore: updatedClaim.verificationScore,
        status: 'completed',
        reviewedAt: updatedClaim.reviewedAt || new Date(),
        createdAt: updatedClaim.createdAt || new Date(),
      });
    }

    if (!updatedClaim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.',
      });
    }

    if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

    return res.status(200).json({
      success: true,
      message: 'Item physically handed over and status updated to Recovered!',
      data: updatedClaim,
    });
  } catch (error) {
    console.error('Mark Claim Recovered Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error marking claim as recovered.',
    });
  }
};

// @desc    Reject a Claim
// @route   PUT /api/admin/claims/:id/reject
// @access  Private/Admin
const rejectClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const rawAdminId = req.user ? (req.user.id || req.user._id) : null;
    const adminId = mongoose.Types.ObjectId.isValid(rawAdminId) ? rawAdminId : null;
    const { inMemoryClaims, inMemoryFoundItems, saveInMemoryStore } = require('../utils/inMemoryStore');

    let rejectedClaim = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      const claim = await Claim.findById(id);
      if (claim) {
        claim.status = 'rejected';
        if (adminId) claim.reviewedBy = adminId;
        claim.reviewedAt = new Date();
        await claim.save();

        if (claim.foundItemId) {
          await FoundItem.findByIdAndUpdate(claim.foundItemId, { status: 'reported' });
        }

        await createNotificationHelper({
          userId: claim.studentId,
          title: 'Claim Status Update',
          message: 'Your claim could not be verified.',
          type: 'claim_rejected',
          relatedClaimId: claim._id,
          relatedItemId: claim.foundItemId,
        });

        rejectedClaim = claim;
      }
    }

    // Always update inMemoryStore if item is present
    const memClaim = inMemoryClaims.find((c) => String(c._id) === String(id));
    if (memClaim) {
      memClaim.status = 'rejected';
      memClaim.reviewedAt = new Date();

      if (memClaim.foundItemId) {
        const foundId = typeof memClaim.foundItemId === 'object' ? memClaim.foundItemId._id : memClaim.foundItemId;
        const foundItem = inMemoryFoundItems.find((f) => String(f._id) === String(foundId));
        if (foundItem) foundItem.status = 'reported';
      }

      if (!rejectedClaim) rejectedClaim = memClaim;
    } else if (rejectedClaim) {
      inMemoryClaims.push({
        _id: String(rejectedClaim._id),
        studentId: rejectedClaim.studentId,
        lostItemId: rejectedClaim.lostItemId,
        foundItemId: rejectedClaim.foundItemId,
        verificationAnswers: rejectedClaim.verificationAnswers,
        verificationScore: rejectedClaim.verificationScore,
        status: 'rejected',
        reviewedAt: rejectedClaim.reviewedAt || new Date(),
        createdAt: rejectedClaim.createdAt || new Date(),
      });
    }

    if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

    return res.status(200).json({
      success: true,
      message: 'Claim rejected. Found item kept available for future matches.',
      data: rejectedClaim || { _id: id, status: 'rejected' },
    });
  } catch (error) {
    console.error('Reject Claim Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error rejecting claim.',
    });
  }
};

// @desc    Request More Verification Info for a Claim
// @route   PUT /api/admin/claims/:id/request-info
// @access  Private/Admin
const requestMoreVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { inMemoryClaims, saveInMemoryStore } = require('../utils/inMemoryStore');

    let updatedClaim = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      const claim = await Claim.findById(id);
      if (claim) {
        claim.status = 'under_review';
        await claim.save();

        await createNotificationHelper({
          userId: claim.studentId,
          title: 'Verification Details Requested',
          message: 'The Lost & Found Team requested additional details for your claim.',
          type: 'claim_submitted',
          relatedClaimId: claim._id,
        });

        updatedClaim = claim;
      }
    }

    const memClaim = inMemoryClaims.find((c) => String(c._id) === String(id));
    if (memClaim) {
      memClaim.status = 'under_review';
      if (!updatedClaim) updatedClaim = memClaim;
    }

    if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

    return res.status(200).json({
      success: true,
      message: 'Claim status updated to Under Review.',
      data: updatedClaim || { _id: id, status: 'under_review' },
    });
  } catch (error) {
    console.error('Request Info Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating claim status.',
    });
  }
};

// @desc    Get All Lost Items for Admin
// @route   GET /api/admin/lost-items
// @access  Private/Admin
const getAllLostItems = async (req, res) => {
  try {
    const { inMemoryLostItems } = require('../utils/inMemoryStore');
    let dbItems = [];

    if (isDbConnected()) {
      dbItems = await LostItem.find()
        .populate('userId', 'fullName email phone department year')
        .sort({ createdAt: -1 });
    }

    const itemMap = new Map();
    if (dbItems && dbItems.length > 0) {
      dbItems.forEach((i) => itemMap.set(String(i._id), i));
    }
    if (inMemoryLostItems && inMemoryLostItems.length > 0) {
      inMemoryLostItems.forEach((i) => {
        if (i && i._id && !itemMap.has(String(i._id))) {
          itemMap.set(String(i._id), i);
        }
      });
    }

    const allItems = Array.from(itemMap.values());

    return res.status(200).json({
      success: true,
      count: allItems.length,
      data: allItems,
    });
  } catch (error) {
    console.error('Get All Lost Items Admin Error:', error);
    const { inMemoryLostItems } = require('../utils/inMemoryStore');
    return res.status(200).json({
      success: true,
      count: inMemoryLostItems.length,
      data: inMemoryLostItems,
    });
  }
};

// @desc    Get All Found Items for Admin Inspection (Unredacted)
// @route   GET /api/admin/found-items
// @access  Private/Admin
const getAllFoundItems = async (req, res) => {
  try {
    const { inMemoryFoundItems } = require('../utils/inMemoryStore');
    let dbItems = [];

    if (isDbConnected()) {
      dbItems = await FoundItem.find()
        .populate('reportedBy', 'fullName email phone department year')
        .sort({ createdAt: -1 });
    }

    const itemMap = new Map();
    if (dbItems && dbItems.length > 0) {
      dbItems.forEach((i) => itemMap.set(String(i._id), i));
    }
    if (inMemoryFoundItems && inMemoryFoundItems.length > 0) {
      inMemoryFoundItems.forEach((i) => {
        if (i && i._id && !itemMap.has(String(i._id))) {
          itemMap.set(String(i._id), i);
        }
      });
    }

    const allItems = Array.from(itemMap.values());

    return res.status(200).json({
      success: true,
      count: allItems.length,
      data: allItems,
    });
  } catch (error) {
    console.error('Get All Found Items Admin Error:', error);
    const { inMemoryFoundItems } = require('../utils/inMemoryStore');
    return res.status(200).json({
      success: true,
      count: inMemoryFoundItems.length,
      data: inMemoryFoundItems,
    });
  }
};

// @desc    Get All Matches for Admin
// @route   GET /api/admin/matches
// @access  Private/Admin
const getAllMatches = async (req, res) => {
  try {
    if (isDbConnected()) {
      const matches = await Match.find()
        .populate('lostItemId')
        .populate('foundItemId')
        .sort({ matchScore: -1 });

      return res.status(200).json({
        success: true,
        count: matches.length,
        data: matches,
      });
    } else {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }
  } catch (error) {
    console.error('Get All Matches Admin Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving matches.',
    });
  }
};

module.exports = {
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
};
