// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const isAdmin = (req, res, next) => {
  const adminIds = process.env.ADMIN_IDS.split(',');
  if (!req.user || !adminIds.includes(req.user.id)) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required' });
  }
  next();
};

module.exports = { auth, isAdmin };