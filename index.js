const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const messageSchema = new mongoose.Schema({
  content: String,
  username: String,
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

app.use(cors());
app.use(express.json());

app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 'asc' });
    res.json(messages);
  } catch (err) {
    console.error('Failed to fetch messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/send', async (req, res) => {
  try {
    const { content, username } = req.body;
    const newMessage = new Message({ content, username });
    await newMessage.save();
    io.emit('message', newMessage);
    res.status(200).json(newMessage);
  } catch (error) {
    console.error('Error in /send route:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));