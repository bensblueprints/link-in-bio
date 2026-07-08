// Admin dashboard for the hosted app — see every user and their subscription.
// Gated by a single ADMIN_TOKEN env var (not a user account), so the owner can
// always get in. Server-rendered so it needs no client build to change.
//
// Access:  https://<domain>/admin?token=<ADMIN_TOKEN>
// Disabled entirely if ADMIN_TOKEN is unset.
const crypto = require('crypto');
const db = require('./db-multi');
const gating = require('./gating');

function tokenOk(provided) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const a = Buffer.from(String(provided || ''));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Rough monthly recurring revenue: sum each user's plan monthly price (annual
// plans counted at their per-month equivalent; one-time/lifetime excluded).
function estimateMrr(counts) {
  let mrr = 0;
  for (const [plan, n] of Object.entries(counts)) {
    const cfg = gating.PLANS[plan];
    if (cfg && typeof cfg.priceMonthly === 'number') mrr += cfg.priceMonthly * n;
  }
  return mrr;
}

function badge(plan) {
  const color = { free: '#3f3f46', starter: '#0ea5e9', pro: '#f97316', premium: '#a855f7', lifetime: '#eab308' }[plan] || '#3f3f46';
  return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600">${esc(plan)}</span>`;
}

async function renderAdminPage(req, res) {
  if (!process.env.ADMIN_TOKEN) {
    return res.status(404).type('html').send('<h1>Admin disabled</h1><p>Set ADMIN_TOKEN in the server env to enable the admin dashboard.</p>');
  }
  const token = req.query.token || req.get('x-admin-token');
  if (!tokenOk(token)) {
    return res.status(401).type('html').send(`<!doctype html><meta charset="utf-8"><title>Admin login</title>
      <body style="font-family:system-ui;background:#09090b;color:#fafafa;display:flex;min-height:100vh;align-items:center;justify-content:center">
      <form method="GET" style="background:#18181b;border:1px solid #27272a;padding:32px;border-radius:16px;width:320px">
        <h1 style="font-size:18px;margin:0 0 16px">🌿 LinkLeaf Admin</h1>
        <input name="token" type="password" placeholder="Admin token" autofocus
          style="width:100%;padding:10px;border-radius:8px;border:1px solid #27272a;background:#09090b;color:#fafafa;box-sizing:border-box"/>
        <button style="width:100%;margin-top:12px;padding:10px;border:0;border-radius:8px;background:#f97316;color:#fff;font-weight:600;cursor:pointer">View dashboard</button>
      </form></body>`);
  }

  const [users, counts] = await Promise.all([db.listAllUsers(), db.planCounts()]);
  const total = users.length;
  const paid = users.filter((u) => u.plan && u.plan !== 'free').length;
  const lifetimeUsed = users.filter((u) => u.lifetime_seat_no != null).length;
  const mrr = estimateMrr(counts);

  const stat = (label, val) =>
    `<div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px 20px">
       <div style="font-size:12px;color:#a1a1aa">${label}</div>
       <div style="font-size:24px;font-weight:800;margin-top:4px">${val}</div></div>`;

  const rows = users.map((u) => {
    const pageLink = u.username ? `<a href="/${esc(u.username)}" target="_blank" style="color:#f97316">@${esc(u.username)}</a>` : '<span style="color:#71717a">— no page —</span>';
    const sub = u.whop_subscription_id || u.whop_customer_id
      ? `<span style="color:#a1a1aa;font-size:11px">${esc(u.whop_subscription_id || u.whop_customer_id)}</span>`
      : (u.plan === 'free' ? '<span style="color:#52525b">free</span>' : '<span style="color:#eab308">via Whop</span>');
    const seat = u.lifetime_seat_no != null ? `#${u.lifetime_seat_no}` : '';
    const joined = new Date(u.created_at).toISOString().slice(0, 10);
    return `<tr style="border-top:1px solid #27272a">
      <td style="padding:10px 12px">${pageLink}</td>
      <td style="padding:10px 12px">${esc(u.email)}</td>
      <td style="padding:10px 12px">${badge(u.plan)} ${seat}</td>
      <td style="padding:10px 12px">${sub}</td>
      <td style="padding:10px 12px;text-align:center">${u.block_count ?? 0}</td>
      <td style="padding:10px 12px;text-align:center">${u.view_count ?? 0}</td>
      <td style="padding:10px 12px;color:#a1a1aa">${joined}</td>
    </tr>`;
  }).join('');

  res.type('html').send(`<!doctype html><meta charset="utf-8"><title>LinkLeaf Admin — ${total} users</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <body style="font-family:system-ui;background:#09090b;color:#fafafa;margin:0;padding:24px">
  <div style="max-width:1100px;margin:0 auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1 style="font-size:20px;margin:0">🌿 LinkLeaf Admin</h1>
      <a href="https://whop.com/dashboard" target="_blank" style="color:#a1a1aa;font-size:13px">Billing on Whop →</a>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px">
      ${stat('Total users', total)}
      ${stat('Paid users', paid)}
      ${stat('Est. MRR', '$' + mrr.toFixed(2))}
      ${stat('Lifetime seats', lifetimeUsed + ' / 100')}
      ${stat('Free', counts.free || 0)}
      ${stat('Pro', counts.pro || 0)}
    </div>
    <div style="overflow-x:auto;border:1px solid #27272a;border-radius:12px">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#18181b;text-align:left">
        <th style="padding:10px 12px">Page</th>
        <th style="padding:10px 12px">Email</th>
        <th style="padding:10px 12px">Plan</th>
        <th style="padding:10px 12px">Subscription</th>
        <th style="padding:10px 12px;text-align:center">Blocks</th>
        <th style="padding:10px 12px;text-align:center">Views</th>
        <th style="padding:10px 12px">Joined</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="padding:20px;text-align:center;color:#71717a">No users yet</td></tr>'}</tbody>
    </table>
    </div>
    <p style="color:#52525b;font-size:12px;margin-top:16px">Subscription column shows the Whop membership/subscription id we recorded when their plan was set. For full billing history, refunds, and renewal dates, open the Whop dashboard.</p>
  </div></body>`);
}

module.exports = { renderAdminPage };
