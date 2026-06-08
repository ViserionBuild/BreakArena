require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');
const { getIndianTimestamp } = require('./utils/indianTime');

// Routes
const playerRoutes = require('./routes/players');
const matchRoutes = require('./routes/matches');
const roundRoutes = require('./routes/rounds');
const analyticsRoutes = require('./routes/analytics');
const groupRoutes = require('./routes/groups');

const app = express();


// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || (isProduction ? 100 : 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
if (isProduction) {
  app.use(limiter);
}

// ── Body parsing & logging ────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: getIndianTimestamp() });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/players', playerRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/rounds', roundRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
