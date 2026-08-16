const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { 
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let messages = [];
console.log('✅ Server initialized');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('✅ New user connected:', socket.id);
  
  socket.on('send_message', (data) => {
    console.log('📨 Message from', data.username, ':', data.message);
    messages.push(data);
    io.emit('receive_message', data);
    
    // Auto-reply after 1 second
    setTimeout(() => {
      const reply = {
        username: 'Chat Bot 🤖',
        message: `Thanks for saying "${data.message}"! I received your message.`
      };
      io.emit('receive_message', reply);
    }, 1000);
  });
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
  console.log('✅ Socket.io ready for connections');
});