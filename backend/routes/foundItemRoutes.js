const express = require('express');
const router = express.Router();
const upload = require('../utils/upload'); // Cloudinary upload middleware
const {
  createFoundItem,
  getFoundItems,
  getMyFoundItems,
  getFoundItemById,
  updateFoundItem,
  deleteFoundItem,
} = require('../controllers/foundItemController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Route definitions with image upload middleware attached
router.post('/', protect, upload.single('image'), createFoundItem);
router.get('/', optionalAuth, getFoundItems);
router.get('/my', protect, getMyFoundItems);
router.get('/:id', optionalAuth, getFoundItemById);
router.put('/:id', protect, upload.single('image'), updateFoundItem);
router.delete('/:id', protect, deleteFoundItem);

module.exports = router;