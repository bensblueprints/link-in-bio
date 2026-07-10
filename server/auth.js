// Real per-user auth for hosted (multi-tenant) mode. Replaces the single
// shared admin-password model from the self-host product. Whop is billing-only
// here (webhook flips users.plan) — no OAuth login flow to build/maintain.
const bcrypt = require('bcryptjs');
const db = require('./db-multi');
const { sendPasswordResetEmail } = require('./mailer');

const SESSION_COOKIE = 'll_sid';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cookieOpts() {
  return { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 3600 * 1000 };
}

async function signup(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const existing = await db.findUserByEmail(email);
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.createUser({ email, passwordHash });
  const sid = await db.createSession(user.id);
  res.cookie(SESSION_COOKIE, sid, cookieOpts());
  // A brand-new user never has a page yet, but include the field anyway so
  // the shape matches /api/auth/me and login() below -- the client's
  // Dashboard guard relies on `username` being present (not just missing on
  // stale data) to decide whether to send someone back to onboarding.
  res.status(201).json({ id: user.id, email: user.email, plan: user.plan, username: null });
}

async function login(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const user = await db.findUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  const sid = await db.createSession(user.id);
  res.cookie(SESSION_COOKIE, sid, cookieOpts());
  // Include username (mirrors /api/auth/me) so a returning user who HAS
  // completed onboarding doesn't get bounced back into the wizard by
  // Dashboard's "no username yet" guard just because this response omitted it.
  const page = await db.findPageByUserId(user.id);
  res.json({ id: user.id, email: user.email, plan: user.plan, username: page ? page.username : null });
}

// Always responds 200 with the same message regardless of whether the email
// exists, so this endpoint can't be used to enumerate registered accounts.
async function forgotPassword(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });

  const user = await db.findUserByEmail(email);
  if (user) {
    const token = await db.createPasswordReset(user.id);
    const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${base}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }
  res.json({ ok: true, message: 'If an account exists for that email, a reset link has been sent.' });
}

async function resetPassword(req, res) {
  const token = String(req.body?.token || '');
  const password = String(req.body?.password || '');
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const userId = await db.consumePasswordReset(token);
  if (!userId) return res.status(400).json({ error: 'That reset link is invalid or has expired' });

  const passwordHash = await bcrypt.hash(password, 12);
  await db.setUserPassword(userId, passwordHash);
  res.json({ ok: true });
}

async function logout(req, res) {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (sid) await db.deleteSession(sid);
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
}

// Attaches req.user (or null) — does not itself reject unauthenticated requests.
async function attachUser(req, res, next) {
  const sid = req.cookies?.[SESSION_COOKIE];
  req.user = sid ? await db.getSessionUser(sid) : null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Loads req.user's page onto req.page — most dashboard routes need both.
async function requirePage(req, res, next) {
  const page = await db.findPageByUserId(req.user.id);
  if (!page) return res.status(404).json({ error: 'No page yet — finish onboarding first' });
  req.page = page;
  next();
}

module.exports = { SESSION_COOKIE, signup, login, logout, forgotPassword, resetPassword, attachUser, requireAuth, requirePage };
