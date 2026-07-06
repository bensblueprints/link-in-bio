const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const { openDb, getSettings, setSettings } = require('./db');
const { renderPublicPage, FONTS, THEMES, SOCIALS, isBlockLive } = require('./public-page');

function createApp(opts = {}) {
  const dataDir = opts.dataDir || process.env.DATA_DIR || path.join(__dirname, '..', 'data');
  const adminPassword = opts.adminPassword || process.env.ADMIN_PASSWORD || 'admin';
  const autologinToken = opts.autologinToken || process.env.AUTOLOGIN_TOKEN || null;

  const db = openDb(dataDir);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // ---- sessions (in-memory, simple by design) ----
  const sessions = new Set();
  function newSession(res) {
    const sid = crypto.randomBytes(24).toString('hex');
    sessions.add(sid);
    res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 3600 * 1000 });
    return sid;
  }
  function requireAuth(req, res, next) {
    if (req.cookies.sid && sessions.has(req.cookies.sid)) return next();
    res.status(401).json({ error: 'Unauthorized' });
  }

  // ---- uploads ----
  const uploadsDir = path.join(dataDir, 'uploads');
  const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.png').toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    }
  });
  const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      cb(null, /^image\/(png|jpe?g|webp|gif|svg\+xml|avif)$/.test(file.mimetype));
    }
  });
  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

  // ================= PUBLIC =================

  app.get('/', (req, res) => {
    const settings = getSettings(db);
    const blocks = db.prepare('SELECT * FROM blocks ORDER BY position ASC, id ASC').all();
    db.prepare('INSERT INTO views DEFAULT VALUES').run();
    const origin = `${req.protocol}://${req.get('host')}`;
    res.set('Cache-Control', 'no-store');
    res.type('html').send(renderPublicPage({ settings, blocks, origin }));
  });

  // tracked redirect
  app.get('/r/:id', (req, res) => {
    const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(req.params.id);
    if (!block || block.type !== 'link' || !block.url || !isBlockLive(block)) {
      return res.redirect('/');
    }
    db.prepare('INSERT INTO clicks (block_id) VALUES (?)').run(block.id);
    res.redirect(block.url);
  });

  app.post('/api/public/subscribe', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const blockId = Number(req.body?.block_id) || null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    try {
      db.prepare('INSERT INTO subscribers (email, block_id) VALUES (?, ?)').run(email, blockId);
    } catch (e) {
      if (!/UNIQUE/.test(String(e))) throw e;
    }
    res.json({ ok: true, message: "You're on the list! 🎉" });
  });

  // ================= AUTH =================

  app.post('/api/login', (req, res) => {
    const pw = String(req.body?.password || '');
    const a = Buffer.from(pw);
    const b = Buffer.from(adminPassword);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) return res.status(401).json({ error: 'Wrong password' });
    newSession(res);
    res.json({ ok: true });
  });

  app.post('/api/logout', (req, res) => {
    sessions.delete(req.cookies.sid);
    res.clearCookie('sid');
    res.json({ ok: true });
  });

  app.get('/api/me', (req, res) => {
    res.json({ authed: !!(req.cookies.sid && sessions.has(req.cookies.sid)) });
  });

  // desktop-mode auto-login
  if (autologinToken) {
    app.get('/auth/auto', (req, res) => {
      if (req.query.token !== autologinToken) return res.status(403).send('Forbidden');
      newSession(res);
      res.redirect('/admin');
    });
  }

  // ================= ADMIN API =================

  app.get('/api/meta', requireAuth, (req, res) => {
    res.json({
      themes: THEMES,
      fonts: Object.fromEntries(Object.entries(FONTS).map(([k, v]) => [k, v.label])),
      socials: Object.fromEntries(Object.entries(SOCIALS).map(([k, v]) => [k, v.label]))
    });
  });

  app.get('/api/settings', requireAuth, (req, res) => {
    res.json(getSettings(db));
  });

  app.put('/api/settings', requireAuth, (req, res) => {
    setSettings(db, req.body || {});
    res.json(getSettings(db));
  });

  app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image received (png/jpg/webp/gif/svg/avif, max 8MB)' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // ---- blocks CRUD ----
  const blockFields = (b) => ({
    type: ['link', 'header', 'youtube', 'email'].includes(b.type) ? b.type : 'link',
    title: String(b.title ?? ''),
    url: String(b.url ?? ''),
    thumbnail: String(b.thumbnail ?? ''),
    animate: b.animate ? 1 : 0,
    start_at: b.start_at || null,
    end_at: b.end_at || null
  });

  app.get('/api/blocks', requireAuth, (req, res) => {
    res.json(db.prepare('SELECT * FROM blocks ORDER BY position ASC, id ASC').all());
  });

  app.post('/api/blocks', requireAuth, (req, res) => {
    const f = blockFields(req.body || {});
    const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM blocks').get().m;
    const info = db
      .prepare(
        `INSERT INTO blocks (type, title, url, thumbnail, animate, position, start_at, end_at)
         VALUES (@type, @title, @url, @thumbnail, @animate, @position, @start_at, @end_at)`
      )
      .run({ ...f, position: maxPos + 1 });
    res.status(201).json(db.prepare('SELECT * FROM blocks WHERE id = ?').get(info.lastInsertRowid));
  });

  app.put('/api/blocks/reorder', requireAuth, (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const stmt = db.prepare('UPDATE blocks SET position = ? WHERE id = ?');
    db.transaction(() => ids.forEach((id, i) => stmt.run(i, id)))();
    res.json({ ok: true });
  });

  app.put('/api/blocks/:id', requireAuth, (req, res) => {
    const existing = db.prepare('SELECT * FROM blocks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const f = blockFields({ ...existing, ...req.body });
    db.prepare(
      `UPDATE blocks SET type=@type, title=@title, url=@url, thumbnail=@thumbnail,
       animate=@animate, start_at=@start_at, end_at=@end_at WHERE id=@id`
    ).run({ ...f, id: existing.id });
    res.json(db.prepare('SELECT * FROM blocks WHERE id = ?').get(existing.id));
  });

  app.delete('/api/blocks/:id', requireAuth, (req, res) => {
    db.prepare('DELETE FROM blocks WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  // ---- analytics ----
  app.get('/api/analytics', requireAuth, (req, res) => {
    const totalViews = db.prepare('SELECT COUNT(*) AS n FROM views').get().n;
    const totalClicks = db.prepare('SELECT COUNT(*) AS n FROM clicks').get().n;
    const perLink = db
      .prepare(
        `SELECT b.id, b.title, b.url, COUNT(c.id) AS clicks
         FROM blocks b LEFT JOIN clicks c ON c.block_id = b.id
         WHERE b.type = 'link'
         GROUP BY b.id ORDER BY b.position ASC`
      )
      .all()
      .map((r) => ({ ...r, ctr: totalViews ? +((r.clicks / totalViews) * 100).toFixed(1) : 0 }));

    // 30-day daily series
    const days = [];
    const viewsByDay = Object.fromEntries(
      db.prepare(`SELECT date(ts) AS d, COUNT(*) AS n FROM views WHERE ts >= datetime('now','-30 days') GROUP BY d`).all().map((r) => [r.d, r.n])
    );
    const clicksByDay = Object.fromEntries(
      db.prepare(`SELECT date(ts) AS d, COUNT(*) AS n FROM clicks WHERE ts >= datetime('now','-30 days') GROUP BY d`).all().map((r) => [r.d, r.n])
    );
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push({ date: d, views: viewsByDay[d] || 0, clicks: clicksByDay[d] || 0 });
    }
    const subscribers = db.prepare('SELECT COUNT(*) AS n FROM subscribers').get().n;
    res.json({ totalViews, totalClicks, ctr: totalViews ? +((totalClicks / totalViews) * 100).toFixed(1) : 0, perLink, days, subscribers });
  });

  // ---- subscribers ----
  app.get('/api/subscribers', requireAuth, (req, res) => {
    res.json(db.prepare('SELECT * FROM subscribers ORDER BY ts DESC').all());
  });

  app.get('/api/subscribers.csv', requireAuth, (req, res) => {
    const rows = db.prepare('SELECT email, ts FROM subscribers ORDER BY ts ASC').all();
    const csv = 'email,subscribed_at\n' + rows.map((r) => `${r.email.replace(/"/g, '""')},${r.ts}`).join('\n') + '\n';
    res.set('Content-Disposition', 'attachment; filename="subscribers.csv"');
    res.type('text/csv').send(csv);
  });

  app.delete('/api/subscribers/:id', requireAuth, (req, res) => {
    db.prepare('DELETE FROM subscribers WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  // ================= ADMIN SPA =================
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    app.use('/admin', express.static(distDir));
    app.get('/admin/*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
  } else {
    app.get('/admin', (req, res) =>
      res.status(503).type('html').send('<h1>Admin UI not built</h1><p>Run <code>npm run build</code> first.</p>')
    );
  }

  app.locals.db = db;
  return app;
}

module.exports = { createApp };
