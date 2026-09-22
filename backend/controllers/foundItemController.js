const mongoose = require('mongoose');
const FoundItem = require('../models/FoundItem');
const { inMemoryFoundItems, saveInMemoryStore } = require('../utils/inMemoryStore');

/**
 * Helper function to redact private information for non-owners/public view.
 * Privacy Rule: Brand, Colour, Unique Mark, Special Feature, Damage, Private Description, and Image URL
 * must NOT be displayed publicly to students. They are accessible ONLY by the original reporter or STUDENT_CARE / ADMIN.
 */
const sanitizeFoundItemForPublic = (item, reqUser) => {
  const itemObj = item.toObject ? item.toObject() : { ...item };

  const reporterIdStr = itemObj.reportedBy
    ? (itemObj.reportedBy._id || itemObj.reportedBy).toString()
    : (itemObj.reporter_id ? itemObj.reporter_id.toString() : '');

  let userIdStr = '';
  let userRole = '';

  if (reqUser) {
    if (typeof reqUser === 'object') {
      userIdStr = (reqUser._id || reqUser.id || '').toString();
      userRole = (reqUser.role || '').toUpperCase();
    } else {
      userIdStr = reqUser.toString();
    }
  }

  const isReporter = reporterIdStr && userIdStr && reporterIdStr === userIdStr;
  const isStudentCareOrAdmin = userRole === 'STUDENT_CARE' || userRole === 'ADMIN';

  if (!isReporter && !isStudentCareOrAdmin) {
    delete itemObj.brand;
    delete itemObj.colour;
    delete itemObj.color;
    delete itemObj.uniqueMark;
    delete itemObj.unique_marks;
    delete itemObj.specialFeature;
    delete itemObj.special_features;
    delete itemObj.damage;
    delete itemObj.scratch_damage;
    delete itemObj.privateDescription;
    delete itemObj.additional_description;
    delete itemObj.imageUrl;
  }

  return itemObj;
};

// @desc    Report a new Found Item
// @route   POST /api/found-items
// @access  Private
exports.createFoundItem = async (req, res) => {
  try {
    const {
      itemName,
      category,
      location,
      specificLocation,
      foundDate,
      foundTime,
      timeRange,
      brand,
      colour,
      uniqueMark,
      specialFeature,
      damage,
      privateDescription,
    } = req.body;

    // Check if Cloudinary middleware attached a file path
    const uploadedImageUrl = req.file ? req.file.path : (req.body.imageUrl || '');

    if (!itemName || !category || !location || !foundDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: itemName, category, location, foundDate.',
      });
    }

    const userId = req.user ? (req.user._id || req.user.id) : 'user_inmemory_' + Date.now();

    // Check DB connection
    if (mongoose.connection.readyState === 1) {
      const foundItem = await FoundItem.create({
        reportedBy: userId,
        itemName,
        category,
        location,
        specificLocation: specificLocation || '',
        foundDate,
        foundTime: foundTime || '',
        timeRange: timeRange || '',
        brand: brand || '',
        colour: colour || '',
        uniqueMark: uniqueMark || '',
        specialFeature: specialFeature || '',
        damage: damage || '',
        privateDescription: privateDescription || '',
        imageUrl: uploadedImageUrl,
        status: 'reported',
      });

      const itemObj = foundItem.toObject ? foundItem.toObject() : { ...foundItem };
      const idx = inMemoryFoundItems.findIndex((i) => String(i._id) === String(itemObj._id));
      if (idx >= 0) inMemoryFoundItems[idx] = itemObj;
      else inMemoryFoundItems.unshift(itemObj);
      if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

      return res.status(201).json({
        success: true,
        message: 'Found item reported successfully.',
        data: foundItem,
      });
    } else {
      // In-Memory Fallback
      const newItem = {
        _id: 'found_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        reportedBy: userId,
        itemName,
        category,
        location,
        specificLocation: specificLocation || '',
        foundDate,
        foundTime: foundTime || '',
        timeRange: timeRange || '',
        brand: brand || '',
        colour: colour || '',
        uniqueMark: uniqueMark || '',
        specialFeature: specialFeature || '',
        damage: damage || '',
        privateDescription: privateDescription || '',
        imageUrl: uploadedImageUrl,
        status: 'reported',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inMemoryFoundItems.push(newItem);
      if (typeof saveInMemoryStore === 'function') saveInMemoryStore();

      return res.status(201).json({
        success: true,
        message: 'Found item reported successfully (In-Memory mode).',
        data: newItem,
      });
    }
  } catch (error) {
    console.error('Create found item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while reporting found item.',
      error: error.message,
    });
  }
};

