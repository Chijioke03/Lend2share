/**
 * tokens.js
 *
 * Centralised JWT helpers.
 * Access token  → short-lived (15 min), sent in Authorization header.
 * Refresh token → longer-lived (7 days), sent in httpOnly cookie only.
 */

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const ACCESS_TTL = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!SECRET || SECRET === 'REPLACE_WITH_64_BYTE_RANDOM_HEX') {
    throw new Error('JWT_SECRET is not configured. Set it in your .env file.');
}

/**
 * Issue a short-lived access token containing minimal claims.
 */
function issueAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email },
        SECRET,
        { algorithm: 'HS256', expiresIn: ACCESS_TTL }
    );
}

/**
 * Issue a refresh token (contains only the subject claim).
 */
function issueRefreshToken(user) {
    return jwt.sign(
        { sub: user.id },
        SECRET,
        { algorithm: 'HS256', expiresIn: REFRESH_TTL }
    );
}

/**
 * Verify and decode any token.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 */
function verifyToken(token) {
    return jwt.verify(token, SECRET, { algorithms: ['HS256'] });
}

module.exports = { issueAccessToken, issueRefreshToken, verifyToken };
