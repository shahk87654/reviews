
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');
const app = express();

// Security middlewares
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// Limit request body size and enable CORS
app.use(express.json({ limit: '10kb' }));

// Enable CORS with specific origin for deployed client
const allowedOrigins = [
  'http://localhost:3000',
  'https://cool-treacle-d4b9f2.netlify.app',
  'https://aramco-review-backend.onrender.com' // Assuming this is the Render backend URL from render.yaml
];
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));



// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stations', require('./routes/stations'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/captcha', require('./routes/captcha'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/health', require('./routes/health'));
app.use('/api/alerts', require('./routes/alerts'));

const connectToDatabase = require('./utils/mongodb');

// Connect to MongoDB
connectToDatabase()
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Placeholder for routes
app.get('/', (req, res) => res.send('Aramco Review API running'));

const BASE_PORT = parseInt(process.env.PORT, 10) || 5000;

// Try to listen, if port is in use try incrementally up to 5 times
function startServer(port, attemptsLeft = 5) {
  const server = app.listen(port, () => console.log(`Server running on port ${port}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1, attemptsLeft - 1);
    } else {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
  });
}

startServer(BASE_PORT);

// Log unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
