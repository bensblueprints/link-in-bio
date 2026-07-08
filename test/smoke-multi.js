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

    // --- Whop webhook flips plan (REAL Whop V2 shape: type + data.user.email + data.plan.id) ---
    r = await fetch(base + '/api/webhooks/whop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'membership.activated', data: { id: 'mem_x', user: { email: 'alice@example.com' }, plan: { id: 'plan_WrmNEgf50wZlr' } } })
    });
    assert.strictEqual(r.status, 200);
    const webhookResult = await r.json();
    assert.strictEqual(webhookResult.plan, 'pro');
    ok('Whop webhook (real nested shape: data.user.email + data.plan.id) updates plan');

    // --- metadata attribution: a purchase with a DIFFERENT Whop email but our
    //     ll_uid stamped on it still lands on the right account ---
    r = await fetch(base + '/api/webhooks/whop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'membership.activated', data: { user: { email: 'someone-else@whop.com' }, plan: { id: 'plan_o0L8rW8pSDIYR' }, metadata: { ll_uid: alice.user.id } } })
    });
    assert.strictEqual(r.status, 200);
    assert.strictEqual((await r.json()).plan, 'premium', 'll_uid metadata attributes to alice despite a mismatched Whop email');
    ok('Whop webhook attributes by ll_uid metadata even when the paying email differs');
    // put alice back on pro for the rest of the test
    await fetch(base + '/api/webhooks/whop', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'membership.activated', data: { user: { email: 'alice@example.com' }, plan: { id: 'plan_WrmNEgf50wZlr' } } }) });

    // --- lifetime seat claim via webhook ---
    r = await fetch(base + '/api/webhooks/whop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'membership.activated', data: { user: { email: 'bob@example.com' }, plan: { id: 'plan_lkIBJQ5RX2xdA' } } })
    });
    assert.strictEqual(r.status, 200);
    const lifetimeResult = await r.json();
    assert.strictEqual(lifetimeResult.plan, 'lifetime');
    assert.strictEqual(lifetimeResult.seat, 1, 'first lifetime purchase gets seat 1');
    ok('Whop webhook grants and seat-numbers a lifetime purchase');

    // --- lifetime idempotency: Whop firing BOTH membership.activated and
    //     payment.succeeded for one purchase must not burn a second seat ---
    r = await fetch(base + '/api/webhooks/whop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'payment.succeeded', data: { user: { email: 'bob@example.com' }, plan: { id: 'plan_lkIBJQ5RX2xdA' } } })
    });
    const dupLifetime = await r.json();
    assert.strictEqual(dupLifetime.seat, 1, 'a duplicate lifetime event keeps the same seat, not a new one');
    ok('lifetime seat claim is idempotent across duplicate Whop events');

    // --- membership.deactivated downgrades to free ---
    r = await fetch(base + '/api/webhooks/whop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'membership.deactivated', data: { user: { email: 'alice@example.com' }, plan: { id: 'plan_WrmNEgf50wZlr' } } })
    });
    const downgraded = await r.json();
    assert.strictEqual(downgraded.plan, 'free');
    ok('membership.deactivated downgrades to free');

    // re-upgrade alice for the rest of the test
    await fetch(base + '/api/webhooks/whop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'membership.activated', data: { user: { email: 'alice@example.com' }, plan: { id: 'plan_WrmNEgf50wZlr' } } })
    });

    // now email-collect should be allowed post-upgrade
    r = await fetch(base + '/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: alice.cookie },
      body: JSON.stringify({ type: 'email', title: 'Join' })
    });
    assert.strictEqual(r.status, 201, 'email-collect allowed after upgrade to pro');
    ok('gating unlocks after plan upgrade');

    // --- new block catalog: metadata round-trips and renders on the public page ---
    r = await fetch(base + '/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: alice.cookie },
      body: JSON.stringify({ type: 'faq', metadata: { items: [{ q: 'Do you ship?', a: 'Yes, worldwide.' }] } })
    });
    assert.strictEqual(r.status, 201);
    const faqBlock = await r.json();
    assert.deepStrictEqual(faqBlock.metadata.items, [{ q: 'Do you ship?', a: 'Yes, worldwide.' }], 'faq metadata round-trips');

    r = await fetch(base + '/alice-smoke');
    html = await r.text();
    assert(html.includes('Do you ship?'), 'faq block renders on the public page');
    ok('new block type (faq) persists metadata and renders publicly');

    r = await fetch(base + '/api/plans');
    const plansResp = await r.json();
    assert.strictEqual(plansResp.plans.pro.checkoutUrl.monthly, 'https://whop.com/checkout/plan_WrmNEgf50wZlr');
    assert.strictEqual(plansResp.plans.lifetime.checkoutUrl, 'https://whop.com/checkout/plan_lkIBJQ5RX2xdA');
    ok('/api/plans exposes real Whop checkout URLs');

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
