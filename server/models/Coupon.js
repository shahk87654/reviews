const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

module.exports = mongoose.model('Coupon', CouponSchema);
