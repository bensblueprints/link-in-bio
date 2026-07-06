import React, { useEffect, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Plus, Trash2, Link as LinkIcon, Heading, Youtube, Mail, Pencil, X, Clock } from 'lucide-react';
import { api } from '../api';
import { Card, Button, ImageUpload, Toggle } from './ui.jsx';

const TYPE_META = {
  link: { label: 'Link', icon: LinkIcon, color: 'text-violet-400' },
  header: { label: 'Header', icon: Heading, color: 'text-sky-400' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'text-red-400' },
  email: { label: 'Email collect', icon: Mail, color: 'text-emerald-400' }
};

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function Editor({ block, onSave, onCancel }) {
  const [b, setB] = useState({ ...block });
  const set = (k, v) => setB((prev) => ({ ...prev, [k]: v }));
  const isLive = (() => {
    const now = new Date();
    if (b.start_at && new Date(b.start_at) > now) return false;
    if (b.end_at && new Date(b.end_at) < now) return false;
    return true;
  })();

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={b.type === 'header' ? 'sm:col-span-2' : ''}>
          <label>Title</label>
          <input value={b.title} onChange={(e) => set('title', e.target.value)} placeholder={b.type === 'email' ? 'Join my mailing list' : 'My latest video'} />
        </div>
        {(b.type === 'link' || b.type === 'youtube') && (
          <div>
            <label>{b.type === 'youtube' ? 'YouTube URL' : 'URL'}</label>
            <input value={b.url} onChange={(e) => set('url', e.target.value)} placeholder={b.type === 'youtube' ? 'https://youtube.com/watch?v=…' : 'https://…'} />
          </div>
        )}
      </div>

      {b.type === 'link' && (
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label>Thumbnail (optional)</label>
            <ImageUpload value={b.thumbnail} onChange={(url) => set('thumbnail', url)} label="Small square image" />
          </div>
          <Toggle checked={!!b.animate} onChange={(v) => set('animate', v ? 1 : 0)} label="Animate on hover" />
        </div>
      )}

      <div>
        <label className="flex items-center gap-1.5"><Clock size={12} /> Schedule (optional)</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="text-xs text-zinc-500">Show from</span>
            <input type="datetime-local" value={toLocalInput(b.start_at)} onChange={(e) => set('start_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </div>
          <div>
            <span className="text-xs text-zinc-500">Hide after</span>
            <input type="datetime-local" value={toLocalInput(b.end_at)} onChange={(e) => set('end_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </div>
        </div>
        {!isLive && <p className="text-xs text-amber-400 mt-1.5">This block is currently hidden by its schedule.</p>}
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onSave(b)}>Save block</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function BlockRow({ block, onChange, onDelete }) {
  const controls = useDragControls();
  const [editing, setEditing] = useState(block._new || false);
  const meta = TYPE_META[block.type] || TYPE_META.link;
  const Icon = meta.icon;
  const hidden = (block.start_at && new Date(block.start_at) > new Date()) || (block.end_at && new Date(block.end_at) < new Date());

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      className="bg-zinc-900/70 border border-zinc-800 rounded-xl px-3 py-3 select-none"
    >
      <div className="flex items-center gap-3">
        <button
          onPointerDown={(e) => controls.start(e)}
          className="text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
        >
          <GripVertical size={18} />
        </button>
        {block.thumbnail ? (
          <img src={block.thumbnail} alt="" className="w-8 h-8 rounded-md object-cover" />
        ) : (
          <Icon size={16} className={meta.color} />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {block.title || <span className="text-zinc-500 italic">Untitled</span>}
            {hidden && <span className="ml-2 text-[10px] font-bold uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Scheduled</span>}
          </div>
          {block.url && <div className="text-xs text-zinc-500 truncate">{block.url}</div>}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 hidden sm:block">{meta.label}</span>
        <button onClick={() => setEditing((v) => !v)} className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer" title="Edit">
          {editing ? <X size={15} /> : <Pencil size={15} />}
        </button>
        <button onClick={() => onDelete(block.id)} className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer" title="Delete">
          <Trash2 size={15} />
        </button>
      </div>
      {editing && (
        <Editor
          block={block}
          onCancel={() => setEditing(false)}
          onSave={async (b) => {
            await onChange(b);
            setEditing(false);
          }}
        />
      )}
    </Reorder.Item>
  );
}

export default function BlocksTab() {
  const [blocks, setBlocks] = useState(null);

  useEffect(() => {
    api.blocks().then(setBlocks);
  }, []);

  if (!blocks) return <p className="text-zinc-500">Loading…</p>;

  async function add(type) {
    const created = await api.createBlock({ type, title: type === 'email' ? 'Join my mailing list' : '' });
    created._new = true;
    setBlocks((prev) => [...prev, created]);
  }

  async function change(b) {
    const updated = await api.updateBlock(b.id, b);
    setBlocks((prev) => prev.map((x) => (x.id === b.id ? updated : x)));
  }

  async function remove(id) {
    await api.deleteBlock(id);
    setBlocks((prev) => prev.filter((x) => x.id !== id));
  }

  async function reordered(next) {
    setBlocks(next);
    await api.reorder(next.map((b) => b.id));
  }

  return (
    <div className="space-y-4">
      <Card
        title="Blocks"
        actions={
          <div className="flex gap-2 flex-wrap">
            {Object.entries(TYPE_META).map(([type, m]) => (
              <button
                key={type}
                onClick={() => add(type)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Plus size={13} /> {m.label}
              </button>
            ))}
          </div>
        }
      >
        {blocks.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center">No blocks yet — add your first link above.</p>
        ) : (
          <Reorder.Group axis="y" values={blocks} onReorder={reordered} className="space-y-2">
            {blocks.map((b) => (
              <BlockRow key={b.id} block={b} onChange={change} onDelete={remove} />
            ))}
          </Reorder.Group>
        )}
      </Card>
      <p className="text-xs text-zinc-600">Drag the grip to reorder. Order saves automatically. Scheduled blocks only appear between their start/end dates.</p>
    </div>
  );
}
