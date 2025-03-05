// routes/shopRoutes.js
const express = require('express');
const mongoose = require('mongoose'); // Add this import
const { auth } = require('../middleware/auth');
const Shop = require('../models/shopModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');

const router = express.Router();

// Get all shops with optional filtering
router.get('/', async (req, res) => {
  try {
    const { wilaya, city, search } = req.query;
    const query = {};
    if (wilaya) query.wilaya = wilaya;
    if (city) query.city = city;
    if (search) query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    const shops = await Shop.find(query).populate('owner', 'name');
    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get analytics for owner's shops (moved before /:id)
router.get('/analytics', auth, async (req, res) => {
  try {
    const shops = await Shop.find({ owner: req.user.id });
    const shopIds = shops.map(shop => shop._id);
    const orders = await Order.find({ shop: { $in: shopIds } });
    const products = await Product.find({ shop: { $in: shopIds } });
    const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    res.json({
      totalSales,
      orderCount: orders.length,
      productCount: products.length,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single shop by ID (after /analytics)
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('owner', 'name');
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    console.error('Error fetching shop:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a shop
router.post('/', auth, async (req, res) => {
  const { name, socialMedia, logo, banner, wilaya, city } = req.body;
  try {
    const shop = new Shop({
      name,
      owner: req.user.id,
      socialMedia,
      logo: logo || undefined,
      banner: banner || undefined,
      wilaya,
      city,
    });
    const createdShop = await shop.save();
    res.status(201).json(createdShop);
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Follow/unfollow shop
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    if (shop.followers.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already following' });
    }
    shop.followers.push(req.user.id);
    await shop.save();
    res.json(shop);
  } catch (error) {
    console.error('Error following shop:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/unfollow', auth, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    shop.followers = shop.followers.filter((id) => id.toString() !== req.user.id);
    await shop.save();
    res.json(shop);
  } catch (error) {
    console.error('Error unfollowing shop:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add an employee to a shop
router.post('/:id/employees', auth, async (req, res) => {
  const { employeeId } = req.body;
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    if (shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (!mongoose.Types.ObjectId.isValid(employeeId)) return res.status(400).json({ message: 'Invalid employee ID' });
    if (shop.employees.some(emp => emp.user.toString() === employeeId)) return res.status(400).json({ message: 'Employee already added' });
    shop.employees.push({ user: employeeId, role: 'staff' });
    await shop.save();
    res.json(shop);
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/review', auth, async (req, res) => {
  const { rating, review, orderId } = req.body;
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    // Verify user has a delivered order from this shop
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      shop: req.params.id,
      status: 'Delivered',
    });
    if (!order) return res.status(403).json({ message: 'You must have a delivered order to review this shop' });

    // Check if user already reviewed this shop for this order
    if (shop.ratings.some(r => r.user.toString() === req.user.id && r.order.toString() === orderId)) {
      return res.status(400).json({ message: 'You have already reviewed this shop for this order' });
    }

    shop.ratings.push({
      user: req.user.id,
      order: orderId,
      rating,
      review,
    });
    await shop.save();
    await shop.populate('ratings.user', 'name');
    res.status(201).json(shop);
  } catch (error) {
    console.error('Error adding shop review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;