// @desc    Get all Found Items (Public view with privacy redaction)
// @route   GET /api/found-items
// @access  Public / Private
exports.getFoundItems = async (req, res) => {
  try {
    const currentUser = req.user || null;

    if (mongoose.connection.readyState === 1) {
      const items = await FoundItem.find({ status: { $ne: 'closed' } })
        .sort({ createdAt: -1 })
        .populate('reportedBy', 'fullName department year');

      const sanitizedItems = items.map((item) => sanitizeFoundItemForPublic(item, currentUser));

      return res.status(200).json({
        success: true,
        count: sanitizedItems.length,
        data: sanitizedItems,
      });
    } else {
      const activeItems = inMemoryFoundItems.filter((i) => i.status !== 'closed');
      const sanitizedItems = activeItems.map((item) => sanitizeFoundItemForPublic(item, currentUser));

      return res.status(200).json({
        success: true,
        count: sanitizedItems.length,
        data: sanitizedItems,
      });
    }
  } catch (error) {
    console.error('Get found items error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching found items.',
      error: error.message,
    });
  }
};

// @desc    Get current user's reported found items
// @route   GET /api/found-items/my
// @access  Private
exports.getMyFoundItems = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (mongoose.connection.readyState === 1) {
      const items = await FoundItem.find({ reportedBy: userId }).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    } else {
      const myItems = inMemoryFoundItems.filter(
        (i) => i.reportedBy.toString() === userId.toString()
      );
      return res.status(200).json({
        success: true,
        count: myItems.length,
        data: myItems,
      });
    }
  } catch (error) {
    console.error('Get my found items error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your reported found items.',
      error: error.message,
    });
  }
};

const isValidObjectId = (id) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
};

// @desc    Get single Found Item by ID
// @route   GET /api/found-items/:id
// @access  Public / Private
exports.getFoundItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user || null;

    let item = null;
    if (mongoose.connection.readyState === 1 && isValidObjectId(id)) {
      item = await FoundItem.findById(id).populate('reportedBy', 'fullName department year').catch(() => null);
    }

    if (!item) {
      item = inMemoryFoundItems.find((i) => String(i._id) === String(id) || String(i.id) === String(id));
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Found item report not found.',
      });
    }

    const sanitized = sanitizeFoundItemForPublic(item, currentUser);
    return res.status(200).json({
      success: true,
      data: sanitized,
    });
  } catch (error) {
    console.error('Get found item by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching found item details.',
      error: error.message,
    });
  }
};

// @desc    Update Found Item report
// @route   PUT /api/found-items/:id
// @access  Private
exports.updateFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const updateData = { ...req.body };
    if (req.file) {
      updateData.imageUrl = req.file.path;
    }

    if (mongoose.connection.readyState === 1) {
      const item = await FoundItem.findById(id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Found item report not found.' });
      }

      if (item.reportedBy.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this report.' });
      }

      const updated = await FoundItem.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      return res.status(200).json({ success: true, message: 'Found item report updated.', data: updated });
    } else {
      const index = inMemoryFoundItems.findIndex((i) => String(i._id) === String(id));
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Found item report not found.' });
      }

      if (inMemoryFoundItems[index].reportedBy.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this report.' });
      }

      inMemoryFoundItems[index] = { ...inMemoryFoundItems[index], ...updateData, updatedAt: new Date() };
      return res.status(200).json({ success: true, message: 'Found item report updated.', data: inMemoryFoundItems[index] });
    }
  } catch (error) {
    console.error('Update found item error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating found item report.', error: error.message });
  }
};

// @desc    Delete Found Item report
// @route   DELETE /api/found-items/:id
// @access  Private
exports.deleteFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (mongoose.connection.readyState === 1) {
      const item = await FoundItem.findById(id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Found item report not found.' });
      }

      if (item.reportedBy.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this report.' });
      }

      await item.deleteOne();
      return res.status(200).json({ success: true, message: 'Found item report deleted successfully.' });
    } else {
      const index = inMemoryFoundItems.findIndex((i) => String(i._id) === String(id));
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Found item report not found.' });
      }

      if (inMemoryFoundItems[index].reportedBy.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this report.' });
      }

      inMemoryFoundItems.splice(index, 1);
      return res.status(200).json({ success: true, message: 'Found item report deleted successfully.' });
    }
  } catch (error) {
    console.error('Delete found item error:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting found item report.', error: error.message });
  }
};