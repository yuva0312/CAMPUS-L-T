const express = require('express');
const router = express.Router();
const upload = require('../utils/upload'); // Cloudinary upload middleware
const {
  createLostItem,
  getMyLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
} = require('../controllers/lostItemController');
const { protect } = require('../middleware/authMiddleware');

// Protect all lost item routes with authentication
router.use(protect);

// POST /api/lost-items (with image upload)
// GET /api/lost-items/my
router.route('/')
  .post(upload.single('image'), createLostItem);

router.route('/my')
  .get(getMyLostItems);

// GET, PUT (with image update option), and DELETE /api/lost-items/:id
router.route('/:id')
  .get(getLostItemById)
  .put(upload.single('image'), updateLostItem)
  .delete(deleteLostItem);

module.exports = router;