/**
 * dashboard.routes.js
 *
 * GET /api/dashboard — returns the current user's profile data.
 *
 * All routes here are protected by requireAuth middleware.
 * Financial figures are stubs — replace with real DB queries.
 */

const express = require('express');
const requireAuth = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth guard to every route in this file.
router.use(requireAuth);

/**
 * GET /api/dashboard
 * Returns the authenticated user's display data for the dashboard.
 */
router.get('/', (req, res) => {
    // req.user is set by requireAuth — safe view (no passwordHash)
    const { firstName, lastName, email, createdAt } = req.user;

    return res.status(200).json({
        user: { firstName, lastName, email, memberSince: createdAt },
        // ──────────────────────────────────────────────────────────────
        // STUB financial data — replace these with real DB queries
        // when you build out the lending/borrowing features.
        // ──────────────────────────────────────────────────────────────
        account: {
            balance: 0.00,
            activeLoans: 0,
            totalReturns: 0.00,
        },
    });
});

module.exports = router;
