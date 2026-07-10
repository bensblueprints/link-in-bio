// Feature gating by plan — single source of truth used by both the API
// (server-side enforcement) and the dashboard/wizard UI (upgrade prompts).
// Retune here; nothing else should hardcode plan comparisons.

const PLAN_ORDER = ['free', 'starter', 'pro', 'premium', 'lifetime'];

// Whop product: prod_fXs0WCs4Pezgr ("Link Leaf"), biz_Ro2hWjwgeK5rm8. Plan IDs
// confirmed live against the Whop API 2026-07-08 — checkoutUrl is each plan's
// real https://whop.com/checkout/<plan_id> direct link.
const PLANS = {
  free: {
    label: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    themes: ['gradient', 'minimal', 'dark'],
    unlimitedYoutube: false,
    unlimitedImages: false,
    emailCollect: false,
    customStyling: false,
    showBadge: true,
    whopPlanId: 'plan_8WtlHkDEIlvTA'
  },
  starter: {
    label: 'Starter',
    priceMonthly: 4,
    priceAnnual: 3.2,
    themes: 'all',
    unlimitedYoutube: true,
    unlimitedImages: true,
    emailCollect: true,
    customStyling: false,
    showBadge: false,
    whopPlanId: { monthly: 'plan_hjnTnQr3x4sYI', annual: 'plan_X6SWLvWnSl9bE' }
  },
  pro: {
    label: 'Pro',
    priceMonthly: 7.5,
    priceAnnual: 6,
    themes: 'all',
    unlimitedYoutube: true,
    unlimitedImages: true,
    emailCollect: true,
    customStyling: true,
    showBadge: false,
    whopPlanId: { monthly: 'plan_WrmNEgf50wZlr', annual: 'plan_VtvVrfyJpDAgF' }
  },
  premium: {
    label: 'Premium',
    priceMonthly: 17.5,
    priceAnnual: 14,
    themes: 'all',
    unlimitedYoutube: true,
    unlimitedImages: true,
    emailCollect: true,
    customStyling: true,
    showBadge: false,
    futureBlocks: true,
    whopPlanId: { monthly: 'plan_o0L8rW8pSDIYR', annual: 'plan_kdrhFN4jFSPH7' }
  },
  lifetime: {
    label: 'LinkLeaf Founder (Lifetime)',
    priceOneTime: 129,
    seatCap: 100,
    themes: 'all',
    unlimitedYoutube: true,
    unlimitedImages: true,
    emailCollect: true,
    customStyling: true,
    showBadge: false,
    futureBlocks: true,
    whopPlanId: 'plan_lkIBJQ5RX2xdA'
  }
};

// Reverse lookup used by the webhook handler: Whop plan_id -> { plan, billing }.
const WHOP_PLAN_ID_TO_PLAN = {};
for (const [key, cfg] of Object.entries(PLANS)) {
  if (typeof cfg.whopPlanId === 'string') {
    WHOP_PLAN_ID_TO_PLAN[cfg.whopPlanId] = { plan: key, billing: null };
  } else if (cfg.whopPlanId) {
    for (const [billing, id] of Object.entries(cfg.whopPlanId)) {
      WHOP_PLAN_ID_TO_PLAN[id] = { plan: key, billing };
    }
  }
}

function checkoutUrl(plan, billing) {
  const cfg = PLANS[plan];
  if (!cfg || !cfg.whopPlanId) return null;
  const id = typeof cfg.whopPlanId === 'string' ? cfg.whopPlanId : cfg.whopPlanId[billing || 'monthly'];
  return id ? `https://whop.com/checkout/${id}` : null;
}

function planForWhopPlanId(whopPlanId) {
  return WHOP_PLAN_ID_TO_PLAN[whopPlanId] || null;
}

const ALL_THEMES = ['gradient', 'glass', 'minimal', 'dark', 'neon', 'paper'];
const FREE_YOUTUBE_CAP = 1;
// Ben's ask: free plan gets exactly one image/thumbnail across ALL blocks
// combined (e.g. a WhatsApp QR code, or a thumbnail on a single link block —
// they share the same quota, not one-each-per-type); paid plans (anything
// with unlimitedImages: true) get unlimited thumbnails everywhere.
const FREE_IMAGE_CAP = 1;

function planConfig(plan) {
  return PLANS[plan] || PLANS.free;
}

function allowedThemes(plan) {
  const cfg = planConfig(plan);
  return cfg.themes === 'all' ? ALL_THEMES : cfg.themes;
}

function canUseTheme(plan, theme) {
  return allowedThemes(plan).includes(theme);
}

function canAddYoutubeBlock(plan, currentYoutubeCount) {
  const cfg = planConfig(plan);
  if (cfg.unlimitedYoutube) return true;
  return currentYoutubeCount < FREE_YOUTUBE_CAP;
}

// currentThumbnailCount = count of ALL blocks on the page with a non-empty
// `thumbnail`, regardless of block type (the dedicated `image` block type is
// just one of many types that can carry a thumbnail now). Free plan gets
// FREE_IMAGE_CAP total across every type combined; paid plans are unlimited.
function canAddThumbnail(plan, currentThumbnailCount) {
  const cfg = planConfig(plan);
  if (cfg.unlimitedImages) return true;
  return currentThumbnailCount < FREE_IMAGE_CAP;
}

// Back-compat alias — same quota logic, kept for any older call sites.
const canAddImageBlock = canAddThumbnail;

function canUseEmailCollect(plan) {
  return planConfig(plan).emailCollect;
}

function canUseCustomStyling(plan) {
  return planConfig(plan).customStyling;
}

function showBadge(plan) {
  return planConfig(plan).showBadge;
}

module.exports = {
  PLAN_ORDER,
  PLANS,
  ALL_THEMES,
  planConfig,
  allowedThemes,
  canUseTheme,
  canAddYoutubeBlock,
  canAddImageBlock,
  canAddThumbnail,
  canUseEmailCollect,
  canUseCustomStyling,
  showBadge,
  checkoutUrl,
  planForWhopPlanId
};
