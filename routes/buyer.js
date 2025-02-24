// /server/routes/buyer.js
const express = require('express');
const Buyer = require('../models/buyer');
const Order = require('../models/order');
const Product = require('../models/product'); // Import the Product model
const Notification = require('../models/notification');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth'); 
const mongoose = require('mongoose');

// Buyer Registration Route
router.post('/register', async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password, address } = req.body;

    // Check if the buyer already exists
    const existingBuyer = await Buyer.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingBuyer) {
      return res.status(400).json({ error: 'Email or phone number already registered.' });
    }

    // Create a new buyer
    const newBuyer = new Buyer({
      fullName,
      phoneNumber,
      email,
      password,
      address,
    });

    await newBuyer.save(); // Save the buyer to the database

    res.status(201).json({ message: 'Buyer registered successfully.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Buyer Login Route
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // Use "identifier" for email or phone number

    // Find the buyer by email or phone number
    const buyer = await Buyer.findOne({ $or: [{ email: identifier }, { phoneNumber: identifier }] });
    if (!buyer) return res.status(400).json({ error: 'Invalid credentials' });

    // Compare passwords
    const isMatch = await buyer.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Generate JWT token
    const token = jwt.sign({ userId: buyer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new order
router.post('/orders', authMiddleware, async (req, res) => {
  try {
    const { products, totalAmount } = req.body;
    const userId = req.userId; // Extract user ID from request (set by authMiddleware)

    if (!userId) {
      return res.status(401).json({ error: 'User ID is missing.' });
    }

    // Log incoming request body for debugging
    console.log('Incoming Request Body:', req.body);

    // Validate input
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required.' });
    }
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      console.error('Invalid totalAmount:', totalAmount); // Log the issue
      return res.status(400).json({ error: 'Invalid total amount.' });
    }

    // Create the order
    const newOrder = new Order({
      buyerId: userId,
      products,
      totalAmount,
      paymentStatus: 'Pending',
      status: 'Processing',
    });

    await newOrder.save(); // Save the order to the database

    res.status(201).json({ message: 'Order created successfully.', order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});
// Get a specific order by ID
router.get('/orders/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    // Fetch the order and ensure it belongs to the logged-in buyer
    const order = await Order.findOne({ _id: orderId, buyerId: userId }).populate('products.productId');
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit a rating and review for a product
router.post('/products/:productId/rating', authMiddleware, async (req, res) => {
    try {
      const { productId } = req.params;
      const { rating, review } = req.body;
      const buyerId = req.user.id;
  
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: 'Invalid product ID' });
      }
  
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
  
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Ensure ratings array is initialized
      if (!Array.isArray(product.ratings)) {
        product.ratings = [];
      }
  
      // Check if the buyer has already rated this product
      const existingRating = product.ratings.find(
        (r) => r.buyerId && r.buyerId.toString() === buyerId
      );
  
      if (existingRating) {
        return res.status(400).json({ error: 'You have already rated this product' });
      }
  
      // Add the new rating and review
      product.ratings.push({ buyerId, rating, review });
  
      // Calculate the new average rating
      const totalRatings = product.ratings.reduce((sum, r) => sum + r.rating, 0);
      product.averageRating = totalRatings / product.ratings.length;
  
      await product.save();
  
      res.json({ message: 'Rating and review submitted successfully', product });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Get all ratings and reviews for a product
router.get('/products/:productId/ratings', async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await Product.findById(productId).populate('ratings.buyerId');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product.ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search for products with filtering, sorting, and pagination
router.get('/products/search', async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, sort = 'createdAt', order = 'asc', page = 1, limit = 10 } = req.query;

    const filters = {};
    if (query) filters.name = { $regex: query, $options: 'i' }; // Case-insensitive search
    if (category) filters.category = category;
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseFloat(minPrice);
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
    }

    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const products = await Product.find(filters)
      .populate('sellerId')
      .sort(sortOptions)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);

    const total = await Product.countDocuments(filters);
    res.json({
      products,
      total,
      page: options.page,
      totalPages: Math.ceil(total / options.limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all notifications for a buyer
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
      const buyerId = req.user.id;
  
      // Fetch all notifications for the buyer
      const notifications = await Notification.find({ userId: buyerId, userType: 'buyer' })
        .sort({ createdAt: -1 }) // Sort by most recent first
        .populate({
          path: 'userId',
          model: 'Buyer', // Dynamically populate based on userType
        });
  
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Mark a notification as read
  router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const buyerId = req.user.id;
  
      // Find the notification and ensure it belongs to the buyer
      const notification = await Notification.findById(id);
  
      if (!notification || notification.userId.toString() !== buyerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
  
      // Mark the notification as read
      notification.read = true;
      await notification.save();
  
      res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
// Get current buyer's profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.userId).select('-password'); // Exclude password
    if (!buyer) return res.status(404).json({ error: 'Buyer not found' });

    res.json({ user: buyer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;