/**
 * auth.js  (frontend)
 *
 * Wires the existing HTML forms to the Credlink backend.
 * Stores ONLY the access token in memory (never localStorage) for security.
 * The refresh token lives in an httpOnly cookie — invisible to this script.
 */

const API = 'http://localhost:3000/api'; // ← change to your production URL

// ─── In-memory token store ────────────────────────────────────────────────────
// Storing in a module-scoped variable means it is cleared on page reload,
// which is intentional: the refresh-token cookie re-authenticates silently.
let accessToken = null;

// ─── DOM elements ─────────────────────────────────────────────────────────────
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginFormContainer = document.getElementById('loginForm');
const signupFormContainer = document.getElementById('signupForm');
const successMessage = document.getElementById('successMessage');

// ─── Form toggle ──────────────────────────────────────────────────────────────
function toggleForms() {
    loginFormContainer.classList.toggle('active');
    signupFormContainer.classList.toggle('active');
    clearAllErrors();
    loginForm.reset();
    signupForm.reset();
}

// ─── Password visibility ──────────────────────────────────────────────────────
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// ─── Client-side validators (match backend rules) ─────────────────────────────
const validators = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    password: (v) => v.length >= 8,
    passwordStrength(v) {
        let s = 0;
        if (v.length >= 8) s++;
        if (v.length >= 12) s++;
        if (/[A-Z]/.test(v)) s++;
        if (/[a-z]/.test(v)) s++;
        if (/[0-9]/.test(v)) s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        return s;
    },
    phone: (v) => /^[\d\s\-+()]+$/.test(v) && v.replace(/\D/g, '').length >= 10,
    name: (v) => v.trim().length >= 2,
};

// ─── Error helpers ────────────────────────────────────────────────────────────
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    const input = document.getElementById(elementId.replace('-error', ''));
    if (el) { el.textContent = message; el.classList.add('show'); }
    if (input) input.classList.add('error');
}

function clearError(elementId) {
    const el = document.getElementById(elementId);
    const input = document.getElementById(elementId.replace('-error', ''));
    if (el) { el.textContent = ''; el.classList.remove('show'); }
    if (input) input.classList.remove('error');
}

function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = ''; el.classList.remove('show');
    });
    document.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));
}

// Map backend field errors → existing error-span ids
const FIELD_TO_ERROR_ID = {
    firstName: 'firstname-error',
    lastName: 'lastname-error',
    email: 'signup-email-error',
    phone: 'signup-phone-error',
    password: 'signup-password-error',
    confirmPassword: 'confirm-password-error',
};

function applyServerErrors(fields = {}) {
    Object.entries(fields).forEach(([field, msg]) => {
        const errorId = FIELD_TO_ERROR_ID[field];
        if (errorId) showError(errorId, msg);
    });
}

// ─── Password strength indicator ─────────────────────────────────────────────
document.getElementById('signup-password')?.addEventListener('input', function () {
    const s = validators.passwordStrength(this.value);
    const bar = document.getElementById('strength-bar');
    const hint = document.getElementById('password-hint');
    bar.classList.remove('weak', 'medium', 'strong');

    if (!this.value) {
        bar.style.width = '0';
        hint.classList.remove('show');
    } else if (s <= 2) {
        bar.classList.add('weak');
        hint.textContent = '❌ Weak — add uppercase, numbers, and symbols.';
        hint.classList.add('show');
    } else if (s <= 4) {
        bar.classList.add('medium');
        hint.textContent = '⚠️ Good — consider adding more complexity.';
        hint.classList.add('show');
    } else {
        bar.classList.add('strong');
        hint.textContent = '✓ Strong password!';
        hint.classList.add('show');
    }
});

