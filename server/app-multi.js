const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const db = require('./db-multi');
const auth = require('./auth');
const gating = require('./gating');
const { renderPublicPage, FONTS, THEMES, SOCIALS, isBlockLive } = require('./public-page');

function createMultiApp(opts = {}) {
  const dataDir = opts.dataDir || process.env.DATA_DIR || path.join(__dirname, '..', 'data');
  const distDir = path.join(__dirname, '..', 'dist-hosted');

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(auth.attachUser);

  // ---- uploads (same disk-storage pattern as the self-host product; a
  // Coolify volume on /data makes this persist across deploys) ----
  const uploadsDir = path.join(dataDir, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.png').toLowerCase();
      cb(null, `${Date.now()}-${require('crypto').randomBytes(4).toString('hex')}${ext}`);
    }
  });
  const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpe?g|webp|gif|svg\+xml|avif)$/.test(file.mimetype))
  });
  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

  // ================= AUTH =================
  app.post('/api/auth/signup', auth.signup);
  app.post('/api/auth/login', auth.login);
  app.post('/api/auth/logout', auth.logout);
  app.get('/api/auth/me', (req, res) => {
    if (!req.user) return res.json({ authed: false });
    res.json({ authed: true, id: req.user.id, email: req.user.email, plan: req.user.plan });
  });

  // ================= ONBOARDING =================
  app.get('/api/onboarding/username-check', async (req, res) => {
    const u = String(req.query.u || '').toLowerCase();
    res.json({ available: await db.usernameAvailable(u) });
  });

  app.post('/api/onboarding/complete', auth.requireAuth, async (req, res) => {
    const { username, plan, theme, profile, links } = req.body || {};
    if (!db.isValidUsername(username)) return res.status(400).json({ error: 'Invalid username' });
    if (!(await db.usernameAvailable(username))) return res.status(409).json({ error: 'Username already taken' });
    const existing = await db.findPageByUserId(req.user.id);
    if (existing) return res.status(409).json({ error: 'You already have a page' });

    const chosenTheme = gating.allowedThemes(plan === 'free' || !plan ? 'free' : plan).includes(theme) ? theme : gating.allowedThemes('free')[0];
    const page = await db.completeOnboarding({
      userId: req.user.id,
      username,
      plan,
      theme: chosenTheme,
      profile: profile || {},
      links: Array.isArray(links) ? links : []
    });
    res.status(201).json(page);
  });

  // ================= DASHBOARD API (auth + page required) =================
  const dash = express.Router();
  dash.use(auth.requireAuth, auth.requirePage);

  dash.get('/meta', (req, res) => {
    res.json({
      themes: THEMES,
      allowedThemes: gating.allowedThemes(req.user.plan),
      fonts: Object.fromEntries(Object.entries(FONTS).map(([k, v]) => [k, v.label])),
      socials: Object.fromEntries(Object.entries(SOCIALS).map(([k, v]) => [k, v.label])),
      plan: req.user.plan,
      gating: gating.planConfig(req.user.plan)
    });
  });

  dash.get('/settings', (req, res) => res.json(req.page));

  dash.put('/settings', async (req, res) => {
    const patch = { ...req.body };
    const cfg = gating.planConfig(req.user.plan);
    if (patch.theme && !gating.canUseTheme(req.user.plan, patch.theme)) delete patch.theme;
    if (!cfg.customStyling) {
      delete patch.custom_css;
      delete patch.bg_type;
      delete patch.bg_value;
      delete patch.accent;
    }
    const updated = await db.updatePage(req.page.id, patch);
    res.json(updated);
  });

  dash.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image received (png/jpg/webp/gif/svg/avif, max 8MB)' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  const blockFields = (b) => ({
    type: ['link', 'header', 'youtube', 'email'].includes(b.type) ? b.type : 'link',
    title: String(b.title ?? ''),
    url: String(b.url ?? ''),
    thumbnail: String(b.thumbnail ?? ''),
    animate: !!b.animate,
    start_at: b.start_at || null,
    end_at: b.end_at || null
  });

  dash.get('/blocks', async (req, res) => res.json(await db.listBlocks(req.page.id)));

  dash.post('/blocks', async (req, res) => {
    const f = blockFields(req.body || {});
    if (f.type === 'email' && !gating.canUseEmailCollect(req.user.plan)) {
      return res.status(403).json({ error: 'Email-collect blocks require the Starter plan or higher' });
    }
    if (f.type === 'youtube') {
      const existing = await db.listBlocks(req.page.id);
      const ytCount = existing.filter((b) => b.type === 'youtube').length;
      if (!gating.canAddYoutubeBlock(req.user.plan, ytCount)) {
        return res.status(403).json({ error: 'Free plan is limited to 1 YouTube embed — upgrade for unlimited' });
      }
    }
    res.status(201).json(await db.createBlock(req.page.id, f));
  });

  dash.put('/blocks/reorder', async (req, res) => {
    await db.reorderBlocks(req.page.id, Array.isArray(req.body?.ids) ? req.body.ids : []);
    res.json({ ok: true });
  });

  dash.put('/blocks/:id', async (req, res) => {
    const existing = (await db.listBlocks(req.page.id)).find((b) => b.id === req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const f = blockFields({ ...existing, ...req.body });
    if (f.type === 'email' && !gating.canUseEmailCollect(req.user.plan)) {
      return res.status(403).json({ error: 'Email-collect blocks require the Starter plan or higher' });
    }
    const updated = await db.updateBlock(req.page.id, req.params.id, f);
    res.json(updated);
  });

  dash.delete('/blocks/:id', async (req, res) => {
    await db.deleteBlock(req.page.id, req.params.id);
    res.json({ ok: true });
  });

  dash.get('/analytics', async (req, res) => res.json(await db.getAnalytics(req.page.id)));

  dash.get('/subscribers', async (req, res) => res.json(await db.listSubscribers(req.page.id)));

  dash.get('/subscribers.csv', async (req, res) => {
    const rows = await db.listSubscribers(req.page.id);
    const csv = 'email,subscribed_at\n' + rows.map((r) => `${r.email.replace(/"/g, '""')},${r.ts.toISOString()}`).join('\n') + '\n';
    res.set('Content-Disposition', 'attachment; filename="subscribers.csv"');
    res.type('text/csv').send(csv);
  });

  dash.delete('/subscribers/:id', async (req, res) => {
    await db.deleteSubscriber(req.page.id, req.params.id);
    res.json({ ok: true });
  });

  // mounted at /api (not /api/dashboard) so the copied Tab components' api.js
  // calls (/api/settings, /api/blocks, /api/subscribers.csv, ...) work unchanged
  app.use('/api', dash);

  // ================= BILLING (Whop webhook — same pattern as GotBeef/Airwallex) =================
  app.post('/api/webhooks/whop', express.json({ limit: '256kb' }), async (req, res) => {
    // TODO: verify Whop signature header once WHOP_WEBHOOK_SECRET is set from the created products.
    const { user_id: userId, plan, event, whop_customer_id: whopCustomerId, whop_subscription_id: whopSubscriptionId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'missing user_id' });
    if (event === 'lifetime_purchase') {
      const updated = await db.claimLifetimeSeat(userId);
      if (!updated) return res.status(409).json({ error: 'Founder lifetime seats are sold out' });
      return res.json({ ok: true, plan: updated.plan, seat: updated.lifetime_seat_no });
    }
    const updated = await db.setUserPlan(userId, plan || 'free', { whopCustomerId, whopSubscriptionId });
    res.json({ ok: true, plan: updated.plan });
  });

  // ================= PUBLIC =================
  app.get('/r/:id', async (req, res) => {
    const block = await db.findBlockById(req.params.id);
    if (!block || block.type !== 'link' || !block.url || !isBlockLive(block)) return res.redirect('/');
    await db.recordClick(block.id);
    res.redirect(block.url);
  });

  app.get('/api/plans', (req, res) => {
    res.json({ plans: gating.PLANS, order: gating.PLAN_ORDER, themes: THEMES });
  });

  app.post('/api/public/subscribe', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const pageId = req.body?.page_id;
    const blockId = req.body?.block_id || null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    if (!pageId) return res.status(400).json({ error: 'Missing page' });
    await db.addSubscriber(pageId, blockId, email);
    res.json({ ok: true, message: "You're on the list! 🎉" });
  });

  const RESERVED_TOP_LEVEL = new Set(['login', 'signup', 'onboarding', 'dashboard', 'pricing', 'uploads', 'api', 'r', 'assets']);

  app.get('/:username', async (req, res, next) => {
    const username = req.params.username.toLowerCase();
    if (RESERVED_TOP_LEVEL.has(username)) return next();
    const page = await db.findPageByUsername(username);
    if (!page) return next();
    const owner = await db.findUserById(page.user_id);
    const blocks = await db.listBlocks(page.id);
    await db.recordView(page.id);
    const origin = `${req.protocol}://${req.get('host')}`;
    let html = renderPublicPage({ settings: { ...page, socials: JSON.stringify(page.socials || {}) }, blocks, origin, basePath: '' });
    if (gating.showBadge(owner?.plan)) {
      html = html.replace('</main>', `<a class="footer" href="/" target="_blank" rel="noreferrer">Made with LinkLeaf 🌿</a></main>`);
    }
    res.set('Cache-Control', 'no-store');
    res.type('html').send(html);
  });

  // ================= HOSTED SPA (marketing/login/signup/onboarding/dashboard) =================
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
  } else {
    app.get('*', (req, res) => res.status(503).type('html').send('<h1>Hosted client not built</h1><p>Run <code>npm run build:hosted</code> first.</p>'));
  }

  app.locals.dataDir = dataDir;
  return app;
}

module.exports = { createMultiApp };
