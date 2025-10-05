const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    console.error('Get alerts error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create alert (admin only) - broadcast to all users
router.post('/', [auth, admin], async (req, res) => {
  const { message, type = 'info' } = req.body;
  if (!message) return res.status(400).json({ msg: 'Message is required' });

  try {
    const alert = new Alert({
      message,
      type,
      createdBy: req.user.id
    });
    await alert.save();

    // Broadcast to all connected clients via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('newAlert', alert);
    }

    res.json(alert);
  } catch (err) {
    console.error('Create alert error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