// ─── Login ────────────────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAllErrors();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    let valid = true;

    if (!email) { showError('login-email-error', 'Email is required'); valid = false; }
    else if (!validators.email(email)) { showError('login-email-error', 'Invalid email format'); valid = false; }

    if (!password) { showError('login-password-error', 'Password is required'); valid = false; }
    if (!valid) return;

    const btn = loginForm.querySelector('.btn-primary');
    btn.disabled = true;
    btn.textContent = 'Logging in…';

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',          // allows the httpOnly cookie to be set
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            // 401 = wrong credentials, 422 = validation, 429 = rate limit
            showError('login-password-error', data.error || 'Login failed.');
            if (data.fields) applyServerErrors(data.fields);
            return;
        }

        accessToken = data.accessToken; // keep in memory

        // Remember Me — store only the email, never the token
        if (document.getElementById('remember-me')?.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        showSuccessMessage('Login Successful!', `Welcome back, ${data.user.firstName}! Redirecting…`);
        setTimeout(() => { location.href = 'dashboard.html'; }, 2000);

    } catch {
        showError('login-password-error', 'Network error. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Login';
    }
});

// ─── Signup ───────────────────────────────────────────────────────────────────
signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAllErrors();

    const firstName = document.getElementById('signup-firstname').value.trim();
    const lastName = document.getElementById('signup-lastname').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const terms = document.getElementById('terms').checked;
    let valid = true;

    if (!firstName || !validators.name(firstName)) { showError('firstname-error', 'First name must be at least 2 characters'); valid = false; }
    if (!lastName || !validators.name(lastName)) { showError('lastname-error', 'Last name must be at least 2 characters'); valid = false; }
    if (!email || !validators.email(email)) { showError('signup-email-error', 'Valid email is required'); valid = false; }
    if (!phone || !validators.phone(phone)) { showError('signup-phone-error', 'Valid phone number required (10+ digits)'); valid = false; }
    if (!password || !validators.password(password)) { showError('signup-password-error', 'Password must be at least 8 characters'); valid = false; }
    if (password !== confirmPassword) { showError('confirm-password-error', 'Passwords do not match'); valid = false; }
    if (!terms) { showError('terms-error', 'You must agree to the terms'); valid = false; }
    if (!valid) return;

    const btn = signupForm.querySelector('.btn-primary');
    btn.disabled = true;
    btn.textContent = 'Creating Account…';

    try {
        const res = await fetch(`${API}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ firstName, lastName, email, phone, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            if (data.fields) applyServerErrors(data.fields);
            else showError('signup-email-error', data.error || 'Signup failed.');
            return;
        }

        accessToken = data.accessToken;
        showSuccessMessage('Account Created!', `Welcome ${data.user.firstName}! Redirecting…`);
        setTimeout(() => { location.href = 'dashboard.html'; }, 2500);

    } catch {
        showError('signup-email-error', 'Network error. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
});

// ─── Success overlay ──────────────────────────────────────────────────────────
function showSuccessMessage(title, text) {
    document.getElementById('success-title').textContent = title;
    document.getElementById('success-text').textContent = text;
    successMessage.style.display = 'flex';
}

// ─── Social login stubs ───────────────────────────────────────────────────────
function loginWithGoogle() { alert('Google OAuth integration goes here.'); }
function signupWithGoogle() { alert('Google OAuth integration goes here.'); }

// ─── Real-time blur validation ────────────────────────────────────────────────
document.getElementById('login-email')?.addEventListener('blur', function () {
    if (this.value && !validators.email(this.value)) showError('login-email-error', 'Invalid email format');
    else clearError('login-email-error');
});

document.getElementById('signup-email')?.addEventListener('blur', function () {
    if (this.value && !validators.email(this.value)) showError('signup-email-error', 'Invalid email format');
    else clearError('signup-email-error');
});

document.getElementById('signup-phone')?.addEventListener('blur', function () {
    if (this.value && !validators.phone(this.value)) showError('signup-phone-error', 'Invalid phone (need 10+ digits)');
    else clearError('signup-phone-error');
});

document.getElementById('signup-confirm-password')?.addEventListener('blur', function () {
    if (this.value && document.getElementById('signup-password').value !== this.value)
        showError('confirm-password-error', 'Passwords do not match');
    else clearError('confirm-password-error');
});

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', () => clearError(input.id + '-error'));
});

// ─── Remember Me pre-fill ─────────────────────────────────────────────────────
window.addEventListener('load', function () {
    const saved = localStorage.getItem('rememberedEmail');
    if (saved) {
        document.getElementById('login-email').value = saved;
        const cb = document.getElementById('remember-me');
        if (cb) cb.checked = true;
    }
});
