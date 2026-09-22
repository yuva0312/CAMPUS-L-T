const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Claim = require('../models/Claim');
const bcrypt = require('bcryptjs');

// Helper function to extract normalized ID or check if object matches student user
const matchesStudentUser = (targetObj, reqUser) => {
  if (!targetObj || !reqUser) return false;

  const reqUserId = reqUser.id ? String(reqUser.id) : (reqUser._id ? String(reqUser._id) : '');
  const reqUserEmail = reqUser.email ? reqUser.email.toLowerCase().trim() : '';
  const reqUserRegId = reqUser.studentId ? reqUser.studentId.trim() : '';

  let targetIdStr = '';
  let targetEmail = '';
  let targetRegId = '';

  if (typeof targetObj === 'object' && targetObj !== null) {
    targetIdStr = String(targetObj._id || targetObj.id || '');
    targetEmail = (targetObj.email || '').toLowerCase().trim();
    targetRegId = (targetObj.studentId || '').trim();
  } else if (typeof targetObj === 'string' || typeof targetObj === 'number') {
    targetIdStr = String(targetObj);
  }

  if (reqUserId && targetIdStr && reqUserId === targetIdStr) return true;
  if (reqUserEmail && targetEmail && reqUserEmail === targetEmail) return true;
  if (reqUserRegId && targetRegId && reqUserRegId === targetRegId) return true;

  return false;
};

