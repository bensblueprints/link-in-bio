// Smoke test for the hosted multi-tenant mode. Requires a real (throwaway)
// Postgres reachable via DATABASE_URL — run against docker-compose.hosted.yml's
// db service, or any scratch Postgres. Exercises:
//   1. signup -> onboarding wizard completion -> public page renders
//   2. a second, independent signup gets a fully isolated page (no cross-tenant leakage)
//   3. dashboard edit (theme change) persists and is reflected on the public page
//   4. Whop webhook payload flips a user's plan
const assert = require('assert');
const { runMigrations } = require('../scripts/migrate-pg');
const { createMultiApp } = require('../server/app-multi');
const { getPool } = require('../server/db-multi');

let passed = 0;
function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

async function signupAndOnboard(base, jarName, username) {
  let cookie = '';
  const jf = (url, opts = {}) =>
    fetch(base + url, { ...opts, redirect: 'manual', headers: { 'Content-Type': 'application/json', cookie, ...(opts.headers || {}) } });

  let r = await jf('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email: `${jarName}@example.com`, password: 'testpass123' }) });
  assert.strictEqual(r.status, 201, `signup ${jarName}`);
  cookie = r.headers.get('set-cookie').split(';')[0];
  const user = await r.json();

  r = await jf('/api/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify({
      username,
      plan: 'free',
      theme: 'dark',
      profile: { display_name: jarName, bio: `Bio for ${jarName}` },
      links: [{ platform: 'website', value: `https://example.com/${username}` }]
    })
  });
  assert.strictEqual(r.status, 201, `onboarding complete for ${jarName}`);
  return { cookie, user };
}

(async () => {
  const server = await new Promise((resolve) => {
    const app = createMultiApp({ dataDir: require('os').tmpdir() + '/linkleaf-multi-smoke' });
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    console.log('Smoke test: LinkLeaf (hosted, multi-tenant)\n');

    await runMigrations();
    ok('migrations applied');

    const alice = await signupAndOnboard(base, 'alice', 'alice-smoke');
    const bob = await signupAndOnboard(base, 'bob', 'bob-smoke');
    ok('two independent signups completed onboarding');

    // --- isolation: alice's dashboard data must not include bob's blocks ---
    let r = await fetch(base + '/api/blocks', { headers: { cookie: alice.cookie } });
    const aliceBlocks = await r.json();
    assert.strictEqual(aliceBlocks.length, 1);
    assert(aliceBlocks[0].url.includes('alice-smoke'));
    ok('tenant isolation: alice only sees her own blocks');

    // --- public pages render independently ---
    r = await fetch(base + '/alice-smoke');
    let html = await r.text();
    assert(html.includes('alice'), 'alice page shows her display name');
    assert(html.includes('class="theme-dark"'), 'alice page uses her chosen theme');

    r = await fetch(base + '/bob-smoke');
    html = await r.text();
    assert(html.includes('bob'), 'bob page shows his display name');
    assert(!html.includes('alice-smoke'), 'bob page does not leak alice\'s link');
    ok('public pages at /{username} are isolated per tenant');

    // free-plan pages show the LinkLeaf badge
    assert(html.includes('Made with LinkLeaf'), 'free-plan public page shows the badge');
    ok('free-plan badge shown on public page');

    // --- dashboard edit persists to the public page ---
    r = await fetch(base + '/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', cookie: alice.cookie },
      body: JSON.stringify({ display_name: 'Alice Updated' })
    });
    assert.strictEqual(r.status, 200);
    r = await fetch(base + '/alice-smoke');
    html = await r.text();
    assert(html.includes('Alice Updated'), 'dashboard edit reflected on public page');
    ok('dashboard settings edit persists and renders publicly');

    // --- gating: free plan cannot use custom CSS ---
    r = await fetch(base + '/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', cookie: alice.cookie },
      body: JSON.stringify({ custom_css: '.page { color: red; }' })
    });
    const updated = await r.json();
    assert.strictEqual(updated.custom_css, '', 'free plan custom_css change was silently stripped');
    ok('gating: free plan cannot set custom CSS');

    // --- gating: free plan cannot create an email-collect block ---
    r = await fetch(base + '/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: alice.cookie },
      body: JSON.stringify({ type: 'email', title: 'Join' })
    });
    assert.strictEqual(r.status, 403, 'free plan rejected for email-collect block');
    ok('gating: free plan cannot create email-collect blocks');

    // --- Whop webhook flips plan ---
    r = await fetch(base + '/api/webhooks/whop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: alice.user.id, plan: 'pro' })
    });
    assert.strictEqual(r.status, 200);
    const webhookResult = await r.json();
    assert.strictEqual(webhookResult.plan, 'pro');
    ok('Whop webhook payload updates user plan');

    // now email-collect should be allowed post-upgrade
    r = await fetch(base + '/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: alice.cookie },
      body: JSON.stringify({ type: 'email', title: 'Join' })
    });
    assert.strictEqual(r.status, 201, 'email-collect allowed after upgrade to pro');
    ok('gating unlocks after plan upgrade');

    console.log(`\nAll ${passed} multi-tenant smoke checks passed.`);
    process.exitCode = 0;
  } catch (e) {
    console.error('\nSMOKE TEST FAILED:', e.message);
    console.error(e.stack);
    process.exitCode = 1;
  } finally {
    server.close();
    await getPool().end();
  }
})();
