// /server/routes/seller.js
const express = require('express');
const Seller = require('../models/seller');
const Product = require('../models/product');
const Order = require('../models/order');
const Notification = require('../models/notification');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // For hashing passwords
const authenticateToken = require('../middleware/auth');
const mongoose = require('mongoose');

// Seller Registration Route
router.post('/register', async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password, shopName, physicalAddress, socialMediaLinks, logo, banner } = req.body;

    // Check if the seller already exists
    const existingSeller = await Seller.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingSeller) {
      return res.status(400).json({ error: 'Email or phone number already registered.' });
    }

    // Create a new seller
    const newSeller = new Seller({
      fullName,
      phoneNumber,
      email,
      password,
      shopName,
      physicalAddress,
      socialMediaLinks,
      logo,
      banner,
    });

    await newSeller.save(); // Save the seller to the database

    res.status(201).json({ message: 'Seller registered successfully.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // Use "identifier" for email or phone number

    // Find the seller by email or phone number
    const seller = await Seller.findOne({ $or: [{ email: identifier }, { phoneNumber: identifier }] });
    if (!seller) return res.status(400).json({ error: 'Invalid credentials' });

    // Compare passwords
    const isMatch = await seller.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Generate JWT token
    const token = jwt.sign({ userId: seller._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/products', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, stock, category, images } = req.body;
    const sellerId = req.userId; // Extract seller ID from request (set by authMiddleware)

    if (!sellerId) {
      return res.status(401).json({ error: 'Seller ID is missing.' });
    }

    // Validate input
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Product name is required and must be a string.' });
    }
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Product description is required and must be a string.' });
    }
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: 'Product price is required and must be a positive number.' });
    }
    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ error: 'Product stock is required and must be a non-negative number.' });
    }
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'Product category is required and must be a string.' });
    }
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Product images array is required and must not be empty.' });
    }

    // Create the product
    const newProduct = new Product({
      sellerId,
      name,
      description,
      price,
      stock,
      category,
      images,
    });

    await newProduct.save(); // Save the product to the database

    res.status(201).json({ message: 'Product created successfully.', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a product by ID
router.put('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate the product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Find and update the product
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a product by ID
router.delete('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Find and delete the product
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully', product: deletedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics for a seller
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Total orders
    const totalOrders = await Order.countDocuments({ sellerId });

    // Total revenue
    const totalRevenue = await Order.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    // Average order value
    const averageOrderValue = totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0;

    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageOrderValue,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders for a seller with search, filter, and pagination
// Create a new order
router.post('/orders', authenticateToken, async (req, res) => {
  try {
    const { products, totalAmount } = req.body;
    const userId = req.userId; // Extract user ID from request (set by authMiddleware)

    if (!userId) {
      return res.status(401).json({ error: 'User ID is missing.' });
    }

    // Log incoming request body for debugging
    console.log('Request Body:', req.body);

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

// Update an order status (including payment status)
router.put('/orders/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, paymentStatus } = req.body;
      const sellerId = req.user.id;
  
      if (!['pending', 'shipped', 'delivered'].includes(status)) {
        return res.status(400).json({ error: 'Invalid order status' });
      }
  
      if (paymentStatus && !['pending', 'paid'].includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' });
      }
  
      const order = await Order.findById(id);
  
      if (!order || order.sellerId.toString() !== sellerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
  
      // Update the order status and payment status
      order.status = status;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      await order.save();
  
      // Send a notification to the buyer
      const notification = new Notification({
        userId: order.buyerId,
        userType: 'buyer', // Add the userType field here
        message: `Your order status has been updated to ${status}.`,
      });
      await notification.save();
  
      res.json({ message: 'Order updated successfully', order });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

// Example protected route
router.get('/me',authenticateToken , async (req, res) => {
  try {
    const seller = await Seller.findById(req.userId).select('-password'); // Exclude password
    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    res.json({ user: seller });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;