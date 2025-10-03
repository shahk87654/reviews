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
const rateLimit = require('express-rate-limit');

// Limit review submissions to reduce spam/brute force
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 review attempts per IP per hour
  message: { msg: 'Too many review submissions from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper: check if a review for this station from the same user/device/ip exists in the last 24 hours
async function hasRecentReview({ userId, stationId, deviceId, ip }) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const query = {
    station: stationId,
    createdAt: { $gte: since },
    $or: []
  };
  if (userId) query.$or.push({ user: userId });
  if (deviceId) query.$or.push({ deviceId });
  if (ip) query.$or.push({ ip });
  if (query.$or.length === 0) return false;
  const count = await Review.countDocuments(query);
  return count > 0;
}

// Submit review
router.post('/', auth, reviewLimiter, [
  body('stationId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
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
    // GPS check for first review
    const reviewCount = await Review.countDocuments({ station: station._id });
    if (reviewCount === 0 && gps) {
      // Check if within 200m
      const toRad = x => x * Math.PI / 180;
      const R = 6371000;
      const dLat = toRad(gps.lat - station.location.coordinates[1]);
      const dLng = toRad(gps.lng - station.location.coordinates[0]);
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(station.location.coordinates[1])) * Math.cos(toRad(gps.lat)) * Math.sin(dLng/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;
      if (dist > 200) return res.status(400).json({ msg: 'You must be near the station to submit the first review' });
    }
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
      coupon = new Coupon({ code, user: userId, review: review._id, station: station._id });
      await coupon.save();
      review.rewardGiven = true;
      await review.save();
    }
    // If visits is a multiple of 5, the user just received a reward; next reward is in 5 visits
    const remainder = visits % 5;
    const visitsLeft = remainder === 0 ? 5 : 5 - remainder;
    res.json({ review, coupon, visits, visitsLeft });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
