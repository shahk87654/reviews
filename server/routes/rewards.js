const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');


// GET /api/rewards/profile?... 
// Limit coupon-related endpoints to prevent brute-force
const couponLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // max 60 requests per IP per hour
  message: { msg: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/profile', couponLimiter, async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ msg: 'Coupon code required' });
  const coupon = await Coupon.findOne({ code }).populate('user review');
  if (!coupon) return res.status(404).json({ msg: 'Coupon not found' });
  let name = null, contact = null, email = null, phone = null;
  if (coupon.review) {
    name = coupon.review.name;
    contact = coupon.review.contact;
  }
  if (coupon.user) {
    email = coupon.user.email;
    phone = coupon.user.phone;
  }
  res.json({ name, contact, email, phone });
});
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Station = require('../models/Station');

// GET /api/rewards/search?phone=...
router.get('/search', couponLimiter, async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ msg: 'Phone required' });
  // Find users with this phone
  const users = await User.find({ phone });
  const userIds = users.map(u => u._id);
  // Find latest review with this phone/contact
  const latestReview = await Review.findOne({ contact: phone }).sort({ createdAt: -1 });
  // Aggregate visits and coupons
  const [reviewAgg, coupons] = await Promise.all([
    Review.aggregate([
      { $match: { $or: [ { contact: phone }, { user: { $in: userIds } } ] } },
      { $count: 'visits' }
    ]),
    Coupon.find({ user: { $in: userIds } }).populate('station')
  ]);
  const visits = reviewAgg[0]?.visits || 0;
  // Compose profile
  let name = null, contact = null, email = null, phoneNum = null;
  if (latestReview) {
    name = latestReview.name;
    contact = latestReview.contact;
  }
  if (users.length > 0) {
    email = users[0].email;
    phoneNum = users[0].phone;
  }
  res.json({ visits, coupons, profile: { name, contact, email, phone: phoneNum } });
});

// POST /api/rewards/scan (scan and claim reward code)
router.post('/scan', couponLimiter, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Coupon code is required' });
  try {
    const coupon = await Coupon.findOne({ code }).populate('station');
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });
    if (coupon.used) return res.status(400).json({ message: 'Coupon has already been claimed' });
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return res.status(400).json({ message: 'Coupon has expired' });
    // Mark as used
    coupon.used = true;
    coupon.usedAt = new Date();
    await coupon.save();
    console.log(`Coupon ${code} claimed at ${coupon.usedAt}`);
    res.json({
      code: coupon.code,
      station: coupon.station ? coupon.station.name : 'Unknown',
      used: true,
      usedAt: coupon.usedAt,
      user: coupon.user,
      review: coupon.review,
      message: 'Coupon claimed successfully'
    });
  } catch (error) {
    console.error('Error claiming coupon:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/rewards/claim (mark coupon as used)
router.post('/claim', couponLimiter, auth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ msg: 'Coupon code required' });
  const coupon = await Coupon.findOne({ code });
  if (!coupon) return res.status(404).json({ msg: 'Coupon not found' });
  if (coupon.used) return res.status(400).json({ msg: 'Coupon already used' });
  // Optionally ensure the requesting user matches the coupon user
  if (coupon.user && coupon.user.toString() !== req.user.id && req.user.id !== 'dev-admin') {
    return res.status(403).json({ msg: 'You are not authorized to claim this coupon' });
  }
  coupon.used = true;
  coupon.usedAt = new Date();
  await coupon.save();
  res.json({ msg: 'Coupon claimed', coupon });
});

module.exports = router;
