const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Accept Authorization or authorization headers, with or without 'Bearer '
  const raw = req.header('Authorization') || req.header('authorization') || '';
  const token = raw.replace(/^Bearer\s+/i, '');
  console.log('Auth middleware token:', token);
  // Development convenience: accept a hardcoded dev token and inject an admin user
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
