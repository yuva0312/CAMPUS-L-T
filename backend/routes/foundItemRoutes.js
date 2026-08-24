const express = require('express');
const router = express.Router();
const {
  createFoundItem,
  getFoundItems,
  getMyFoundItems,
  getFoundItemById,
  updateFoundItem,
  deleteFoundItem,
} = require('../controllers/foundItemController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Route definitions
router.post('/', protect, createFoundItem);
router.get('/', optionalAuth, getFoundItems);
router.get('/my', protect, getMyFoundItems);
router.get('/:id', optionalAuth, getFoundItemById);
router.put('/:id', protect, updateFoundItem);
router.delete('/:id', protect, deleteFoundItem);

module.exports = router;