// @desc    Get Student Profile Details, Activity Summary, and Returned History
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : '';
    const userRegId = req.user?.studentId ? req.user.studentId.trim() : '';

    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    const { inMemoryLostItems, inMemoryFoundItems, inMemoryClaims, inMemoryUsers } = require('../utils/inMemoryStore');

    let userDoc = null;

    if (isDbConnected && userId && mongoose.Types.ObjectId.isValid(userId)) {
      userDoc = await User.findById(userId).select('-password');
    }

    if (!userDoc && req.user) {
      userDoc = inMemoryUsers.find(
        (u) =>
          matchesStudentUser(u, req.user) ||
          (u.email && u.email.toLowerCase().trim() === userEmail) ||
          (u.studentId && u.studentId.trim() === userRegId)
      );
    }

    if (!userDoc) {
      userDoc = {
        _id: userId || 'student_id',
        fullName: req.user?.fullName || 'Student',
        studentId: req.user?.studentId || 'N/A',
        email: req.user?.email || 'N/A',
        phone: req.user?.phone || 'N/A',
        department: req.user?.department || 'General',
        year: req.user?.year || 'Student',
        role: req.user?.role || 'student',
      };
    }

    // --- 1. COLLECT LOST ITEMS FOR USER ---
    let dbLost = [];
    if (isDbConnected && userId) {
      dbLost = await LostItem.find({
        $or: [{ userId }, { userEmail: userEmail }],
      }).catch(() => []);
    }

    const lostMap = new Map();
    dbLost.forEach((item) => {
      const iObj = item.toObject ? item.toObject() : { ...item };
      lostMap.set(String(iObj._id), iObj);
    });

    inMemoryLostItems.forEach((l) => {
      if (
        matchesStudentUser(l.userId, req.user) ||
        (l.userEmail && l.userEmail.toLowerCase().trim() === userEmail)
      ) {
        const lId = String(l._id);
        if (!lostMap.has(lId)) {
          lostMap.set(lId, l);
        } else {
          // Sync status
          if (l.status) lostMap.get(lId).status = l.status;
        }
      }
    });

    const allUserLost = Array.from(lostMap.values());

    // --- 2. COLLECT FOUND ITEMS FOR USER ---
    let dbFound = [];
    if (isDbConnected && userId) {
      dbFound = await FoundItem.find({
        $or: [{ reportedBy: userId }, { userEmail: userEmail }],
      }).catch(() => []);
    }

    const foundMap = new Map();
    dbFound.forEach((item) => {
      const iObj = item.toObject ? item.toObject() : { ...item };
      foundMap.set(String(iObj._id), iObj);
    });

    inMemoryFoundItems.forEach((f) => {
      if (
        matchesStudentUser(f.reportedBy, req.user) ||
        (f.userEmail && f.userEmail.toLowerCase().trim() === userEmail)
      ) {
        const fId = String(f._id);
        if (!foundMap.has(fId)) {
          foundMap.set(fId, f);
        } else {
          if (f.status) foundMap.get(fId).status = f.status;
        }
      }
    });

    const allUserFound = Array.from(foundMap.values());

    // --- 3. COLLECT CLAIMS FOR USER ---
    let dbClaims = [];
    if (isDbConnected && userId) {
      dbClaims = await Claim.find({ studentId: userId })
        .populate('foundItemId lostItemId')
        .catch(() => []);
    }

    const claimsMap = new Map();
    dbClaims.forEach((claim) => {
      const cObj = claim.toObject ? claim.toObject() : { ...claim };
      claimsMap.set(String(cObj._id), cObj);
    });

    inMemoryClaims.forEach((c) => {
      if (
        matchesStudentUser(c.studentId, req.user) ||
        (c.studentEmail && c.studentEmail.toLowerCase().trim() === userEmail) ||
        (c.studentRegId && c.studentRegId.trim() === userRegId)
      ) {
        const cId = String(c._id);
        if (claimsMap.has(cId)) {
          const existing = claimsMap.get(cId);
          if (c.status) existing.status = c.status;
          if (c.reviewedAt) existing.reviewedAt = c.reviewedAt;
        } else {
          claimsMap.set(cId, c);
        }
      }
    });

    const allUserClaims = Array.from(claimsMap.values());

    // --- 4. CALCULATE RECOVERED ITEMS & RETURNED HISTORY ---
    const userRecoveredClaims = allUserClaims.filter((c) =>
      c && ['completed', 'recovered', 'returned', 'approved'].includes((c.status || '').toLowerCase())
    );

    const userRecoveredLost = allUserLost.filter((l) =>
      l && ['recovered', 'claimed', 'returned'].includes((l.status || '').toLowerCase())
    );

    const itemsRecoveredCount = Math.max(userRecoveredClaims.length, userRecoveredLost.length);

    const activitySummary = {
      totalLostReports: allUserLost.length,
      totalFoundReports: allUserFound.length,
      claimsSubmitted: allUserClaims.length,
      itemsRecovered: itemsRecoveredCount,
    };

    const historyMap = new Map();

    userRecoveredClaims.forEach((c) => {
      const found = (typeof c.foundItemId === 'object' && c.foundItemId) || {};
      const lost = (typeof c.lostItemId === 'object' && c.lostItemId) || {};
      const answers = c.verificationAnswers || {};

      let itemName = found.itemName || lost.itemName;
      if (!itemName && answers.brand) {
        itemName = `${answers.brand.charAt(0).toUpperCase() + answers.brand.slice(1)} Item`;
      }
      if (!itemName) itemName = 'Recovered Belonging';

      const category = found.category || lost.category || 'Personal Belonging';

      historyMap.set(String(c._id), {
        id: c._id,
        itemName,
        category,
        recoveredDate: c.reviewedAt || c.updatedAt || c.createdAt || new Date(),
        status: 'Item Returned',
      });
    });

    userRecoveredLost.forEach((l) => {
      const lId = String(l._id);
      if (!historyMap.has(lId)) {
        historyMap.set(lId, {
          id: l._id,
          itemName: l.itemName || 'Recovered Belonging',
          category: l.category || 'General',
          recoveredDate: l.updatedAt || l.createdAt || new Date(),
          status: 'Item Returned',
        });
      }
    });

    const returnedHistory = Array.from(historyMap.values());

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: userDoc._id || userDoc.id,
          fullName: userDoc.fullName,
          studentId: userDoc.studentId,
          email: userDoc.email,
          phone: userDoc.phone,
          department: userDoc.department,
          year: userDoc.year,
          role: userDoc.role,
        },
        activitySummary,
        returnedHistory,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile data.',
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { phone, department, year, studentId, email, role } = req.body;

    if (studentId || email || role) {
      console.warn('Attempt to modify immutable fields (studentId/email/role) ignored');
    }

    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    let updatedUser = null;

    if (isDbConnected && userId) {
      const updateData = {};
      if (phone !== undefined) updateData.phone = phone.trim();
      if (department !== undefined) updateData.department = department.trim();
      if (year !== undefined) updateData.year = year.trim();

      updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select('-password');
    }

    // Always update inMemoryUsers and inMemoryClaims for simultaneous sync
    const { inMemoryUsers, inMemoryClaims, saveInMemoryStore } = require('../utils/inMemoryStore');
    
    let targetMemUser = inMemoryUsers.find(
      (u) =>
        String(u.id) === String(userId) ||
        String(u._id) === String(userId) ||
        (req.user?.email && u.email === req.user.email) ||
        (req.user?.studentId && u.studentId === req.user.studentId)
    );

    if (!targetMemUser) {
      targetMemUser = {
        id: userId || 'USR-PAVI',
        _id: userId || 'USR-PAVI',
        fullName: req.user?.fullName || updatedUser?.fullName || 'Pavi',
        studentId: req.user?.studentId || updatedUser?.studentId || 'PAVI1234',
        email: req.user?.email || updatedUser?.email || '231501177@rajalakshmi.edu.in',
        phone: phone || req.user?.phone || '9600929978',
        department: department || req.user?.department || 'Artificial Intelligence & Machine Learning',
        year: year || req.user?.year || '4th Year (Senior)',
        role: 'student',
      };
      inMemoryUsers.push(targetMemUser);
    } else {
      if (phone !== undefined) targetMemUser.phone = phone.trim();
      if (department !== undefined) targetMemUser.department = department.trim();
      if (year !== undefined) targetMemUser.year = year.trim();
    }

    if (!updatedUser) {
      updatedUser = targetMemUser;
    }

    // Update in-memory claims matching this student so claims immediately reflect updated profile
    inMemoryClaims.forEach((c) => {
      const sId = typeof c.studentId === 'object' ? (c.studentId?._id || c.studentId?.id) : c.studentId;
      if (String(sId) === String(userId) || String(c.studentEmail) === String(updatedUser.email) || String(c.studentRegId) === String(updatedUser.studentId)) {
        if (typeof c.studentId === 'object') {
          c.studentId.phone = updatedUser.phone;
          c.studentId.department = updatedUser.department;
          c.studentId.year = updatedUser.year;
        }
        c.studentPhone = updatedUser.phone;
        c.studentDept = updatedUser.department;
        c.studentYear = updatedUser.year;
      }
    });

    saveInMemoryStore();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser._id || updatedUser.id,
        fullName: updatedUser.fullName,
        studentId: updatedUser.studentId,
        email: updatedUser.email,
        phone: updatedUser.phone,
        department: updatedUser.department,
        year: updatedUser.year,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile.',
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    if (isDbConnected && userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully!',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error changing password.',
    });
  }
};

