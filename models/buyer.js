// /server/models/buyer.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const buyerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true }, // Add phone number
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    address: {
      wilaya: { type: String, required: true },
      city: { type: String, required: true },
      street: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Hash the password before saving
buyerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords
buyerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Buyer', buyerSchema);