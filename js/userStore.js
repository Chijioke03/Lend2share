/**
 * userStore.js
 *
 * Thread-safe in-memory store that mirrors what a real DB table would look like.
 * Replace every method body with DB calls (Postgres/MySQL) when ready — the
 * interface stays identical so nothing else changes.
 */

const users = new Map(); // email → user object

module.exports = {
    /**
     * Create a new user record.
     * @param {{ id, firstName, lastName, email, phone, passwordHash, createdAt }} user
     */
    create(user) {
        if (users.has(user.email.toLowerCase())) {
            return null; // duplicate
        }
        users.set(user.email.toLowerCase(), user);
        return user;
    },

    /**
     * Find a user by email (case-insensitive).
     * @param {string} email
     * @returns {object|null}
     */
    findByEmail(email) {
        return users.get(email.toLowerCase()) ?? null;
    },

    /**
     * Find a user by id.
     * @param {string} id
     * @returns {object|null}
     */
    findById(id) {
        for (const user of users.values()) {
            if (user.id === id) return user;
        }
        return null;
    },

    /** Return a safe public projection (no passwordHash). */
    safeView(user) {
        const { passwordHash, ...safe } = user;
        return safe;
    },
};