// @desc    Get Student Dashboard Statistics and Recent Campus Activity
// @route   GET /api/users/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Match = require('../models/Match');
    const { inMemoryLostItems, inMemoryFoundItems, inMemoryClaims } = require('../utils/inMemoryStore');

    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    let lostCount = 0;
    let matchCount = 0;
    let claimCount = 0;
    let recoveredCount = 0;
    let recentActivity = [];

    let dbLostItems = [];
    let dbFoundItems = [];
    let dbClaims = [];

    if (isDbConnected) {
      dbLostItems = await LostItem.find().sort({ createdAt: -1 }).catch(() => []);
      dbFoundItems = await FoundItem.find({ status: { $ne: 'closed' } }).sort({ createdAt: -1 }).catch(() => []);
      dbClaims = await Claim.find().catch(() => []);
    }

    // Combine Lost Items
    const lostMap = new Map();
    dbLostItems.forEach((i) => lostMap.set(String(i._id), i.toObject ? i.toObject() : { ...i }));
    inMemoryLostItems.forEach((i) => {
      const iId = String(i._id);
      if (!lostMap.has(iId)) lostMap.set(iId, i);
      else if (i.status) lostMap.get(iId).status = i.status;
    });
    const combinedLost = Array.from(lostMap.values());

    // Combine Found Items
    const foundMap = new Map();
    dbFoundItems.forEach((i) => foundMap.set(String(i._id), i.toObject ? i.toObject() : { ...i }));
    inMemoryFoundItems.forEach((i) => {
      const iId = String(i._id);
      if (!foundMap.has(iId)) foundMap.set(iId, i);
      else if (i.status) foundMap.get(iId).status = i.status;
    });
    const combinedFound = Array.from(foundMap.values());

    // Combine Claims
    const claimsMap = new Map();
    dbClaims.forEach((c) => claimsMap.set(String(c._id), c.toObject ? c.toObject() : { ...c }));
    inMemoryClaims.forEach((c) => {
      const cId = String(c._id);
      if (claimsMap.has(cId)) {
        if (c.status) claimsMap.get(cId).status = c.status;
      } else {
        claimsMap.set(cId, c);
      }
    });
    const combinedClaims = Array.from(claimsMap.values());

    lostCount = combinedLost.length;
    claimCount = combinedClaims.filter((c) => ['pending', 'under_review'].includes((c.status || '').toLowerCase())).length;

    const recoveredClaims = combinedClaims.filter((c) => ['completed', 'recovered', 'returned', 'approved'].includes((c.status || '').toLowerCase())).length;
    const recoveredLost = combinedLost.filter((i) => ['recovered', 'claimed'].includes((i.status || '').toLowerCase())).length;
    const recoveredFound = combinedFound.filter((i) => ['claimed', 'returned'].includes((i.status || '').toLowerCase())).length;

    recoveredCount = Math.max(recoveredClaims, recoveredLost, recoveredFound);

    // Potential matches
    matchCount = 0;
    combinedLost.forEach((lost) => {
      combinedFound.forEach((found) => {
        if (
          lost.category &&
          found.category &&
          lost.category.toLowerCase() === found.category.toLowerCase()
        ) {
          matchCount++;
        }
      });
    });

    const lostActivities = combinedLost.map((item) => {
      let displayStatus = 'Searching';
      let statusClass = 'status-lost';
      const st = (item.status || '').toLowerCase();
      if (st === 'searching') {
        displayStatus = 'Searching';
        statusClass = 'status-lost';
      } else if (st === 'potential_match' || st === 'matched') {
        displayStatus = 'Matched';
        statusClass = 'status-matched';
      } else if (st === 'claimed' || st === 'recovered') {
        displayStatus = 'Recovered';
        statusClass = 'status-claimed';
      } else if (item.status) {
        displayStatus = item.status.charAt(0).toUpperCase() + item.status.slice(1);
      }

      return {
        id: String(item._id),
        item: item.itemName,
        location: item.specificLocation ? `${item.location} (${item.specificLocation})` : item.location,
        date: item.createdAt || item.lostDate,
        status: displayStatus,
        statusClass,
        type: 'Lost',
        createdAt: new Date(item.createdAt || item.lostDate || Date.now()),
      };
    });

    const foundActivities = combinedFound.map((item) => {
      let displayStatus = 'Found';
      let statusClass = 'status-found';
      const st = (item.status || '').toLowerCase();
      if (st === 'reported') {
        displayStatus = 'Found';
        statusClass = 'status-found';
      } else if (st === 'matched') {
        displayStatus = 'Matched';
        statusClass = 'status-matched';
      } else if (st === 'claimed' || st === 'returned') {
        displayStatus = 'Claimed';
        statusClass = 'status-claimed';
      } else if (item.status) {
        displayStatus = item.status.charAt(0).toUpperCase() + item.status.slice(1);
      }

      return {
        id: String(item._id),
        item: item.itemName,
        location: item.specificLocation ? `${item.location} (${item.specificLocation})` : item.location,
        date: item.createdAt || item.foundDate,
        status: displayStatus,
        statusClass,
        type: 'Found',
        createdAt: new Date(item.createdAt || item.foundDate || Date.now()),
      };
    });

    recentActivity = [...lostActivities, ...foundActivities].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          lostReports: lostCount,
          potentialMatches: matchCount,
          pendingClaims: claimCount,
          recoveredItems: recoveredCount,
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard data.',
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getDashboardData,
};

