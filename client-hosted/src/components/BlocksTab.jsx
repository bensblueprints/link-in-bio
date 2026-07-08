import React, { useEffect, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import {
  GripVertical, Trash2, Pencil, X, Clock, Plus,
  Link2, Type, Heading, Youtube, Instagram, Music2, AudioLines, Video, MessageSquare, MessageCircle,
  MapPin, HelpCircle, Contact, Calendar, FileText, HeartHandshake, Tag, Ticket, Mail,
  ClipboardList, MessageSquareText, BarChart2, Disc3, Download, GraduationCap, CalendarClock, Tags, ShoppingBag, Lock
} from 'lucide-react';
import { api } from '../api';
import { Card, Button, ImageUpload, Toggle } from './ui.jsx';

const ICONS = {
  Link2, Type, Heading, Youtube, Instagram, Music2, AudioLines, Video, MessageSquare, MessageCircle,
  MapPin, HelpCircle, Contact, Calendar, FileText, HeartHandshake, Tag, Ticket, Mail,
  ClipboardList, MessageSquareText, BarChart2, Disc3, Download, GraduationCap, CalendarClock, Tags, ShoppingBag
};

// Types that just need a plain URL (rendered as a styled link card on the public page).
const LINK_STYLE_TYPES = new Set(['link', 'maps', 'gofundme', 'discord', 'whatsapp', 'tour_events', 'instagram', 'tiktok']);
// Types rendered as an iframe embed.
const EMBED_TYPES = new Set(['vimeo', 'spotify', 'soundcloud', 'calendly', 'typeform']);

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function FaqEditor({ items, onChange }) {
  const list = items.length ? items : [{ q: '', a: '' }];
  function set(i, key, value) {
    const next = list.map((it, idx) => (idx === i ? { ...it, [key]: value } : it));
    onChange(next);
  }
  return (
    <div className="space-y-2">
      {list.map((it, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1.5">
            <input value={it.q} onChange={(e) => set(i, 'q', e.target.value)} placeholder="Question" />
            <input value={it.a} onChange={(e) => set(i, 'a', e.target.value)} placeholder="Answer" />
          </div>
          <button
            onClick={() => onChange(list.filter((_, idx) => idx !== i))}
            className="text-zinc-500 hover:text-red-400 p-1.5 mt-1 cursor-pointer"
            title="Remove"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <Button variant="ghost" onClick={() => onChange([...list, { q: '', a: '' }])}>
        <Plus size={13} /> Add question
      </Button>
    </div>
  );
}

function Editor({ block, onSave, onCancel }) {
  const [b, setB] = useState({ ...block, metadata: block.metadata || {} });
  const set = (k, v) => setB((prev) => ({ ...prev, [k]: v }));
  const setMeta = (k, v) => setB((prev) => ({ ...prev, metadata: { ...prev.metadata, [k]: v } }));
  const isLive = (() => {
    const now = new Date();
    if (b.start_at && new Date(b.start_at) > now) return false;
    if (b.end_at && new Date(b.end_at) < now) return false;
    return true;
  })();

  const isLinkStyle = LINK_STYLE_TYPES.has(b.type);
  const isEmbed = EMBED_TYPES.has(b.type);

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
      {b.type !== 'faq' && b.type !== 'contact' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={b.type === 'header' || b.type === 'text' ? 'sm:col-span-2' : ''}>
            <label>{b.type === 'discount' ? 'Discount code' : 'Title'}</label>
            <input value={b.title} onChange={(e) => set('title', e.target.value)} placeholder={b.type === 'email' ? 'Join my mailing list' : 'Title'} />
          </div>
          {(isLinkStyle || b.type === 'youtube' || isEmbed) && (
            <div>
              <label>URL</label>
              <input value={b.url} onChange={(e) => set('url', e.target.value)} placeholder="https://…" />
            </div>
          )}
        </div>
      )}

      {b.type === 'text' && (
        <div>
          <label>Body</label>
          <textarea rows={4} value={b.metadata.body || ''} onChange={(e) => setMeta('body', e.target.value)} placeholder="Write anything…" />
        </div>
      )}

      {b.type === 'faq' && (
        <div>
          <label>Questions</label>
          <FaqEditor items={Array.isArray(b.metadata.items) ? b.metadata.items : []} onChange={(items) => setMeta('items', items)} />
        </div>
      )}

      {b.type === 'contact' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label>Name</label><input value={b.metadata.name || ''} onChange={(e) => setMeta('name', e.target.value)} placeholder="Your Name" /></div>
          <div><label>Company (optional)</label><input value={b.metadata.company || ''} onChange={(e) => setMeta('company', e.target.value)} /></div>
          <div><label>Phone</label><input value={b.metadata.phone || ''} onChange={(e) => setMeta('phone', e.target.value)} placeholder="+1 555…" /></div>
          <div><label>Email</label><input value={b.metadata.email || ''} onChange={(e) => setMeta('email', e.target.value)} placeholder="you@email.com" /></div>
        </div>
      )}

      {b.type === 'discount' && (
        <div>
          <label>Description (optional)</label>
          <input value={b.metadata.description || ''} onChange={(e) => setMeta('description', e.target.value)} placeholder="20% off your first order" />
        </div>
      )}

      {b.type === 'link' && (
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label>Thumbnail (optional)</label>
            <ImageUpload value={b.thumbnail} onChange={(url) => set('thumbnail', url)} label="Small square image" />
          </div>
          <Toggle checked={!!b.animate} onChange={(v) => set('animate', v)} label="Animate on hover" />
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

function BlockRow({ block, typeMeta, onChange, onDelete }) {
  const controls = useDragControls();
  const [editing, setEditing] = useState(block._new || false);
  const meta = typeMeta[block.type] || typeMeta.link;
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
          <Icon size={16} className="text-orange-400" />
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

function AddBlockSheet({ categories, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl bg-zinc-950 border border-zinc-800 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-zinc-950 border-b border-zinc-800">
          <h2 className="font-bold text-lg">Add a block</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 cursor-pointer"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-6">
          {categories.map((cat) => (
            <div key={cat.key}>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">{cat.label}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cat.blocks.map((blk) => {
                  const Icon = ICONS[blk.icon] || Link2;
                  return (
                    <button
                      key={blk.type}
                      disabled={!blk.implemented}
                      onClick={() => blk.implemented && onPick(blk.type)}
                      className={`flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-colors ${
                        blk.implemented
                          ? 'border-zinc-800 hover:border-orange-500 bg-zinc-900 cursor-pointer'
                          : 'border-zinc-900 bg-zinc-900/40 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      <Icon size={18} className={blk.implemented ? 'text-orange-400' : 'text-zinc-600'} />
                      <span className="text-xs font-semibold flex items-center gap-1">
                        {blk.label}
                        {!blk.implemented && <Lock size={10} />}
                      </span>
                      {!blk.implemented && <span className="text-[10px] text-zinc-600">Coming soon</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BlocksTab() {
  const [blocks, setBlocks] = useState(null);
  const [categories, setCategories] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    api.blocks().then(setBlocks);
    api.meta().then((m) => setCategories(m.blockCategories || []));
  }, []);

  if (!blocks) return <p className="text-zinc-500">Loading…</p>;

  const typeMeta = Object.fromEntries(
    categories.flatMap((c) => c.blocks).map((b) => [b.type, { label: b.label, icon: ICONS[b.icon] || Link2 }])
  );
  if (!typeMeta.link) typeMeta.link = { label: 'Link', icon: Link2 };

  async function add(type) {
    setPickerOpen(false);
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
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white cursor-pointer"
            style={{ background: 'var(--ll-orange)' }}
          >
            <Plus size={13} /> Add a block
          </button>
        }
      >
        {blocks.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center">No blocks yet — add your first one above.</p>
        ) : (
          <Reorder.Group axis="y" values={blocks} onReorder={reordered} className="space-y-2">
            {blocks.map((b) => (
              <BlockRow key={b.id} block={b} typeMeta={typeMeta} onChange={change} onDelete={remove} />
            ))}
          </Reorder.Group>
        )}
      </Card>
      <p className="text-xs text-zinc-600">Drag the grip to reorder. Order saves automatically. Scheduled blocks only appear between their start/end dates.</p>
      {pickerOpen && <AddBlockSheet categories={categories} onPick={add} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
