// routes/orderRoutes.js
const express = require('express');
const { auth } = require('../middleware/auth');
const Order = require('../models/orderModel');
const Shop = require('../models/shopModel');
const Cart = require('../models/cartModel');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('shop', 'name')
      .populate('products.product', 'name price');
    res.json(orders); // No failedDeliveryRate for regular users
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { shopId, products } = req.body;
  console.log('Received Order Payload:', { shopId, products });
  try {
    if (!shopId || !products || !Array.isArray(products) || products.length === 0) {
      console.log('Validation Failed:', { shopId, products });
      return res.status(400).json({ message: 'Shop ID and products are required' });
    }
    const shop = await Shop.findById(shopId);
    if (!shop) {
      console.log('Shop Not Found:', shopId);
      return res.status(404).json({ message: 'Shop not found' });
    }
    const total = products.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + (item.quantity * price);
    }, 0);
    const order = new Order({
      user: req.user.id,
      shop: shopId,
      products: products.map(item => ({
        product: item.product,
        quantity: item.quantity,
        variant: item.variant,
      })),
      total,
      status: 'Pending',
    });
    await order.save();
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });

    // Calculate failed delivery rate for the buyer
    const userOrders = await Order.find({ user: req.user.id });
    const totalOrders = userOrders.length;
    const returnedOrders = userOrders.filter(o => o.status === 'Returned').length;
    const failedDeliveryRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;

    // Include failedDeliveryRate in the response for shop visibility later
    const orderWithRate = {
      ...order.toObject(),
      buyerFailedDeliveryRate: failedDeliveryRate.toFixed(2),
    };

    res.status(201).json(orderWithRate);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/shop/:shopId', auth, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop || shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    const orders = await Order.find({ shop: req.params.shopId })
      .populate('products.product', 'name price')
      .populate('user', 'name');

    // Calculate failed delivery rate for each order's buyer
    const ordersWithRate = await Promise.all(orders.map(async (order) => {
      const userOrders = await Order.find({ user: order.user._id });
      const totalOrders = userOrders.length;
      const returnedOrders = userOrders.filter(o => o.status === 'Returned').length;
      const failedDeliveryRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;

      return {
        ...order.toObject(),
        buyerFailedDeliveryRate: failedDeliveryRate.toFixed(2),
      };
    }));

    res.json(ordersWithRate);
  } catch (error) {
    console.error('Error fetching shop orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findById(req.params.id).populate('shop');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (!['Pending', 'Confirmed', 'Delivered', 'Returned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    order.status = status;
    await order.save();

    // Calculate failed delivery rate after status update
    const userOrders = await Order.find({ user: order.user });
    const totalOrders = userOrders.length;
    const returnedOrders = userOrders.filter(o => o.status === 'Returned').length;
    const failedDeliveryRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;

    const orderWithRate = {
      ...order.toObject(),
      buyerFailedDeliveryRate: failedDeliveryRate.toFixed(2),
    };

    res.json(orderWithRate);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;