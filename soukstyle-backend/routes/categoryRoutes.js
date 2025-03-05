const express = require('express');
const { createCategory, getCategories } = require('../controllers/categoryController');
const { auth, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/', getCategories);
router.post(
  '/',
  auth,
  isAdmin,
  [body('name').notEmpty().withMessage('Name is required')],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  createCategory
);

module.exports = router;