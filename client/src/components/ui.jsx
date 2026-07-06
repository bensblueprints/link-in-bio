import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { api } from '../api';

export function Card({ title, children, actions }) {
  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5">
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-violet-600 hover:bg-violet-500 text-white',
    ghost: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200',
    danger: 'bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-800'
  };
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ImageUpload({ value, onChange, label = 'Upload image', round = false }) {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function pick(file) {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const { url } = await api.upload(file);
      onChange(url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt="" className={`w-16 h-16 object-cover border border-zinc-700 ${round ? 'rounded-full' : 'rounded-lg'}`} />
            <button
              onClick={() => onChange('')}
              className="absolute -top-2 -right-2 bg-zinc-800 border border-zinc-600 rounded-full p-0.5 hover:bg-red-600 cursor-pointer"
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => ref.current?.click()}
            disabled={busy}
            className={`w-16 h-16 flex items-center justify-center border-2 border-dashed border-zinc-700 hover:border-violet-500 text-zinc-500 hover:text-violet-400 transition-colors cursor-pointer ${round ? 'rounded-full' : 'rounded-lg'}`}
            title={label}
          >
            <Upload size={18} />
          </button>
        )}
        <div className="text-xs text-zinc-500">{busy ? 'Uploading…' : label}</div>
      </div>
      {err && <div className="text-xs text-red-400 mt-1">{err}</div>}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-2 cursor-pointer group" type="button">
      <span className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-violet-600' : 'bg-zinc-700'}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      {label && <span className="text-sm text-zinc-300 group-hover:text-white">{label}</span>}
    </button>
  );
}
