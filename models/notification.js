// /server/models/notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'userType', // Dynamically reference either Buyer or Seller
    required: true 
  },
  userType: { 
    type: String, 
    enum: ['buyer', 'seller'], 
    required: true 
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);