import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '../api';
import { Card, Button, ImageUpload } from './ui.jsx';

const THEME_PREVIEWS = {
  gradient: { bg: 'linear-gradient(160deg,#1e1b4b,#4c1d95,#be185d)', fg: '#fff', desc: 'Vivid purple-pink gradient' },
  glass: { bg: 'linear-gradient(135deg,#0f172a,#134e4a)', fg: '#f1f5f9', desc: 'Frosted glassmorphism' },
  minimal: { bg: '#fafafa', fg: '#18181b', desc: 'Clean light, subtle borders' },
  dark: { bg: '#09090b', fg: '#fafafa', desc: 'Sleek near-black' },
  neon: { bg: '#030014', fg: '#a78bfa', desc: 'Glowing cyber accents' },
  paper: { bg: '#f5f0e8', fg: '#292524', desc: 'Neo-brutalist paper & ink' }
};

export default function ThemeTab() {
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
      <Card title="Theme preset">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {meta.themes.map((t) => {
            const p = THEME_PREVIEWS[t] || {};
            const active = s.theme === t;
            return (
              <button
                key={t}
                onClick={() => set('theme', t)}
                className={`rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${active ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-zinc-800 hover:border-zinc-600'}`}
              >
                <div className="h-20 flex flex-col items-center justify-center gap-1.5 px-4" style={{ background: p.bg }}>
                  <div className="w-full h-3 rounded-full opacity-90" style={{ background: p.fg === '#18181b' || p.fg === '#292524' ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.25)' }} />
                  <div className="w-full h-3 rounded-full opacity-90" style={{ background: p.fg === '#18181b' || p.fg === '#292524' ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.25)' }} />
                </div>
                <div className="px-3 py-2 bg-zinc-900">
                  <div className="text-sm font-semibold capitalize flex items-center gap-1.5">
                    {t} {active && <Check size={13} className="text-violet-400" />}
                  </div>
                  <div className="text-[11px] text-zinc-500">{p.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Accent & background">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label>Accent color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={s.accent} onChange={(e) => set('accent', e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
              <input value={s.accent} onChange={(e) => set('accent', e.target.value)} className="font-mono" />
            </div>
          </div>
          <div>
            <label>Background override</label>
            <select value={s.bg_type} onChange={(e) => set('bg_type', e.target.value)}>
              <option value="theme">Use theme background</option>
              <option value="color">Solid color</option>
              <option value="gradient">Custom CSS gradient</option>
              <option value="image">Image</option>
            </select>
          </div>
          {s.bg_type === 'color' && (
            <div>
              <label>Background color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={/^#/.test(s.bg_value) ? s.bg_value : '#09090b'} onChange={(e) => set('bg_value', e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                <input value={s.bg_value} onChange={(e) => set('bg_value', e.target.value)} className="font-mono" placeholder="#09090b" />
              </div>
            </div>
          )}
          {s.bg_type === 'gradient' && (
            <div>
              <label>CSS gradient</label>
              <input value={s.bg_value} onChange={(e) => set('bg_value', e.target.value)} className="font-mono text-xs" placeholder="linear-gradient(160deg, #0ea5e9, #8b5cf6)" />
            </div>
          )}
          {s.bg_type === 'image' && (
            <div>
              <label>Background image</label>
              <ImageUpload value={s.bg_type === 'image' ? s.bg_value : ''} onChange={(url) => set('bg_value', url)} label="Covers the full page" />
            </div>
          )}
        </div>
      </Card>

      <Card title="Font">
        <p className="text-xs text-zinc-500 mb-3 -mt-2">All fonts are self-hosted system stacks — your public page makes zero external font requests.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(meta.fonts).map(([key, label]) => (
            <button
              key={key}
              onClick={() => set('font', key)}
              className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-colors cursor-pointer ${
                s.font === key ? 'border-violet-500 bg-violet-500/10 text-white' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Custom CSS">
        <p className="text-xs text-zinc-500 mb-2 -mt-2">Injected last on the public page. Target classes like <code>.block-link</code>, <code>.bio</code>, <code>.page</code>.</p>
        <textarea
          rows={6}
          value={s.custom_css}
          onChange={(e) => set('custom_css', e.target.value)}
          className="font-mono text-xs"
          placeholder={`.block-link { border-radius: 999px; }`}
        />
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save}>Save theme</Button>
        {saved && (
          <span className="flex items-center gap-1 text-emerald-400 text-sm">
            <Check size={14} /> Saved
          </span>
        )}
        <a href="/" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-white underline underline-offset-4">
          Preview public page →
        </a>
      </div>
    </div>
  );
}
