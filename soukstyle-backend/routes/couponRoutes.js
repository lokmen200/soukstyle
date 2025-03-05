// routes/couponRoutes.js
const express = require('express');
const { auth } = require('../middleware/auth');
const Coupon = require('../models/couponModel');
const Shop = require('../models/shopModel');

const router = express.Router();

// Create a coupon
router.post('/', auth, async (req, res) => {
  const { code, discount, expiresAt, shop } = req.body;
  try {
    const shopDoc = await Shop.findById(shop);
    if (!shopDoc || shopDoc.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    const coupon = new Coupon({ code, discount, expiresAt, shop });
    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get coupons for owner's shops
router.get('/shop', auth, async (req, res) => {
  try {
    const shops = await Shop.find({ owner: req.user.id });
    const shopIds = shops.map(shop => shop._id);
    const coupons = await Coupon.find({ shop: { $in: shopIds } });
    res.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;