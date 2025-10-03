const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Accept Authorization or authorization headers, with or without 'Bearer '
  const raw = req.header('Authorization') || req.header('authorization') || '';
  const token = raw.replace(/^Bearer\s+/i, '');
  // Development convenience: accept a hardcoded dev token and inject an admin user
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  if (process.env.NODE_ENV !== 'production' && token === 'dev-admin-token') {
    req.user = { id: 'dev-admin', isAdmin: true };
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
