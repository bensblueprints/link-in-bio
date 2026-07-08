// Whop webhook helpers: signature verification (Standard Webhooks spec) and
// defensive payload parsing. Product: prod_fXs0WCs4Pezgr ("Link Leaf").
//
// Signature: three headers — webhook-id, webhook-timestamp, webhook-signature.
// signed_content = "{id}.{timestamp}.{raw body}"; HMAC-SHA256 with the base64
// webhook secret (from the Whop dashboard's Developer tab — not retrievable
// via the API, must be set as WHOP_WEBHOOK_SECRET).
const crypto = require('crypto');

function verifyWhopSignature(req, secret) {
  if (!secret) return false;
  const id = req.get('webhook-id');
  const timestamp = req.get('webhook-timestamp');
  const signatureHeader = req.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader || !req.rawBody) return false;

  const signedContent = `${id}.${timestamp}.${req.rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', Buffer.from(secret, 'base64')).update(signedContent).digest('base64');

  // webhook-signature can carry multiple space-separated "v1,<sig>" values
  const candidates = signatureHeader.split(' ').map((part) => part.split(',')[1]).filter(Boolean);
  return candidates.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig, 'base64'), Buffer.from(expected, 'base64'));
    } catch {
      return false;
    }
  });
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
