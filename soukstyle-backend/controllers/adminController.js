const Shop = require('../models/shopModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');

exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find({}).populate('owner', 'name email');
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.approveShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    shop.status = 'approved';
    await shop.save();
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    await Product.deleteMany({ shop: shop._id });
    await shop.remove();
    res.json({ message: 'Shop and its products deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await Shop.deleteOne({ owner: user._id });
    await Product.deleteMany({ shop: { $exists: true, $eq: null } });
    await user.remove();
    res.json({ message: 'User and associated shop deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPlatformAnalytics = async (req, res) => {
  try {
    const totalSales = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]);
    const topShops = await Order.aggregate([
      { $group: { _id: "$shop", totalSales: { $sum: "$total" }, orderCount: { $sum: 1 } } },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'shops', localField: '_id', foreignField: '_id', as: 'shopInfo' } },
      { $unwind: '$shopInfo' },
      { $project: { name: '$shopInfo.name', totalSales: 1, orderCount: 1 } }
    ]);
    res.json({ totalSales: totalSales[0]?.total || 0, topShops });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};