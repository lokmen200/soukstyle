const Product = require('../models/productModel');
const Shop = require('../models/shopModel');
const createNotification = require('../utils/notificationHelper');

exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, minPrice, maxPrice, search, shop, wilaya, city } = req.query;
    let query = {};
    if (category) query.category = category;
    if (shop) query.shop = shop;
    if (minPrice || maxPrice) query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
    if (search) query.name = { $regex: search, $options: 'i' };
    if (wilaya || city) {
      const shopQuery = {};
      if (wilaya) shopQuery['owner.address.wilaya'] = wilaya;
      if (city) shopQuery['owner.address.city'] = city;
      const shops = await Shop.find(shopQuery).select('_id');
      query.shop = { $in: shops.map(s => s._id) };
    }

    const products = await Product.find(query)
      .populate('shop', 'name')
      .populate('category', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Product.countDocuments(query);
    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('shop', 'name')
      .populate('category', 'name');
    if (product) {
      product.views += 1; // Increment views when product is viewed
      await product.save();
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id }).populate('followers', 'email');
    if (!shop) return res.status(403).json({ message: 'You must own a shop to add products' });

    const product = new Product({
      shop: shop._id,
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : null
    });
    const createdProduct = await product.save();

    // Notify followers
    for (const follower of shop.followers) {
      await createNotification(follower._id, `${shop.name} added a new product: ${product.name}`);
    }

    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: 'Invalid product data', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(403).json({ message: 'You must own a shop to update products' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    Object.assign(product, req.body);
    if (req.file) product.image = `/uploads/${req.file.filename}`;
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(403).json({ message: 'You must own a shop to delete products' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.remove();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// controllers/productController.js
exports.getTrendingProducts = async (req, res) => {
    try {
      const trending = await Product.find()
        .sort({ orderCount: -1, views: -1 }) // Sort by orders, then views
        .limit(10)
        .populate('shop', 'name'); // Include shop name
      res.json(trending);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };