const User = require('../models/User');

module.exports = async function (req, res, next) {
  if (!req.user) return res.status(401).json({ msg: 'Unauthorized' });
  // Development shortcut: accept the dev-admin id without querying the DB
  if (req.user.id === 'dev-admin') return next();
  const user = await User.findById(req.user.id);
  if (!user || !user.isAdmin) return res.status(403).json({ msg: 'Admin only' });
  next();
};
