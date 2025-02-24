// /server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const sellerRoutes = require('./routes/seller');
const buyerRoutes = require('./routes/buyer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json()); // Parse JSON bodies

// Enable CORS for http://localhost:3000
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Mount routes
app.use('/api/seller', sellerRoutes); // Seller routes under /api/seller
app.use('/api/buyer', buyerRoutes); // Buyer routes under /api/buyer

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // Listen for order status updates
  socket.on('updateOrderStatus', async ({ orderId, status }) => {
    try {
      const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
      if (updatedOrder) {
        io.emit(`orderStatus-${orderId}`, updatedOrder); // Emit the update to all clients
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));