async function req(method, url, body) {
  const opts = { method, headers: {}, credentials: 'same-origin' };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { unauthorized: true });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
}

export const api = {
  me: () => req('GET', '/api/me'),
  login: (password) => req('POST', '/api/login', { password }),
  logout: () => req('POST', '/api/logout'),
  meta: () => req('GET', '/api/meta'),
  getSettings: () => req('GET', '/api/settings'),
  saveSettings: (s) => req('PUT', '/api/settings', s),
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
    const r = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Upload failed');
    return j; // { url }
  }
};
