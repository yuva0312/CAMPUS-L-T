const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Claim = require('../models/Claim');
const bcrypt = require('bcryptjs');

// Fallback in-memory store reference from authController if MongoDB is not connected
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    let userDoc = null;
    let activitySummary = {
      totalLostReports: 0,
      totalFoundReports: 0,
      claimsSubmitted: 0,
      itemsRecovered: 0,
    };

    let returnedHistory = [];

    if (isDbConnected && userId) {
      userDoc = await User.findById(userId).select('-password');
      if (userDoc) {
        const [lostCount, foundCount, claimCount, recoveredLostCount, recoveredClaimsCount, recoveredClaims] = await Promise.all([
          LostItem.countDocuments({ userId }),
          FoundItem.countDocuments({ reportedBy: userId }),
          Claim.countDocuments({ studentId: userId }),
          LostItem.countDocuments({ userId, status: { $in: ['recovered', 'claimed'] } }),
          Claim.countDocuments({ studentId: userId, status: { $in: ['completed', 'recovered'] } }),
          Claim.find({ studentId: userId, status: { $in: ['completed', 'recovered'] } }).populate('foundItemId lostItemId'),
        ]);

        activitySummary = {
          totalLostReports: lostCount,
          totalFoundReports: foundCount,
          claimsSubmitted: claimCount,
          itemsRecovered: Math.max(recoveredLostCount, recoveredClaimsCount),
        };

        returnedHistory = recoveredClaims.map((c) => {
          const found = c.foundItemId || {};
          const lost = c.lostItemId || {};
          return {
            id: c._id,
            itemName: found.itemName || lost.itemName || 'Recovered Belonging',
            category: found.category || lost.category || 'General',
            recoveredDate: c.reviewedAt || c.updatedAt || c.createdAt,
            status: 'Item Returned',
          };
        });
      }
    } else {
      const { inMemoryLostItems, inMemoryFoundItems, inMemoryClaims } = require('../utils/inMemoryStore');
      const targetUserId = userId ? String(userId) : '';
      const userLost = targetUserId ? inMemoryLostItems.filter((i) => String(i.userId || i.reportedBy) === targetUserId) : inMemoryLostItems;
      const userFound = targetUserId ? inMemoryFoundItems.filter((i) => String(i.reportedBy) === targetUserId) : inMemoryFoundItems;
      const userClaims = targetUserId ? inMemoryClaims.filter((c) => String(c.studentId) === targetUserId) : inMemoryClaims;
      const userRecoveredClaims = userClaims.filter((c) => c && ['completed', 'recovered'].includes(c.status));
      const userRecoveredLost = userLost.filter((i) => i && ['recovered', 'claimed'].includes(i.status));

      activitySummary = {
        totalLostReports: userLost.length,
        totalFoundReports: userFound.length,
        claimsSubmitted: userClaims.length,
        itemsRecovered: Math.max(userRecoveredClaims.length, userRecoveredLost.length),
      };

      const mappedFromClaims = userRecoveredClaims.map((c) => ({
        id: c._id,
        itemName: c.verificationAnswers?.brand ? `${c.verificationAnswers?.brand} Item` : 'Recovered Belonging',
        category: 'Personal Item',
        recoveredDate: c.reviewedAt || new Date(),
        status: 'Item Returned',
      }));

      const mappedFromLost = userRecoveredLost.map((l) => ({
        id: l._id,
        itemName: l.itemName || 'Recovered Belonging',
        category: l.category || 'General',
        recoveredDate: l.updatedAt || new Date(),
        status: 'Item Returned',
      }));

      const map = new Map();
      mappedFromClaims.forEach((item) => map.set(String(item.id), item));
      mappedFromLost.forEach((item) => map.set(String(item.id), item));
      returnedHistory = Array.from(map.values());
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

    if (!updatedUser) {
      updatedUser = {
        id: userId || 'student_id',
        fullName: req.user?.fullName || 'Student',
        studentId: req.user?.studentId || 'N/A',
        email: req.user?.email || 'N/A',
        phone: phone || req.user?.phone || 'N/A',
        department: department || req.user?.department || 'General',
        year: year || req.user?.year || 'Student',
        role: 'student',
      };
    }

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

    if (isDbConnected) {
      const [lostItems, foundItems, pendingClaims, matches, recoveredLost, recoveredFound] = await Promise.all([
        LostItem.find().sort({ createdAt: -1 }),
        FoundItem.find({ status: { $ne: 'closed' } }).sort({ createdAt: -1 }),
        Claim.countDocuments({ status: 'pending' }),
        Match.countDocuments({ status: 'potential_match' }),
        LostItem.countDocuments({ status: 'recovered' }),
        FoundItem.countDocuments({ status: { $in: ['claimed', 'returned'] } }),
      ]);

      lostCount = lostItems.length;
      matchCount = matches;
      claimCount = pendingClaims;
      recoveredCount = recoveredLost + recoveredFound;

      const lostActivities = lostItems.map((item) => {
        let displayStatus = 'Searching';
        let statusClass = 'status-lost';
        if (item.status === 'searching') {
          displayStatus = 'Searching';
          statusClass = 'status-lost';
        } else if (item.status === 'potential_match') {
          displayStatus = 'Matched';
          statusClass = 'status-matched';
        } else if (item.status === 'claimed' || item.status === 'recovered') {
          displayStatus = 'Recovered';
          statusClass = 'status-claimed';
        } else if (item.status) {
          displayStatus = item.status.charAt(0).toUpperCase() + item.status.slice(1);
        }

        return {
          id: item._id.toString(),
          item: item.itemName,
          location: item.specificLocation ? `${item.location} (${item.specificLocation})` : item.location,
          date: item.createdAt || item.lostDate,
          status: displayStatus,
          statusClass,
          type: 'Lost',
          createdAt: new Date(item.createdAt || item.lostDate),
        };
      });

      const foundActivities = foundItems.map((item) => {
        let displayStatus = 'Found';
        let statusClass = 'status-found';
        if (item.status === 'reported') {
          displayStatus = 'Found';
          statusClass = 'status-found';
        } else if (item.status === 'matched') {
          displayStatus = 'Matched';
          statusClass = 'status-matched';
        } else if (item.status === 'claimed' || item.status === 'returned') {
          displayStatus = 'Claimed';
          statusClass = 'status-claimed';
        } else if (item.status) {
          displayStatus = item.status.charAt(0).toUpperCase() + item.status.slice(1);
        }

        return {
          id: item._id.toString(),
          item: item.itemName,
          location: item.specificLocation ? `${item.location} (${item.specificLocation})` : item.location,
          date: item.createdAt || item.foundDate,
          status: displayStatus,
          statusClass,
          type: 'Found',
          createdAt: new Date(item.createdAt || item.foundDate),
        };
      });

      recentActivity = [...lostActivities, ...foundActivities].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } else {
      // In-Memory Dev Store Mode
      lostCount = inMemoryLostItems.length;
      claimCount = inMemoryClaims.filter((c) => c && c.status === 'pending').length;
      recoveredCount =
        inMemoryLostItems.filter((i) => i.status === 'recovered').length +
        inMemoryFoundItems.filter((i) => ['claimed', 'returned'].includes(i.status)).length;

      // Calculate potential matches in inMemory Store
      matchCount = 0;
      inMemoryLostItems.forEach((lost) => {
        inMemoryFoundItems.forEach((found) => {
          if (
            lost.category &&
            found.category &&
            lost.category.toLowerCase() === found.category.toLowerCase()
          ) {
            matchCount++;
          }
        });
      });

      const lostActivities = inMemoryLostItems.map((item) => ({
        id: item._id ? item._id.toString() : 'lost_' + Date.now(),
        item: item.itemName,
        location: item.specificLocation ? `${item.location} (${item.specificLocation})` : item.location,
        date: item.createdAt || item.lostDate,
        status: item.status === 'searching' ? 'Searching' : item.status,
        statusClass: item.status === 'searching' ? 'status-lost' : 'status-matched',
        type: 'Lost',
        createdAt: new Date(item.createdAt || item.lostDate || Date.now()),
      }));

      const foundActivities = inMemoryFoundItems.map((item) => ({
        id: item._id ? item._id.toString() : 'found_' + Date.now(),
        item: item.itemName,
        location: item.specificLocation ? `${item.location} (${item.specificLocation})` : item.location,
        date: item.createdAt || item.foundDate,
        status: item.status === 'reported' ? 'Found' : item.status,
        statusClass: item.status === 'reported' ? 'status-found' : 'status-claimed',
        type: 'Found',
        createdAt: new Date(item.createdAt || item.foundDate || Date.now()),
      }));

      recentActivity = [...lostActivities, ...foundActivities].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    }

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
