// /server/routes/index.js
const express = require('express');
const sellerRoutes = require('./seller');
const buyerRoutes = require('./buyer');

const router = express.Router();

// Mount seller and buyer routes under /api
router.use('/seller', sellerRoutes);
router.use('/buyer', buyerRoutes);

module.exports = router;