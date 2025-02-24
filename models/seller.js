// /server/models/seller.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
  fullName: { type: String, required: true }, // Add full name
  phoneNumber: { type: String, required: true, unique: true }, // Unique phone number
  email: { type: String, required: true, unique: true, lowercase: true }, // Unique email
  password: { type: String, required: true }, // Hashed password
  shopName: { type: String, required: true },
  physicalAddress: { type: String },
  socialMediaLinks: {
    facebook: { type: String },
    instagram: { type: String },
    tiktok: { type: String },
  },
  logo: { type: String },
  banner: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Hash the password before saving
sellerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords
sellerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Seller', sellerSchema);