// /server/models/order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    status: { type: String, enum: ['Processing', 'Shipped', 'Delivered'], default: 'Processing' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);