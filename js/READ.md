# Credlink Backend — Setup Guide

## Stack
- **Runtime**: Node.js ≥ 18
- **Framework**: Express
- **Auth**: JWT (access + refresh tokens) + bcrypt
- **Security**: Helmet, CORS, express-rate-limit, express-validator

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Generate a secure JWT secret and paste it into .env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 4. Start the server
npm start            # production
npm run dev          # development (auto-restarts on changes, Node ≥ 18)
```

The API will be available at `http://localhost:3000`.

---

## Environment Variables (`.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | 64-byte hex secret — **never commit this** | — |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `BCRYPT_ROUNDS` | bcrypt cost factor (12–14 for production) | `12` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5500` |
| `LOGIN_MAX_ATTEMPTS` | Max login tries before lockout | `5` |
| `LOGIN_WINDOW_MINUTES` | Rate-limit window in minutes | `15` |

---

## API Endpoints

### Auth (public)

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | `{ firstName, lastName, email, phone, password }` | Register a new user |
| `POST` | `/api/auth/login` | `{ email, password }` | Login, receive access token + httpOnly cookie |
| `POST` | `/api/auth/refresh` | — (reads cookie) | Silently refresh access token |
| `POST` | `/api/auth/logout` | — | Clear refresh-token cookie |

### Dashboard (protected — requires `Authorization: Bearer <token>`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Returns current user profile + stub account data |

### Utility

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check for load balancers |

---

## Frontend Integration

Replace the existing `js/auth.js` with `src/frontend-auth.js`  
Replace the existing `js/dashboard.js` with `src/frontend-dashboard.js`

Both files use `const API = 'http://localhost:3000/api'` — update this to your production domain.

---

## Security Architecture

```
Browser                           Backend
  │                                  │
  │  POST /auth/login                │
  │─────────────────────────────────▶│
  │                                  │  1. Validate input (express-validator)
  │                                  │  2. bcrypt.compare (constant-time)
  │                                  │  3. Issue access token (15 min JWT)
  │                                  │  4. Set refresh token (7d httpOnly cookie)
  │◀─────────────────────────────────│
  │  { accessToken }                 │
  │  Set-Cookie: refreshToken (httpOnly, Secure, SameSite=Strict)
  │                                  │
  │  Store accessToken in memory     │
  │  (NOT localStorage)              │
  │                                  │
  │  GET /dashboard                  │
  │  Authorization: Bearer <access>  │
  │─────────────────────────────────▶│
  │                                  │  Verify JWT → attach req.user
  │◀─────────────────────────────────│
  │  { user, account }               │
  │                                  │
  │  Page reload / new tab           │
  │  POST /auth/refresh (cookie)     │
  │─────────────────────────────────▶│
  │                                  │  Verify refresh token → new access token
  │◀─────────────────────────────────│
  │  { accessToken }                 │
```

### Why access tokens stay in memory (not localStorage)
localStorage is accessible to any JavaScript on the page — including injected third-party scripts. An XSS attack can steal tokens from localStorage. Keeping the access token in a JS variable means it vanishes on page reload (recovered silently via the httpOnly cookie refresh), and is invisible to other scripts.

### Why bcrypt even when the email doesn't exist
Without this, an attacker could measure response times: fast = unknown email, slow = wrong password. Always running bcrypt keeps both paths equally slow.

---

## Before Going to Production

- [ ] Replace `userStore` with a real database (PostgreSQL recommended for financial data)
- [ ] Add a refresh-token revocation list in the database (so logout actually invalidates tokens)
- [ ] Enable HTTPS and set `CORS_ORIGIN` to your real domain
- [ ] Set `NODE_ENV=production` (disables stack traces in error responses)
- [ ] Increase `BCRYPT_ROUNDS` to 13–14 on your production hardware
- [ ] Add structured logging (Winston / Pino) with audit trails for all auth events
- [ ] Set up database-level encryption for PII (email, phone)
- [ ] Consider adding 2FA (TOTP) before handling real money



