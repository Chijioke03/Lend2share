/**
 * dashboard.js  (frontend)
 *
 * On load:
 *  1. Attempts a silent token refresh (reads the httpOnly cookie).
 *  2. If successful, fetches dashboard data with the new access token.
 *  3. If refresh fails, redirects to login.
 */

const API = 'http://localhost:3000/api'; // ← match auth.js

let accessToken = null;

// ─── Silent refresh ───────────────────────────────────────────────────────────
async function refreshAccessToken() {
    const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends the httpOnly refresh-token cookie
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken ?? null;
}

// ─── Fetch dashboard data ─────────────────────────────────────────────────────
async function loadDashboard(token) {
    const res = await fetch(`${API}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
}

// ─── Populate UI ──────────────────────────────────────────────────────────────
function renderDashboard(data) {
    const { user, account } = data;

    // Greeting
    const welcome = document.querySelector('.welcome-card h2');
    if (welcome) welcome.textContent = `Welcome back, ${user.firstName}! 👋`;

    // Cards — update balance / loans / returns from real data
    const cards = document.querySelectorAll('.card-value');
    if (cards[0]) cards[0].textContent = `$${account.balance.toFixed(2)}`;
    if (cards[1]) cards[1].textContent = account.activeLoans;
    if (cards[2]) cards[2].textContent = `$${account.totalReturns.toFixed(2)}`;
}

// ─── Logout ───────────────────────────────────────────────────────────────────
async function logout() {
    if (!confirm('Are you sure you want to logout?')) return;

    await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });

    accessToken = null;
    localStorage.removeItem('rememberedEmail');
    window.location.href = 'index.html';
}

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', async function () {
    try {
        accessToken = await refreshAccessToken();
        if (!accessToken) {
            // No valid session — back to login
            window.location.href = 'index.html';
            return;
        }

        const data = await loadDashboard(accessToken);
        if (!data) {
            window.location.href = 'index.html';
            return;
        }

        renderDashboard(data);
    } catch (err) {
        console.error('Dashboard load error:', err);
        window.location.href = 'index.html';
    }
});
