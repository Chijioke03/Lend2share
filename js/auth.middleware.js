/**
 * auth.middleware.js
 *
 * Validates the Bearer access token on every protected route.
 * On success attaches `req.user` with the decoded claims.
 */

const { verifyToken } = require('./tokens');
const userStore = require('./userStore');

module.exports = function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    }

    const token = authHeader.slice(7); // strip "Bearer "

    try {
        const claims = verifyToken(token);
        const user = userStore.findById(claims.sub);

        if (!user) {
            // Token is valid but user was deleted — treat as unauthorised.
            return res.status(401).json({ error: 'User not found.' });
        }

        req.user = userStore.safeView(user); // never expose passwordHash downstream
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Access token expired. Please refresh.' });
        }
        return res.status(401).json({ error: 'Invalid access token.' });
    }
};
