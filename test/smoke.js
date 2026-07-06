// Smoke test — exercises the real server end-to-end against a throwaway SQLite db:
//   1. login → create profile + theme + 3 link blocks via the admin API
//   2. fetch the public page → links render in order, theme class applied
//   3. hit a tracked redirect → click row recorded, analytics aggregates update
//   4. create an email-collect block, subscribe → subscriber row + CSV export contains it
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../server/app');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linkinbio-test-'));
const app = createApp({ dataDir, adminPassword: 'test-pass-123' });

let passed = 0;
function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

(async () => {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const jf = (url, opts = {}) =>
    fetch(base + url, { ...opts, redirect: 'manual', headers: { 'Content-Type': 'application/json', cookie, ...(opts.headers || {}) } });

  try {
    console.log('Smoke test: Link-in-Bio\n');

    // --- auth ---
    let r = await jf('/api/blocks');
    assert.strictEqual(r.status, 401, 'admin API requires auth');
    ok('admin API rejects unauthenticated requests');

    r = await jf('/api/login', { method: 'POST', body: JSON.stringify({ password: 'wrong' }) });
    assert.strictEqual(r.status, 401);
    ok('wrong password rejected');

    r = await jf('/api/login', { method: 'POST', body: JSON.stringify({ password: 'test-pass-123' }) });
    assert.strictEqual(r.status, 200);
    cookie = r.headers.get('set-cookie').split(';')[0];
    ok('login sets session cookie');

    // --- profile + theme ---
    r = await jf('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({
        display_name: 'Smoke Tester',
        bio: 'Testing all the things',
        theme: 'neon',
        accent: '#22d3ee',
        socials: JSON.stringify({ instagram: 'https://instagram.com/smoke', github: 'https://github.com/smoke' })
      })
    });
    assert.strictEqual(r.status, 200);
    const settings = await r.json();
    assert.strictEqual(settings.display_name, 'Smoke Tester');
    assert.strictEqual(settings.theme, 'neon');
    ok('profile + theme saved via API');

    // --- 3 link blocks ---
    const titles = ['First Link', 'Second Link', 'Third Link'];
    const blocks = [];
    for (const [i, title] of titles.entries()) {
      r = await jf('/api/blocks', {
        method: 'POST',
        body: JSON.stringify({ type: 'link', title, url: `https://example.com/${i + 1}`, animate: 1 })
      });
      assert.strictEqual(r.status, 201);
      blocks.push(await r.json());
    }
    ok('created 3 link blocks');

    // --- reorder: reverse them, then restore to prove reorder persists ---
    await jf('/api/blocks/reorder', { method: 'PUT', body: JSON.stringify({ ids: [blocks[2].id, blocks[0].id, blocks[1].id] }) });
    r = await jf('/api/blocks');
    let order = (await r.json()).map((b) => b.title);
    assert.deepStrictEqual(order, ['Third Link', 'First Link', 'Second Link']);
    await jf('/api/blocks/reorder', { method: 'PUT', body: JSON.stringify({ ids: blocks.map((b) => b.id) }) });
    ok('drag-reorder endpoint persists new order');

    // --- scheduling: a future-dated block must not render publicly ---
    r = await jf('/api/blocks', {
      method: 'POST',
      body: JSON.stringify({ type: 'link', title: 'Future Link', url: 'https://example.com/future', start_at: new Date(Date.now() + 86400000).toISOString() })
    });
    const futureBlock = await r.json();

    // --- public page ---
    r = await fetch(base + '/');
    const html = await r.text();
    assert.strictEqual(r.status, 200);
    assert(html.includes('class="theme-neon"'), 'theme class on body');
    assert(html.includes('Smoke Tester'), 'display name rendered');
    const idx = titles.map((t) => html.indexOf(t));
    assert(idx.every((i) => i !== -1), 'all 3 links rendered');
    assert(idx[0] < idx[1] && idx[1] < idx[2], 'links render in saved order');
    assert(!html.includes('Future Link'), 'scheduled (future) block hidden');
    assert(html.includes('og:title'), 'OG meta tags present');
    assert(html.includes(`--accent: #22d3ee`), 'custom accent applied');
    ok('public page renders links in order with theme class, accent, OG tags; schedule respected');

    // --- click tracking ---
    r = await fetch(`${base}/r/${blocks[0].id}`, { redirect: 'manual' });
    assert.strictEqual(r.status, 302);
    assert.strictEqual(r.headers.get('location'), 'https://example.com/1');
    const db = app.locals.db;
    const clickRow = db.prepare('SELECT * FROM clicks WHERE block_id = ?').get(blocks[0].id);
    assert(clickRow, 'click row inserted');
    ok('tracked redirect records click row and 302s to target');

    // scheduled block redirect must NOT count
    r = await fetch(`${base}/r/${futureBlock.id}`, { redirect: 'manual' });
    assert.strictEqual(r.headers.get('location'), '/');
    assert(!db.prepare('SELECT * FROM clicks WHERE block_id = ?').get(futureBlock.id), 'no click for scheduled block');
    ok('scheduled block redirect bounces home without counting');

    // --- analytics aggregate ---
    r = await jf('/api/analytics');
    const a = await r.json();
    assert(a.totalViews >= 1, 'page view counted');
    assert.strictEqual(a.totalClicks, 1);
    const first = a.perLink.find((l) => l.id === blocks[0].id);
    assert.strictEqual(first.clicks, 1);
    assert(first.ctr > 0, 'CTR computed');
    assert.strictEqual(a.days.length, 30, '30-day series');
    const today = a.days[a.days.length - 1];
    assert(today.views >= 1 && today.clicks === 1, "today's datapoint aggregates views+clicks");
    ok('analytics aggregates views, clicks, per-link CTR, 30-day chart');

    // --- email collect ---
    r = await jf('/api/blocks', { method: 'POST', body: JSON.stringify({ type: 'email', title: 'Newsletter' }) });
    const emailBlock = await r.json();
    r = await fetch(base + '/api/public/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fan@example.com', block_id: emailBlock.id })
    });
    assert.strictEqual(r.status, 200);
    const subRow = db.prepare('SELECT * FROM subscribers WHERE email = ?').get('fan@example.com');
    assert(subRow, 'subscriber row inserted');
    assert.strictEqual(subRow.block_id, emailBlock.id);
    ok('email-collect POST stores subscriber row');

    r = await fetch(base + '/api/public/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' })
    });
    assert.strictEqual(r.status, 400);
    ok('invalid email rejected');

    r = await jf('/api/subscribers.csv');
    const csv = await r.text();
    assert(r.headers.get('content-type').includes('text/csv'));
    assert(csv.startsWith('email,subscribed_at'), 'CSV header');
    assert(csv.includes('fan@example.com'), 'CSV export contains subscriber');
    ok('CSV export contains the subscriber');

    console.log(`\nAll ${passed} smoke checks passed.`);
    process.exitCode = 0;
  } catch (e) {
    console.error('\nSMOKE TEST FAILED:', e.message);
    console.error(e.stack);
    process.exitCode = 1;
  } finally {
    server.close();
    try {
      app.locals.db.close();
      fs.rmSync(dataDir, { recursive: true, force: true });
    } catch {}
  }
})();
