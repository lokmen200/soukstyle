// routes/productRoutes.js
const express = require('express');
const { auth } = require('../middleware/auth');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const router = express.Router();


// Get trending products (new endpoint)
router.get('/trending', async (req, res) => {
  try {
    // Example: sort by a popularity field or views; adjust as needed
    const trendingProducts = await Product.find({})
      .sort({ popularity: -1 }) // Assuming a 'popularity' field; replace with your metric
      .limit(10); // Limit to top 10 trending products
    res.json(trendingProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// routes/productRoutes.js
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const shop = await Shop.findOne({ _id: product.shop });
    if (!shop.employees.some((emp) => emp.user.toString() === req.user.id) && shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const shop = await Shop.findOne({ _id: product.shop });
    if (!shop.employees.some((emp) => emp.user.toString() === req.user.id) && shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await product.remove();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { shop, search } = req.query;
    const query = {};
    if (shop) query.shop = shop;
    if (search) query.name = { $regex: search, $options: 'i' };
    const products = await Product.find(query).populate('shop', 'name');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('shop', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, async (req, res) => { // Add auth middleware
  const { name, description, price, stock, category, image, shop, variants } = req.body;
  try {
    const product = new Product({
      name,
      description,
      price,
      stock,
      category,
      image,
      shop,
      variants: variants || [],
      owner: req.user.id, // Set owner from authenticated user
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/review', auth, async (req, res) => {
  const { rating, review, orderId } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Verify user has a delivered order for this product
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      shop: product.shop,
      status: 'Delivered',
      'products.product': req.params.id,
    });
    if (!order) return res.status(403).json({ message: 'You must have a delivered order to review this product' });

    // Check if user already reviewed this product
    if (product.ratings.some(r => r.user.toString() === req.user.id && r.order.toString() === orderId)) {
      return res.status(400).json({ message: 'You have already reviewed this product for this order' });
    }

    product.ratings.push({
      user: req.user.id,
      order: orderId,
      rating,
      review,
    });
    await product.save();
    await product.populate('ratings.user', 'name');
    res.status(201).json(product);
  } catch (error) {
    console.error('Error adding product review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;