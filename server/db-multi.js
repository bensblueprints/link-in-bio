// Postgres data layer for the hosted multi-tenant mode (APP_MODE=multi).
// Mirrors the shape of server/db.js's single-tenant SQLite helpers, but every
// read/write is scoped by page_id/user_id so tenants can never see each other's data.
const { Pool } = require('pg');
const crypto = require('crypto');

let pool;
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set (required for APP_MODE=multi)');
    pool = new Pool({ connectionString });
  }
  return pool;
}

const RESERVED_USERNAMES = new Set([
  'admin', 'api', 'dashboard', 'login', 'signup', 'logout', 'onboarding', 'pricing',
  'r', 'uploads', 'static', 'assets', 'www', 'app', 'help', 'support', 'about',
  'terms', 'privacy', 'linkleaf', 'root', 'null', 'undefined'
]);

function isValidUsername(u) {
  return typeof u === 'string' && /^[a-z0-9-]{3,30}$/.test(u) && !RESERVED_USERNAMES.has(u);
}

// ---- users ----
async function findUserByEmail(email) {
  const { rows } = await getPool().query('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase()]);
  return rows[0] || null;
}

async function findUserById(id) {
  const { rows } = await getPool().query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function createUser({ email, passwordHash }) {
  const { rows } = await getPool().query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *`,
    [String(email).toLowerCase(), passwordHash]
  );
  return rows[0];
}

async function setUserPlan(userId, plan, extra = {}) {
  const { rows } = await getPool().query(
    `UPDATE users SET plan = $2, whop_customer_id = COALESCE($3, whop_customer_id),
       whop_subscription_id = COALESCE($4, whop_subscription_id) WHERE id = $1 RETURNING *`,
    [userId, plan, extra.whopCustomerId || null, extra.whopSubscriptionId || null]
  );
  return rows[0];
}

// Founder lifetime deal is capped at 100 seats — assigned atomically so two
// concurrent purchases can't both land under the cap.
async function claimLifetimeSeat(userId) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const { rows: countRows } = await client.query('SELECT COUNT(*)::int AS n FROM users WHERE lifetime_seat_no IS NOT NULL');
    if (countRows[0].n >= 100) {
      await client.query('ROLLBACK');
      return null; // sold out
    }
    const { rows } = await client.query(
      `UPDATE users SET plan = 'lifetime', lifetime_seat_no = $2 WHERE id = $1 RETURNING *`,
      [userId, countRows[0].n + 1]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ---- sessions ----
async function createSession(userId, ttlDays = 30) {
  const id = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 3600 * 1000);
  await getPool().query('INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)', [id, userId, expiresAt]);
  return id;
}

async function getSessionUser(sessionId) {
  if (!sessionId) return null;
  const { rows } = await getPool().query(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [sessionId]
  );
  return rows[0] || null;
}

async function deleteSession(sessionId) {
  await getPool().query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

// ---- pages ----
async function usernameAvailable(username) {
  if (!isValidUsername(username)) return false;
  const { rows } = await getPool().query('SELECT 1 FROM pages WHERE username = $1', [username]);
  return rows.length === 0;
}

async function findPageByUserId(userId) {
  const { rows } = await getPool().query('SELECT * FROM pages WHERE user_id = $1', [userId]);
  return rows[0] || null;
}

async function findPageByUsername(username) {
  const { rows } = await getPool().query('SELECT * FROM pages WHERE username = $1', [username]);
  return rows[0] || null;
}

const PAGE_FIELDS = [
  'display_name', 'bio', 'avatar', 'socials', 'theme', 'accent',
  'bg_type', 'bg_value', 'font', 'custom_css', 'seo_title', 'seo_description'
];

async function updatePage(pageId, patch) {
  const sets = [];
  const values = [pageId];
  for (const key of PAGE_FIELDS) {
    if (key in patch) {
      values.push(key === 'socials' ? JSON.stringify(patch[key]) : patch[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (!sets.length) return findPageById(pageId);
  const { rows } = await getPool().query(`UPDATE pages SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, values);
  return rows[0];
}

async function findPageById(pageId) {
  const { rows } = await getPool().query('SELECT * FROM pages WHERE id = $1', [pageId]);
  return rows[0] || null;
}

// Creates the user's page + initial blocks in one transaction — the
// onboarding wizard's final submit step.
async function completeOnboarding({ userId, username, plan, theme, profile, links }) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    if (plan && plan !== 'free') {
      await client.query('UPDATE users SET plan = $2 WHERE id = $1', [userId, plan]);
    }
    const { rows: pageRows } = await client.query(
      `INSERT INTO pages (user_id, username, display_name, bio, avatar, theme)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, username, profile.display_name || '', profile.bio || '', profile.avatar || '', theme || 'gradient']
    );
    const page = pageRows[0];

    let position = 0;
    for (const link of links) {
      if (!link.value) continue;
      await client.query(
        `INSERT INTO blocks (page_id, type, title, url, position) VALUES ($1, 'link', $2, $3, $4)`,
        [page.id, link.platform, link.value, position++]
      );
    }
    await client.query('COMMIT');
    return page;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ---- blocks ----
async function listBlocks(pageId) {
  const { rows } = await getPool().query('SELECT * FROM blocks WHERE page_id = $1 ORDER BY position ASC, created_at ASC', [pageId]);
  return rows;
}

async function createBlock(pageId, f) {
  const { rows: maxRows } = await getPool().query('SELECT COALESCE(MAX(position), -1) AS m FROM blocks WHERE page_id = $1', [pageId]);
  const { rows } = await getPool().query(
    `INSERT INTO blocks (page_id, type, title, url, thumbnail, animate, position, start_at, end_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [pageId, f.type, f.title, f.url, f.thumbnail, !!f.animate, maxRows[0].m + 1, f.start_at, f.end_at]
  );
  return rows[0];
}

async function updateBlock(pageId, blockId, f) {
  const { rows } = await getPool().query(
    `UPDATE blocks SET type=$3, title=$4, url=$5, thumbnail=$6, animate=$7, start_at=$8, end_at=$9
     WHERE id = $2 AND page_id = $1 RETURNING *`,
    [pageId, blockId, f.type, f.title, f.url, f.thumbnail, !!f.animate, f.start_at, f.end_at]
  );
  return rows[0] || null;
}

async function deleteBlock(pageId, blockId) {
  await getPool().query('DELETE FROM blocks WHERE id = $1 AND page_id = $2', [blockId, pageId]);
}

async function reorderBlocks(pageId, ids) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < ids.length; i++) {
      await client.query('UPDATE blocks SET position = $3 WHERE id = $1 AND page_id = $2', [ids[i], pageId, i]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function findBlockById(blockId) {
  const { rows } = await getPool().query('SELECT * FROM blocks WHERE id = $1', [blockId]);
  return rows[0] || null;
}

// ---- analytics / tracking ----
async function recordView(pageId) {
  await getPool().query('INSERT INTO views (page_id) VALUES ($1)', [pageId]);
}

async function recordClick(blockId) {
  await getPool().query('INSERT INTO clicks (block_id) VALUES ($1)', [blockId]);
}

async function getAnalytics(pageId) {
  const pool = getPool();
  const { rows: viewRows } = await pool.query('SELECT COUNT(*)::int AS n FROM views WHERE page_id = $1', [pageId]);
  const { rows: clickRows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM clicks c JOIN blocks b ON b.id = c.block_id WHERE b.page_id = $1`,
    [pageId]
  );
  const totalViews = viewRows[0].n;
  const totalClicks = clickRows[0].n;

  const { rows: perLink } = await pool.query(
    `SELECT b.id, b.title, b.url, COUNT(c.id)::int AS clicks
     FROM blocks b LEFT JOIN clicks c ON c.block_id = b.id
     WHERE b.page_id = $1 AND b.type = 'link'
     GROUP BY b.id ORDER BY b.position ASC`,
    [pageId]
  );

  const { rows: viewsByDay } = await pool.query(
    `SELECT date(ts) AS d, COUNT(*)::int AS n FROM views WHERE page_id = $1 AND ts >= now() - interval '30 days' GROUP BY d`,
    [pageId]
  );
  const { rows: clicksByDay } = await pool.query(
    `SELECT date(c.ts) AS d, COUNT(*)::int AS n FROM clicks c JOIN blocks b ON b.id = c.block_id
     WHERE b.page_id = $1 AND c.ts >= now() - interval '30 days' GROUP BY d`,
    [pageId]
  );
  const viewsMap = Object.fromEntries(viewsByDay.map((r) => [r.d.toISOString().slice(0, 10), r.n]));
  const clicksMap = Object.fromEntries(clicksByDay.map((r) => [r.d.toISOString().slice(0, 10), r.n]));

  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ date: d, views: viewsMap[d] || 0, clicks: clicksMap[d] || 0 });
  }

  const { rows: subRows } = await pool.query('SELECT COUNT(*)::int AS n FROM subscribers WHERE page_id = $1', [pageId]);

  return {
    totalViews,
    totalClicks,
    ctr: totalViews ? +((totalClicks / totalViews) * 100).toFixed(1) : 0,
    perLink: perLink.map((r) => ({ ...r, ctr: totalViews ? +((r.clicks / totalViews) * 100).toFixed(1) : 0 })),
    days,
    subscribers: subRows[0].n
  };
}

// ---- subscribers ----
async function addSubscriber(pageId, blockId, email) {
  await getPool().query(
    `INSERT INTO subscribers (page_id, block_id, email) VALUES ($1, $2, $3)
     ON CONFLICT (page_id, email) DO NOTHING`,
    [pageId, blockId, email]
  );
}

async function listSubscribers(pageId) {
  const { rows } = await getPool().query('SELECT * FROM subscribers WHERE page_id = $1 ORDER BY ts DESC', [pageId]);
  return rows;
}

async function deleteSubscriber(pageId, id) {
  await getPool().query('DELETE FROM subscribers WHERE id = $1 AND page_id = $2', [id, pageId]);
}

module.exports = {
  getPool,
  isValidUsername,
  findUserByEmail,
  findUserById,
  createUser,
  setUserPlan,
  claimLifetimeSeat,
  createSession,
  getSessionUser,
  deleteSession,
  usernameAvailable,
  findPageByUserId,
  findPageByUsername,
  findPageById,
  updatePage,
  completeOnboarding,
  listBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
  findBlockById,
  recordView,
  recordClick,
  getAnalytics,
  addSubscriber,
  listSubscribers,
  deleteSubscriber
};
