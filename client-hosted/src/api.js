export const BASE = '';

async function req(method, url, body) {
  const opts = { method, headers: {}, credentials: 'same-origin' };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(BASE + url, opts);
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { unauthorized: true });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
}

// Dashboard API — same method names/shapes as the self-host client/src/api.js
// so the copied Tab components work unmodified.
export const api = {
  getSettings: () => req('GET', '/api/settings'),
  saveSettings: (s) => req('PUT', '/api/settings', s),
  meta: () => req('GET', '/api/meta'),
  blocks: () => req('GET', '/api/blocks'),
  createBlock: (b) => req('POST', '/api/blocks', b),
  updateBlock: (id, b) => req('PUT', `/api/blocks/${id}`, b),
  deleteBlock: (id) => req('DELETE', `/api/blocks/${id}`),
  reorder: (ids) => req('PUT', '/api/blocks/reorder', { ids }),
  analytics: () => req('GET', '/api/analytics'),
  subscribers: () => req('GET', '/api/subscribers'),
  deleteSubscriber: (id) => req('DELETE', `/api/subscribers/${id}`),
  upload: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(BASE + '/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Upload failed');
    return j;
  }
};

// Auth + onboarding — used by the hosted-only pages (Login/Signup/Onboarding),
// not by the copied dashboard tabs.
export const authApi = {
  me: () => req('GET', '/api/auth/me'),
  signup: (email, password) => req('POST', '/api/auth/signup', { email, password }),
  login: (email, password) => req('POST', '/api/auth/login', { email, password }),
  logout: () => req('POST', '/api/auth/logout'),
  forgotPassword: (email) => req('POST', '/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => req('POST', '/api/auth/reset-password', { token, password })
};

export const onboardingApi = {
  checkUsername: (u) => req('GET', `/api/onboarding/username-check?u=${encodeURIComponent(u)}`),
  complete: (payload) => req('POST', '/api/onboarding/complete', payload)
};
