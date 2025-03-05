const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Shop = require('../models/shopModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const Coupon = require('../models/couponModel');
const { sendEmail } = require('../utils/email');

exports.createOrder = async (req, res) => {
  try {
    const { shopId, products, couponCode } = req.body;
    const shop = await Shop.findById(shopId);
    if (!shop || shop.status !== 'approved') return res.status(404).json({ message: 'Shop not found or not approved' });

    let total = 0;
    const orderProducts = [];
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product || product.shop.toString() !== shopId) {
        return res.status(400).json({ message: `Invalid product: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      product.stock -= item.quantity;
      product.orderCount += item.quantity; // Increment orderCount based on quantity ordered
      if (product.stock < product.lowStockThreshold) {
        const owner = await User.findById(shop.owner);
        await sendEmail(owner.email, 'Low Stock Alert', `${product.name} is low: ${product.stock} left`);
      }
      await product.save();
      total += product.price * item.quantity;
      orderProducts.push({ product: product._id, quantity: item.quantity, price: product.price });
    }

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, shop: shopId });
      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        total *= (1 - coupon.discount / 100);
      }
    }

    const order = new Order({
      buyer: req.user.id,
      shop: shopId,
      products: orderProducts,
      total
    });
    const createdOrder = await order.save();

    const owner = await User.findById(shop.owner);
    await sendEmail(owner.email, 'New Order Received', `Order #${createdOrder._id} placed for ${total} DZD`);

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: 'Invalid order data', error: error.message });
  }
};


exports.getUserOrders = async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      let query = { buyer: req.user.id };
      if (status) query.status = status;
      if (startDate || endDate) query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
      const orders = await Order.find(query)
        .populate('shop', 'name')
        .populate('products.product', 'name price');
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

exports.getShopOrders = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(403).json({ message: 'You must own a shop' });

    const orders = await Order.find({ shop: shop._id })
      .populate('buyer', 'name email deliveryRating')
      .populate('products.product', 'name price');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(403).json({ message: 'You must own a shop' });

    const order = await Order.findById(req.params.id);
    if (!order || order.shop.toString() !== shop._id.toString()) {
      return res.status(404).json({ message: 'Order not found or not authorized' });
    }

    order.status = req.body.status;
    if (req.body.deliveryStatus) order.deliveryStatus = req.body.deliveryStatus;
    const updatedOrder = await order.save();

    const buyer = await User.findById(order.buyer);
    await sendEmail(buyer.email, 'Order Status Updated', `Order #${order._id} is now ${order.status}`);

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Invalid status', error: error.message });
  }
};

exports.rateBuyer = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(403).json({ message: 'You must own a shop' });

    const order = await Order.findById(req.params.orderId);
    if (!order || order.shop.toString() !== shop._id.toString()) {
      return res.status(404).json({ message: 'Order not found or not authorized' });
    }

    const review = new Review({
      user: req.user.id,
      target: order.buyer,
      targetModel: 'User',
      rating: req.body.rating,
      comment: req.body.comment
    });
    await review.save();

    const buyer = await User.findById(order.buyer);
    const reviews = await Review.find({ target: order.buyer, targetModel: 'User' });
    buyer.ratingCount = reviews.length;
    buyer.deliveryRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await buyer.save();

    res.json(review);
  } catch (error) {
    res.status(400).json({ message: 'Invalid rating', error: error.message });
  }
};

exports.confirmDelivery = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(403).json({ message: 'You must own a shop' });

    const order = await Order.findById(req.params.id);
    if (!order || order.shop.toString() !== shop._id.toString()) {
      return res.status(404).json({ message: 'Order not found or not authorized' });
    }

    order.deliveryStatus = 'delivered';
    order.paymentConfirmed = true;
    order.status = 'delivered';
    const updatedOrder = await order.save();

    const buyer = await User.findById(order.buyer);
    await sendEmail(buyer.email, 'Order Delivered', `Order #${order._id} has been delivered`);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.buyer.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Order not found or not authorized' });
    }
    if (order.status !== 'pending' || order.deliveryStatus !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }
    if (Date.now() - order.createdAt > 24 * 60 * 60 * 1000) { // 24-hour limit
      return res.status(400).json({ message: 'Cancellation period has expired' });
    }

    order.status = 'cancelled';
    for (const item of order.products) {
      const product = await Product.findById(item.product);
      product.stock += item.quantity;
      await product.save();
    }
    const updatedOrder = await order.save();

    const shop = await Shop.findById(order.shop);
    const owner = await User.findById(shop.owner);
    await sendEmail(owner.email, 'Order Cancelled', `Order #${order._id} has been cancelled`);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};