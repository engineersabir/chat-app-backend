const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// GET ALL MESSAGES
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 })
      .limit(100);
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET MESSAGES BY CHAT ROOM
router.get('/room/:chatRoom', async (req, res) => {
  try {
    const messages = await Message.find({ chatRoom: req.params.chatRoom })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 })
      .limit(50);
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SAVE MESSAGE (Protected)
router.post('/', auth, async (req, res) => {
  try {
    const { content, chatRoom } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Message content required' });
    }

    const message = new Message({
      sender: req.userId,
      senderName: req.username,
      content,
      chatRoom: chatRoom || 'general'
    });

    await message.save();
    await message.populate('sender', 'username avatar');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE MESSAGE (Protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;