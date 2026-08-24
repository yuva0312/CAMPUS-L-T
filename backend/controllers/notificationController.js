const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// In-memory notifications array fallback for dev mode
const inMemoryNotifications = [];

const isDbConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

/**
 * Helper function to create and record a notification
 */
const createNotificationHelper = async ({
  userId,
  title,
  message,
  type,
  relatedItemId = null,
  relatedClaimId = null,
}) => {
  try {
    if (!userId) return null;

    if (isDbConnected()) {
      const notif = await Notification.create({
        userId,
        title,
        message,
        type,
        relatedItemId,
        relatedClaimId,
        isRead: false,
      });
      return notif;
    } else {
      const newNotif = {
        _id: 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        userId: userId.toString(),
        title,
        message,
        type,
        relatedItemId,
        relatedClaimId,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryNotifications.push(newNotif);
      return newNotif;
    }
  } catch (err) {
    console.error('Error creating notification:', err.message);
    return null;
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user ? (req.user.id || req.user._id) : null;

    if (!userId) {
      return res.status(200).json({
        success: true,
        count: 0,
        unreadCount: 0,
        data: [],
      });
    }

    if (isDbConnected()) {
      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
      const unreadCount = notifications.filter((n) => !n.isRead).length;

      return res.status(200).json({
        success: true,
        count: notifications.length,
        unreadCount,
        data: notifications,
      });
    } else {
      const targetId = userId.toString();
      const userNotifs = inMemoryNotifications
        .filter((n) => n && n.userId && n.userId.toString() === targetId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const unreadCount = userNotifs.filter((n) => !n.isRead).length;

      return res.status(200).json({
        success: true,
        count: userNotifs.length,
        unreadCount,
        data: userNotifs,
      });
    }
  } catch (error) {
    console.error('Get Notifications Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching notifications.',
    });
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    if (isDbConnected()) {
      const notif = await Notification.findById(id);

      if (!notif) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found.',
        });
      }

      if (notif.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized.',
        });
      }

      notif.isRead = true;
      await notif.save();

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: notif,
      });
    } else {
      const notif = inMemoryNotifications.find((n) => n._id.toString() === id.toString());

      if (!notif) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found.',
        });
      }

      if (notif.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized.',
        });
      }

      notif.isRead = true;
      notif.updatedAt = new Date();

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: notif,
      });
    }
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating notification status.',
    });
  }
};

// @desc    Mark all notifications as read for current user
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    if (isDbConnected()) {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
      });
    } else {
      const targetId = userId.toString();
      inMemoryNotifications.forEach((n) => {
        if (n.userId.toString() === targetId) {
          n.isRead = true;
        }
      });

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
      });
    }
  } catch (error) {
    console.error('Mark All Read Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error marking notifications read.',
    });
  }
};

module.exports = {
  createNotificationHelper,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
