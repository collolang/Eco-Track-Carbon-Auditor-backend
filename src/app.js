// src/app.js
// Express application setup — middleware, routes, error handling

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import authRoutes     from './routes/auth.js';
import companyRoutes  from './routes/company.js';
import emissionsRoutes from './routes/emissions.js';
import reportsRoutes  from './routes/reports.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

// ─── Security middleware ──────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow internal requests (like Postman or server-to-server)
    if (!origin) return callback(null, true);

    // 2. Check if the .env says "*" or if the specific URL is in our list
    const isAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true, // Required since you are using JWTs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate limiting ────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Body parsing ─────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ──────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Health check ─────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EcoTrack API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/company',   companyRoutes);
app.use('/api/emissions', emissionsRoutes);
app.use('/api/reports',   reportsRoutes);

// ─── 404 & Error handlers ─────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
