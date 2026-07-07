import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '../api';
import { Card, Button, ImageUpload } from './ui.jsx';

export default function ProfileTab() {
  const [s, setS] = useState(null);
  const [meta, setMeta] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api.getSettings(), api.meta()]).then(([settings, m]) => {
      setS(settings);
      setMeta(m);
    });
  }, []);

  if (!s || !meta) return <p className="text-zinc-500">Loading…</p>;

  const socials = (() => {
    try { return JSON.parse(s.socials || '{}'); } catch { return {}; }
  })();

  function set(k, v) {
    setS((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  }

  async function save() {
    await api.saveSettings(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <Card title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label>Avatar</label>
            <ImageUpload round value={s.avatar} onChange={(url) => set('avatar', url)} label="PNG / JPG, shown at the top of your page" />
          </div>
          <div>
            <label>Display name</label>
            <input value={s.display_name} onChange={(e) => set('display_name', e.target.value)} placeholder="Your Name" />
          </div>
          <div>
            <label>SEO title (optional)</label>
            <input value={s.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder="Your Name — Links" />
          </div>
          <div className="sm:col-span-2">
            <label>Bio</label>
            <textarea rows={2} value={s.bio} onChange={(e) => set('bio', e.target.value)} placeholder="One or two lines about you" />
          </div>
          <div className="sm:col-span-2">
            <label>SEO / OG description (optional)</label>
            <input value={s.seo_description} onChange={(e) => set('seo_description', e.target.value)} placeholder="Shown in search results & link previews" />
          </div>
        </div>
      </Card>

      <Card title="Social icons">
        <p className="text-xs text-zinc-500 mb-4 -mt-2">Paste full profile URLs. Filled networks appear as an icon row under your bio.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(meta.socials).map(([key, label]) => (
            <div key={key}>
              <label>{label}</label>
              <input
                value={socials[key] || ''}
                onChange={(e) => set('socials', JSON.stringify({ ...socials, [key]: e.target.value }))}
                placeholder={`https://…`}
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save}>Save profile</Button>
        {saved && (
          <span className="flex items-center gap-1 text-emerald-400 text-sm">
            <Check size={14} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
