const Notification = require('../models/notificationModel');

const createNotification = async (userId, message) => {
  try {
    const notification = new Notification({
      user: userId,
      message,
      read: false,
      createdAt: new Date()
    });
    await notification.save();
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = createNotification;