const express = require('express');
const { createReview, getReviews } = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('targetId').notEmpty().withMessage('Target ID is required'),
    body('targetModel').isIn(['Product', 'Shop']).withMessage('Invalid target model'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  createReview
);

router.get('/:targetId/:targetModel', getReviews);

module.exports = router;