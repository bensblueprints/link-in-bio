// Whop webhook helpers: signature verification (Standard Webhooks spec) and
// defensive payload parsing. Product: prod_fXs0WCs4Pezgr ("Link Leaf").
//
// Signature: three headers — webhook-id, webhook-timestamp, webhook-signature.
// signed_content = "{id}.{timestamp}.{raw body}"; HMAC-SHA256 compared against
// webhook-signature's value(s). WHOP_WEBHOOK_SECRET (from the Whop dashboard's
// Developer tab, not retrievable via the API) arrived as `ws_<64 hex chars>` —
// Whop's docs say the key must be "base64-encoded" but a 64-char hex string is
// a raw 32-byte key, not base64, so which decoding Whop's server actually used
// to sign is unconfirmed without a live delivery to check against. Every
// plausible key derivation is tried; a real Whop event will match exactly one.
const crypto = require('crypto');

function candidateKeys(secret) {
  const stripped = secret.replace(/^whsec_|^ws_/, '');
  const keys = [];
  if (/^[0-9a-fA-F]+$/.test(stripped) && stripped.length % 2 === 0) keys.push(Buffer.from(stripped, 'hex'));
  try {
    keys.push(Buffer.from(stripped, 'base64'));
  } catch {}
  keys.push(Buffer.from(secret, 'utf8'));
  return keys;
}

function verifyWhopSignature(req, secret) {
  if (!secret) return false;
  const id = req.get('webhook-id');
  const timestamp = req.get('webhook-timestamp');
  const signatureHeader = req.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader || !req.rawBody) return false;

  const signedContent = `${id}.${timestamp}.${req.rawBody.toString('utf8')}`;
  const expectedDigests = candidateKeys(secret).map((key) =>
    crypto.createHmac('sha256', key).update(signedContent).digest('base64')
  );

  // webhook-signature can carry multiple space-separated "v1,<sig>" values
  const candidates = signatureHeader.split(' ').map((part) => part.split(',')[1]).filter(Boolean);
  return candidates.some((sig) =>
    expectedDigests.some((expected) => {
      try {
        return crypto.timingSafeEqual(Buffer.from(sig, 'base64'), Buffer.from(expected, 'base64'));
      } catch {
        return false;
      }
    })
  );
}

// Whop's delivered payload shape isn't fully confirmed against a live event
// yet (docs didn't expose a full example at build time) — parse defensively
// across the field-name variants Whop's API is known to use elsewhere.
function parseWhopEvent(body) {
  const action = body.action || body.type || body.event || null;
  const data = body.data || body.object || body;
  const email = data.email || data.user?.email || data.member?.email || data.metadata?.email || null;
  const planId = data.plan_id || data.plan?.id || data.plan || null;
  const membershipId = data.id || data.membership_id || null;
  return { action, email, planId, membershipId, raw: body };
}

module.exports = { verifyWhopSignature, parseWhopEvent };
