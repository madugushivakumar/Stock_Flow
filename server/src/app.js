const { NODE_ENV, CLIENT_URL, CORS_ORIGIN, ALLOWED_ORIGINS } = require('./config/env');
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

// Helper to sanitize origin (trim whitespace and remove trailing slashes)
const sanitizeOrigin = (url) => (url ? String(url).trim().replace(/\/+$/, '') : '');

// Allowed origins configuration: production Vercel frontend, local dev, and environment overrides
const defaultAllowedOrigins = [
  'https://stock-flow-theta-five.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const envAllowedOrigins = [
  CLIENT_URL,
  CORS_ORIGIN,
  process.env.FRONTEND_URL,
  ...(ALLOWED_ORIGINS ? ALLOWED_ORIGINS.split(',') : []),
]
  .map(sanitizeOrigin)
  .filter(Boolean);

const allowedOriginsSet = new Set(
  [...defaultAllowedOrigins.map(sanitizeOrigin), ...envAllowedOrigins].filter(Boolean)
);

// Centralized Cross-Origin Resource Sharing (CORS) configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, test runner)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = sanitizeOrigin(origin);

    // Explicit allowlist match or localhost in non-production
    if (
      allowedOriginsSet.has(normalizedOrigin) ||
      (NODE_ENV !== 'production' &&
        (normalizedOrigin.startsWith('http://localhost:') ||
          normalizedOrigin.startsWith('http://127.0.0.1:')))
    ) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

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
