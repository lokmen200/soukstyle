// models/productModel.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  image: String,
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  variants: [{
    size: { type: String },
    color: { type: String },
    stock: { type: Number, default: 0 },
  }],
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, // Link to purchase
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  avgRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
}, { timestamps: true });

// Update avgRating and ratingCount before saving
productSchema.pre('save', function (next) {
  if (this.ratings && this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    this.avgRating = totalRating / this.ratings.length;
    this.ratingCount = this.ratings.length;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);