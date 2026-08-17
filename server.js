const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sabirfareedmalik:Alimola1214@cluster0.1jjpti31.mongodb.net/chat-app')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running ✅' });
});

// Socket.io - Real-time Chat
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // User joins
  socket.on('user_join', (userData) => {
    activeUsers.set(socket.id, userData);
    io.emit('user_joined', {
      username: userData.username,
      totalUsers: activeUsers.size
    });
    console.log(`${userData.username} joined. Total users: ${activeUsers.size}`);
  });

  // Send message
  socket.on('send_message', async (messageData) => {
    try {
      const message = new Message({
        sender: messageData.userId,
        senderName: messageData.username,
        content: messageData.content,
        chatRoom: messageData.chatRoom || 'general'
      });

      await message.save();

      // Broadcast to all users
      io.emit('receive_message', {
        id: message._id,
        username: message.senderName,
        content: message.content,
        timestamp: message.createdAt,
        chatRoom: message.chatRoom
      });

      console.log(`Message from ${messageData.username}: ${messageData.content}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to save message' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.broadcast.emit('user_typing', {
      username: data.username,
      isTyping: true
    });
  });

  // Stop typing
  socket.on('stop_typing', (data) => {
    socket.broadcast.emit('user_typing', {
      username: data.username,
      isTyping: false
    });
  });

  // User leaves
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    activeUsers.delete(socket.id);
    
    if (user) {
      io.emit('user_left', {
        username: user.username,
        totalUsers: activeUsers.size
      });
      console.log(`${user.username} left. Total users: ${activeUsers.size}`);
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.log('Error:', err.message);
  res.status(500).json({ message: err.message });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('🚀 Server running on http://localhost:' + PORT);
  console.log('✅ Socket.io ready');
  console.log('✅ RESTful API ready');
  console.log('✅ Authentication enabled');
});