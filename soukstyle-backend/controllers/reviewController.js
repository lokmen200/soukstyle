const Review = require('../models/reviewModel');
const Order = require('../models/orderModel');

exports.createReview = async (req, res) => {
  try {
    const { targetId, targetModel, rating, comment } = req.body;
    if (targetModel === 'Shop') {
      const order = await Order.findOne({ buyer: req.user.id, shop: targetId, status: 'delivered' });
      if (!order) return res.status(403).json({ message: 'You must have a delivered order from this shop to review' });
    } else if (targetModel === 'Product') {
      const order = await Order.findOne({
        buyer: req.user.id,
        'products.product': targetId,
        status: 'delivered'
      });
      if (!order) return res.status(403).json({ message: 'You must have ordered this product to review' });
    }

    const review = new Review({
      user: req.user.id,
      target: targetId,
      targetModel,
      rating,
      comment
    });
    const createdReview = await review.save();
    res.status(201).json(createdReview);
  } catch (error) {
    res.status(400).json({ message: 'Invalid review data', error: error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ target: req.params.targetId, targetModel: req.params.targetModel })
      .populate('user', 'name');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};