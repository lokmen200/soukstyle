const Shop = require('../models/shopModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }).fields([{ name: 'logo' }, { name: 'banner' }]);

exports.createShop = async (req, res) => {
    const { name, socialMedia, logo } = req.body;
  
    try {
      const shop = new Shop({
        name,
        owner: req.user.id,
        socialMedia: socialMedia || {}, // Default to empty object if not provided
        logo: logo || '', // Default to empty string if not provided
        status: 'pending', // Default status
      });
      await shop.save();
      res.status(201).json({ message: 'Shop created', shop });
    } catch (error) {
      res.status(400).json({ message: 'Invalid shop data', error: error.message });
    }
  };

exports.getShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('owner', 'name email');
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getShops = async (req, res) => {
  try {
    const { wilaya, city } = req.query;
    let query = { status: 'approved' };
    if (wilaya) query['owner.address.wilaya'] = wilaya;
    if (city) query['owner.address.city'] = city;

    const shops = await Shop.find(query).populate('owner', 'name email address');
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addEmployee = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    if (shop.employees.some(e => e.user.toString() === req.body.employeeId)) {
      return res.status(400).json({ message: 'Employee already added' });
    }
    shop.employees.push({ user: req.body.employeeId, permissions: req.body.permissions || [] });
    await shop.save();
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getShopAnalytics = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(403).json({ message: 'You must own a shop' });
    const orders = await Order.find({ shop: shop._id });
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const productCount = await Product.countDocuments({ shop: shop._id });
    res.json({ totalSales, orderCount: orders.length, productCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateShopSocialMedia = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    // Update social media links
    shop.socialMedia = {
      facebook: req.body.socialMedia?.facebook || shop.socialMedia?.facebook,
      instagram: req.body.socialMedia?.instagram || shop.socialMedia?.instagram,
      tiktok: req.body.socialMedia?.tiktok || shop.socialMedia?.tiktok
    };
    await shop.save();
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.followShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    if (shop.followers.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already following' });
    }
    shop.followers.push(req.user.id);
    await shop.save();
    res.json({ message: 'Shop followed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.unfollowShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    shop.followers = shop.followers.filter(f => f.toString() !== req.user.id);
    await shop.save();
    res.json({ message: 'Shop unfollowed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};