// routes/cartRoutes.js
const express = require('express');
const { auth } = require('../middleware/auth');
const Cart = require('../models/cartModel');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.product',
      select: 'name price shop variants',
      populate: { path: 'shop', select: 'name' },
    });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { productId, quantity, variant } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && 
                item.variant?.size === variant?.size && 
                item.variant?.color === variant?.color
    );
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity; // Update quantity for specific variant
    } else {
      cart.items.push({ product: productId, quantity, variant });
    }
    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price shop variants',
      populate: { path: 'shop', select: 'name' },
    });
    res.json(cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:productId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price shop variants',
      populate: { path: 'shop', select: 'name' },
    });
    res.json(cart);
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;