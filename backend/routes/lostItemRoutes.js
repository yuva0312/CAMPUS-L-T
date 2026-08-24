const express = require('express');
const router = express.Router();
const {
  createLostItem,
  getMyLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
} = require('../controllers/lostItemController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// POST /api/lost-items
// GET /api/lost-items/my
router.route('/')
  .post(createLostItem);

router.route('/my')
  .get(getMyLostItems);

// GET /api/lost-items/:id
// PUT /api/lost-items/:id
// DELETE /api/lost-items/:id
router.route('/:id')
  .get(getLostItemById)
  .put(updateLostItem)
  .delete(deleteLostItem);

module.exports = router;
