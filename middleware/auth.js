// /server/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Token missing or invalid:', authHeader); // Log the issue
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Extract the token
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Attach the user ID to the request object
    console.log('User ID extracted from token:', req.userId); // Log the user ID
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error('Token verification failed:', error); // Log the issue
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};