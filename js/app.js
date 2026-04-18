/**
 * app.js — Credlink API server
 *
 * Security layers applied (in order):
 *  1. Helmet        — sets secure HTTP response headers
 *  2. CORS          — allow only the configured frontend origin
 *  3. Rate limiting — per-route (tighter on auth endpoints)
 *  4. Body parsing  — strict size cap to prevent large-payload attacks
 *  5. Cookie parser — to read httpOnly refresh-token cookie
 *  6. JWT auth      — enforced on protected routes
 *  7. Input validation — express-validator (per route)
 */

//require('./auth.routes').config();
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');

const app = express();

// ─── 1. Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ─── 2. CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
    credentials: true,          // allows the browser to send the httpOnly cookie
    methods: ['GET', 'POST'],   // only what we actually use
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── 3. Global rate limit (fallback) ─────────────────────────────────────────
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                   // per IP across all endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.' },
}));

// ─── 4. Body parsing (cap at 10 kb to prevent payload attacks) ───────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── 5. Cookie parser (for refresh-token cookie) ─────────────────────────────
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check (no auth, used by load balancers / uptime monitors)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// Catches any unexpected errors without leaking stack traces to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('[Unhandled error]', err);
    // Never expose internal error details in production.
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred.'
        : err.message;
    res.status(500).json({ error: message });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 3000;
app.listen(PORT, () => {
    console.log(`Credlink API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app; // exported for testing
