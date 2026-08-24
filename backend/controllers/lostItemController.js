const LostItem = require('../models/LostItem');
const mongoose = require('mongoose');
const { inMemoryLostItems, saveInMemoryStore } = require('../utils/inMemoryStore');

// Helper to check DB connection state
const isDbConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

// @desc    Create a new lost item report
// @route   POST /api/lost-items
// @access  Private
const createLostItem = async (req, res) => {
  try {
    const {
      itemName,
      category,
      location,
      specificLocation,
      lostDate,
      lostTime,
      timeRange,
      brand,
      colour,
      uniqueMark,
      specialFeature,
      damage,
      privateDescription,
      imageUrl,
    } = req.body;

    // Validation: Required fields
    if (!itemName || !itemName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required.',
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required.',
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Campus location is required.',
      });
    }

    if (!lostDate) {
      return res.status(400).json({
        success: false,
        message: 'Lost date is required.',
      });
    }

    const userId = req.user.id;

    if (isDbConnected()) {
      const lostItem = await LostItem.create({
        userId,
        itemName: itemName.trim(),
        category: category.trim(),
        location: location.trim(),
        specificLocation: specificLocation ? specificLocation.trim() : '',
        lostDate: new Date(lostDate),
        lostTime: lostTime ? lostTime.trim() : '',
        timeRange: timeRange ? timeRange.trim() : '',
        brand: brand ? brand.trim() : '',
        colour: colour ? colour.trim() : '',
        uniqueMark: uniqueMark ? uniqueMark.trim() : '',
        specialFeature: specialFeature ? specialFeature.trim() : '',
        damage: damage ? damage.trim() : '',
        privateDescription: privateDescription ? privateDescription.trim() : '',
        imageUrl: imageUrl ? imageUrl.trim() : '',
        status: 'searching',
      });

      const itemObj = lostItem.toObject ? lostItem.toObject() : { ...lostItem };
      const idx = inMemoryLostItems.findIndex((i) => String(i._id) === String(itemObj._id));
      if (idx >= 0) inMemoryLostItems[idx] = itemObj;
      else inMemoryLostItems.unshift(itemObj);
      if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

      return res.status(201).json({
        success: true,
        message: 'Lost item reported successfully.',
        data: lostItem,
      });
    } else {
      // In-memory dev fallback
      const newItem = {
        _id: 'LOST-' + Date.now(),
        userId: userId.toString(),
        itemName: itemName.trim(),
        category: category.trim(),
        location: location.trim(),
        specificLocation: specificLocation ? specificLocation.trim() : '',
        lostDate: new Date(lostDate),
        lostTime: lostTime ? lostTime.trim() : '',
        timeRange: timeRange ? timeRange.trim() : '',
        brand: brand ? brand.trim() : '',
        colour: colour ? colour.trim() : '',
        uniqueMark: uniqueMark ? uniqueMark.trim() : '',
        specialFeature: specialFeature ? specialFeature.trim() : '',
        damage: damage ? damage.trim() : '',
        privateDescription: privateDescription ? privateDescription.trim() : '',
        imageUrl: imageUrl ? imageUrl.trim() : '',
        status: 'searching',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inMemoryLostItems.unshift(newItem);
      if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

      return res.status(201).json({
        success: true,
        message: 'Lost item reported successfully.',
        data: newItem,
      });
    }
  } catch (error) {
    console.error('Create Lost Item Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while reporting lost item.',
    });
  }
};

// @desc    Get current user lost item reports
// @route   GET /api/lost-items/my
// @access  Private
const getMyLostItems = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isDbConnected()) {
      const items = await LostItem.find({ userId }).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    } else {
      const items = inMemoryLostItems
        .filter((item) => item.userId.toString() === userId.toString())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    }
  } catch (error) {
    console.error('Get My Lost Items Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving lost item reports.',
    });
  }
};

// @desc    Get single lost item report by ID
// @route   GET /api/lost-items/:id
// @access  Private
const getLostItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    let item;
    if (isDbConnected()) {
      item = await LostItem.findById(id);
    } else {
      item = inMemoryLostItems.find((i) => i._id.toString() === id.toString());
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost item report not found.',
      });
    }

    const itemUserId = item.userId._id ? item.userId._id.toString() : item.userId.toString();
    const isOwner = itemUserId === userId.toString();

    if (isOwner) {
      // Return complete information for owner
      return res.status(200).json({
        success: true,
        isOwner: true,
        data: item,
      });
    } else {
      // Redact private identification details for non-owners
      const publicData = {
        _id: item._id,
        itemName: item.itemName,
        category: item.category,
        location: item.location,
        specificLocation: item.specificLocation,
        lostDate: item.lostDate,
        lostTime: item.lostTime,
        timeRange: item.timeRange,
        status: item.status,
        createdAt: item.createdAt,
      };

      return res.status(200).json({
        success: true,
        isOwner: false,
        data: publicData,
      });
    }
  } catch (error) {
    console.error('Get Lost Item By ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving lost item report.',
    });
  }
};

// @desc    Update lost item report by ID (owner only)
// @route   PUT /api/lost-items/:id
// @access  Private
const updateLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (isDbConnected()) {
      let item = await LostItem.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Lost item report not found.',
        });
      }

      if (item.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this lost item report.',
        });
      }

      const fieldsToUpdate = [
        'itemName',
        'category',
        'location',
        'specificLocation',
        'lostDate',
        'lostTime',
        'timeRange',
        'brand',
        'colour',
        'uniqueMark',
        'specialFeature',
        'damage',
        'privateDescription',
        'imageUrl',
        'status',
      ];

      fieldsToUpdate.forEach((field) => {
        if (req.body[field] !== undefined) {
          item[field] = req.body[field];
        }
      });

      await item.save();

      return res.status(200).json({
        success: true,
        message: 'Lost item report updated successfully.',
        data: item,
      });
    } else {
      const index = inMemoryLostItems.findIndex((i) => i._id.toString() === id.toString());

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Lost item report not found.',
        });
      }

      if (inMemoryLostItems[index].userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this lost item report.',
        });
      }

      const updatedItem = {
        ...inMemoryLostItems[index],
        ...req.body,
        updatedAt: new Date(),
      };

      inMemoryLostItems[index] = updatedItem;

      return res.status(200).json({
        success: true,
        message: 'Lost item report updated successfully.',
        data: updatedItem,
      });
    }
  } catch (error) {
    console.error('Update Lost Item Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating lost item report.',
    });
  }
};

// @desc    Delete lost item report by ID (owner only)
// @route   DELETE /api/lost-items/:id
// @access  Private
const deleteLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (isDbConnected()) {
      const item = await LostItem.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Lost item report not found.',
        });
      }

      if (item.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this lost item report.',
        });
      }

      await LostItem.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Lost item report deleted successfully.',
      });
    } else {
      const index = inMemoryLostItems.findIndex((i) => i._id.toString() === id.toString());

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Lost item report not found.',
        });
      }

      if (inMemoryLostItems[index].userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this lost item report.',
        });
      }

      inMemoryLostItems.splice(index, 1);

      return res.status(200).json({
        success: true,
        message: 'Lost item report deleted successfully.',
      });
    }
  } catch (error) {
    console.error('Delete Lost Item Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting lost item report.',
    });
  }
};

module.exports = {
  createLostItem,
  getMyLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
};
