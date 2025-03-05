// routes/adminRoutes.js
const express = require('express');
const {
  getAllShops,
  approveShop,
  deleteShop,
  deleteUser,
  getPlatformAnalytics,
} = require('../controllers/adminController');
const { auth, isAdmin } = require('../middleware/auth');
const User = require('../models/userModel');

const router = express.Router();

// Existing routes
router.get('/shops', auth, isAdmin, getAllShops);
router.put('/shops/:id/approve', auth, isAdmin, approveShop);
router.delete('/shops/:id', auth, isAdmin, deleteShop);
router.delete('/users/:id', auth, isAdmin, deleteUser);
router.get('/analytics', auth, isAdmin, getPlatformAnalytics);

// New route: Get all users
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('name email'); // Only return name and email
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;