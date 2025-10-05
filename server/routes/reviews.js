const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Station = require('../models/Station');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Helper: check if a review for this station from the same user/device/ip exists in the last 24 hours
async function hasRecentReview({ userId, stationId, deviceId, ip }) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const query = {
    station: stationId,
    createdAt: { $gte: since },
    $or: []
  };
  if (userId && mongoose.isValidObjectId(userId)) query.$or.push({ user: userId });
  if (deviceId) query.$or.push({ deviceId });
  if (ip) query.$or.push({ ip });
  if (query.$or.length === 0) return false;
  const count = await Review.countDocuments(query);
  return count > 0;
}

// Submit review
router.post('/', auth, [
  body('stationId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }).toInt(),
  body('cleanliness').optional().isInt({ min: 0, max: 5 }).toInt(),
  body('serviceSpeed').optional().isInt({ min: 0, max: 5 }).toInt(),
  body('staffFriendliness').optional().isInt({ min: 0, max: 5 }).toInt(),
  body('comment').optional().isString(),
  body('name').notEmpty(),
  body('contact').notEmpty(),
  body('gps').optional(),
  body('deviceId').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { stationId, rating, cleanliness, serviceSpeed, staffFriendliness, comment, name, contact, gps, deviceId } = req.body;
  const userId = req.user.id;
  try {
    const station = await Station.findOne({ stationId });
    if (!station) return res.status(404).json({ msg: 'Station not found' });
    // Enforce 24h restriction: prevent multiple reviews for the same station by same user/device/ip
    const ip = req.ip || req.connection?.remoteAddress || null;
    const recent = await hasRecentReview({ userId, stationId: station._id, deviceId, ip });
    if (recent) return res.status(429).json({ msg: 'You can only submit one review per station every 24 hours' });
    
    // Create review
    const reviewData = {
      station: station._id,
      rating,
      cleanliness,
      serviceSpeed,
      staffFriendliness,
      comment,
      name,
      contact,
      ip: req.ip,
      deviceId,
      gps
    };
    if (mongoose.isValidObjectId(userId)) reviewData.user = userId;
    const review = new Review(reviewData);
    await review.save();
    // If userId is a valid ObjectId, associate the review with the user
    if (mongoose.isValidObjectId(userId)) {
      try {
        await User.findByIdAndUpdate(userId, { $push: { reviews: review._id } });
      } catch (e) {
        // ignore update errors for development/test users
      }
    }
    // Reward logic
    let user = null;
    if (mongoose.isValidObjectId(userId)) {
      user = await User.findById(userId);
    }
    // Count all reviews for this user/contact (for accurate visit count)
    const phone = req.body.contact;
    const usersWithPhone = await User.find({ phone });
    const userIds = usersWithPhone.map(u => u._id);
    const visits = await Review.countDocuments({ $or: [ { contact: phone }, { user: { $in: userIds } } ] });
    let coupon = null;
    if (visits % 5 === 0) {
      const code = uuidv4();
      coupon = new Coupon({ code, user: mongoose.isValidObjectId(userId) ? userId : null, review: review._id, station: station._id });
      await coupon.save();
      review.rewardGiven = true;
      await review.save();
    }
    // If visits is a multiple of 5, the user just received a reward; next reward is in 5 visits
    const remainder = visits % 5;
    const visitsLeft = remainder === 0 ? 5 : 5 - remainder;
    res.json({ review, coupon, visits, visitsLeft });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
