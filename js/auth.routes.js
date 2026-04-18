/**
 * auth.routes.js
 *
 * POST /api/auth/signup   — create account
 * POST /api/auth/login    — authenticate, receive tokens
 * POST /api/auth/refresh  — rotate access token via httpOnly cookie
 * POST /api/auth/logout   — clear refresh-token cookie
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const userStore = require('../models/userStore');
const { issueAccessToken, issueRefreshToken, verifyToken } = require('../config/tokens');

const router = express.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

// ─── Rate limiters ────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
    windowMs: (parseInt(process.env.LOGIN_WINDOW_MINUTES, 10) || 15) * 60 * 1000,
    max: parseInt(process.env.LOGIN_MAX_ATTEMPTS, 10) || 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' },
    // Key by IP — for a real deployment key by IP + email to avoid account enumeration
    keyGenerator: (req) => req.ip,
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { error: 'Too many signup attempts from this IP.' },
});

// ─── Validation rule sets ─────────────────────────────────────────────────────

const signupRules = [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be 2–50 characters.')
        .matches(/^[A-Za-zÀ-ÿ '-]+$/)
        .withMessage('First name contains invalid characters.'),

    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be 2–50 characters.')
        .matches(/^[A-Za-zÀ-ÿ '-]+$/)
        .withMessage('Last name contains invalid characters.'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),

    body('phone')
        .trim()
        .matches(/^[\d\s\-+()]+$/)
        .withMessage('Phone number contains invalid characters.')
        .custom((v) => v.replace(/\D/g, '').length >= 10)
        .withMessage('Phone number must have at least 10 digits.'),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters.')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter.')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter.')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number.')
        .matches(/[^A-Za-z0-9]/)
        .withMessage('Password must contain at least one special character.'),
];

const loginRules = [
    body('email').trim().isEmail().withMessage('Valid email required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function sendValidationErrors(res, errors) {
    // Return all field errors as a map: { field: message }
    const map = {};
    errors.array().forEach(({ path, msg }) => {
        if (!map[path]) map[path] = msg;
    });
    return res.status(422).json({ error: 'Validation failed.', fields: map });
}

function setRefreshCookie(res, token) {
    res.cookie('refreshToken', token, {
        httpOnly: true,           // not accessible via JS
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        sameSite: 'strict',       // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        path: '/api/auth',        // scoped — only sent to auth endpoints
    });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 */
router.post('/signup', signupLimiter, signupRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationErrors(res, errors);

    const { firstName, lastName, email, phone, password } = req.body;

    // Check for existing account — use a constant-time-ish response to avoid
    // leaking whether an email is registered (timing side-channel).
    const existing = userStore.findByEmail(email);
    if (existing) {
        // Hash anyway to keep response time consistent.
        await bcrypt.hash(password, BCRYPT_ROUNDS);
        return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = userStore.create({
        id: uuidv4(),
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        createdAt: new Date().toISOString(),
    });

    const accessToken = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user);

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
        message: 'Account created successfully.',
        accessToken,
        user: userStore.safeView(user),
    });
});

/**
 * POST /api/auth/login
 */
router.post('/login', loginLimiter, loginRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationErrors(res, errors);

    const { email, password } = req.body;

    const user = userStore.findByEmail(email);

    // Always run bcrypt to prevent timing attacks that reveal whether an email exists.
    const hashToCompare = user?.passwordHash ?? '$2b$12$invalidhashpadding000000000000000000000000000000000000';
    const match = await bcrypt.compare(password, hashToCompare);

    if (!user || !match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const accessToken = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user);

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
        message: 'Login successful.',
        accessToken,
        user: userStore.safeView(user),
    });
});

/**
 * POST /api/auth/refresh
 * Reads the httpOnly cookie, validates it, issues a new access token.
 */
router.post('/refresh', (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        return res.status(401).json({ error: 'No refresh token provided.' });
    }

    try {
        const claims = verifyToken(token);
        const user = userStore.findById(claims.sub);
        if (!user) return res.status(401).json({ error: 'User not found.' });

        const accessToken = issueAccessToken(user);
        return res.status(200).json({ accessToken });
    } catch {
        return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }
});

/**
 * POST /api/auth/logout
 * Clears the refresh-token cookie.  In production also revoke the token in DB.
 */
router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return res.status(200).json({ message: 'Logged out successfully.' });
});

module.exports = router;
