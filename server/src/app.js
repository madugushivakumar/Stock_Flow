const { NODE_ENV, CLIENT_URL } = require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const { successResponse } = require('./utils/response');

const app = express();

// Security HTTP headers
app.use(helmet());

// Allowed origins configuration
const allowedOrigins = new Set([
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

// Cross-Origin Resource Sharing with strict origin verification
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. curl, server-to-server, or test runner)
      if (!origin) {
        return callback(null, true);
      }

      // In development mode, check against local allowed origins
      if (NODE_ENV !== 'production') {
        if (allowedOrigins.has(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
        return callback(new Error(`CORS error: Origin ${origin} is not allowed in development.`));
      }

      // In production mode, strictly allow only configured CLIENT_URL or explicit production domains
      if (origin === CLIENT_URL || (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).includes(origin))) {
        return callback(null, true);
      }

      return callback(new Error(`CORS error: Origin ${origin} is rejected by security policy.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
if (NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting on authentication to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    errors: [],
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  return successResponse(res, 200, 'StockFlow API is healthy and operational', {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
