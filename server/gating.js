// Feature gating by plan — single source of truth used by both the API
// (server-side enforcement) and the dashboard/wizard UI (upgrade prompts).
// Retune here; nothing else should hardcode plan comparisons.

const PLAN_ORDER = ['free', 'starter', 'pro', 'premium', 'lifetime'];

const PLANS = {
  free: {
    label: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    themes: ['gradient', 'minimal', 'dark'],
    unlimitedYoutube: false,
    emailCollect: false,
    customStyling: false,
    showBadge: true
  },
  starter: {
    label: 'Starter',
    priceMonthly: 4,
    priceAnnual: 3,
    themes: 'all',
    unlimitedYoutube: true,
    emailCollect: true,
    customStyling: false,
    showBadge: false
  },
  pro: {
    label: 'Pro',
    priceMonthly: 7.5,
    priceAnnual: 6,
    themes: 'all',
    unlimitedYoutube: true,
    emailCollect: true,
    customStyling: true,
    showBadge: false
  },
  premium: {
    label: 'Premium',
    priceMonthly: 17.5,
    priceAnnual: 15,
    themes: 'all',
    unlimitedYoutube: true,
    emailCollect: true,
    customStyling: true,
    showBadge: false,
    futureBlocks: true
  },
  lifetime: {
    label: 'LinkLeaf Founder (Lifetime)',
    priceOneTime: 129,
    seatCap: 100,
    themes: 'all',
    unlimitedYoutube: true,
    emailCollect: true,
    customStyling: true,
    showBadge: false,
    futureBlocks: true
  }
};

const ALL_THEMES = ['gradient', 'glass', 'minimal', 'dark', 'neon', 'paper'];
const FREE_YOUTUBE_CAP = 1;

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
  canUseEmailCollect,
  canUseCustomStyling,
  showBadge
};
