// Server-rendered public page: fast, mobile-first, zero external requests
// (fonts are system stacks; only embeds the user explicitly adds, e.g. YouTube, load remotely).

const FONTS = {
  system: { label: 'Clean Sans (system)', stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` },
  humanist: { label: 'Humanist', stack: `Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif` },
  geometric: { label: 'Geometric', stack: `Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif` },
  rounded: { label: 'Rounded', stack: `ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, Manjari, 'Arial Rounded MT', Calibri, source-sans-pro, sans-serif` },
  classic: { label: 'Classic Serif', stack: `'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif` },
  editorial: { label: 'Editorial Serif', stack: `Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif` },
  slab: { label: 'Slab', stack: `Rockwell, 'Rockwell Nova', 'Roboto Slab', 'DejaVu Serif', 'Sitka Small', serif` },
  mono: { label: 'Mono', stack: `ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace` }
};

const THEMES = ['gradient', 'glass', 'minimal', 'dark', 'neon', 'paper'];

// 12 common networks with inline SVG icons (24x24, stroke or fill)
const SOCIALS = {
  instagram: { label: 'Instagram', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>` },
  x: { label: 'X / Twitter', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 4l16 16M20 4L4 20"/></svg>` },
  tiktok: { label: 'TikTok', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4c.5 2.5 2.5 4.5 5 5"/></svg>` },
  youtube: { label: 'YouTube', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>` },
  facebook: { label: 'Facebook', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>` },
  whatsapp: { label: 'WhatsApp', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>` },
  linkedin: { label: 'LinkedIn', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V9h4v1.5"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>` },
  github: { label: 'GitHub', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>` },
  twitch: { label: 'Twitch', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2H3v16h5v4l4-4h5l4-4V2zM11 11V7M16 11V7"/></svg>` },
  spotify: { label: 'Spotify', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M7 9.5c3.5-1 7-.7 10 1M7.5 12.5c3-.8 5.8-.5 8.3 1M8 15.4c2.4-.6 4.6-.4 6.6.8"/></svg>` },
  pinterest: { label: 'Pinterest', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 21l3.5-9M10.5 8.5A2.9 2.9 0 0 1 15 8c1.5 1.5 1 4-.5 5.5S11 15 10 13.5"/></svg>` },
  threads: { label: 'Threads', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>` },
  website: { label: 'Website', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>` }
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function youtubeId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function vimeoId(url) {
  const m = String(url || '').match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

// Spotify's oEmbed-free embed pattern: swap /track|album|playlist|artist/ID
// straight into open.spotify.com/embed/... — no API key needed.
function spotifyEmbedUrl(url) {
  const m = String(url || '').match(/open\.spotify\.com\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
}

// SoundCloud's public player iframe accepts any track/set URL via ?url=
function soundcloudEmbedUrl(url) {
  if (!/soundcloud\.com\//.test(String(url || ''))) return null;
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff6600&auto_play=false&show_comments=false`;
}

const ICON_LINK_LABELS = {
  gofundme: '💚 GoFundMe',
  discord: 'Join our Discord',
  whatsapp: 'Chat on WhatsApp',
  tour_events: '🎟️ Tour Dates',
  maps: '📍 Get Directions'
};

// Block types rendered as plain clickable-card link redirects (vs. embeds,
// forms, etc). Shared with app-multi.js so the /r/:id redirect handler
// allows exactly the same set of types this renderer treats as link cards.
const LINK_STYLE_TYPES = new Set(['link', 'maps', 'gofundme', 'discord', 'whatsapp', 'tour_events', 'instagram', 'tiktok']);

const THEME_CSS = `
:root { --accent: #8b5cf6; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: var(--font-stack); min-height:100vh; -webkit-font-smoothing:antialiased; }
.page { max-width:640px; margin:0 auto; padding:48px 20px 64px; display:flex; flex-direction:column; align-items:center; }
.avatar { width:96px; height:96px; border-radius:50%; object-fit:cover; border:3px solid var(--accent); box-shadow:0 4px 24px rgba(0,0,0,.25); }
.avatar-fallback { width:96px; height:96px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:700; background:var(--accent); color:#fff; }
h1 { margin-top:16px; font-size:1.45rem; letter-spacing:-.01em; }
.bio { margin-top:8px; font-size:.98rem; opacity:.8; text-align:center; max-width:440px; line-height:1.5; }
.socials { display:flex; flex-wrap:wrap; justify-content:center; gap:14px; margin-top:18px; }
.socials a { width:38px; height:38px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:transform .15s ease, background .15s ease; }
.socials a:hover { transform:translateY(-3px); }
.socials svg { width:21px; height:21px; }
.blocks { width:100%; margin-top:28px; display:flex; flex-direction:column; gap:14px; }
.block-link { display:flex; align-items:center; gap:14px; padding:15px 18px; border-radius:14px; text-decoration:none; font-weight:600; font-size:1rem; transition:transform .18s ease, box-shadow .18s ease, background .18s ease; }
.block-link .thumb { width:44px; height:44px; border-radius:10px; object-fit:cover; flex-shrink:0; }
.block-link span { flex:1; text-align:center; }
.block-link .thumb + span { margin-right:44px; } /* keep title optically centered */
.block-link.animate:hover { transform:scale(1.03) translateY(-2px); }
.block-link:hover { transform:translateY(-2px); }

/* Grid layout — link cards become 2-up tiles that lead with their thumbnail.
   Non-link blocks (embeds, forms, FAQs, etc.) always span the full width. */
.blocks-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
.blocks-grid > :not(.block-link) { grid-column:1 / -1; }
.blocks-grid .block-link { flex-direction:column; align-items:stretch; gap:10px; padding:12px; text-align:center; }
.blocks-grid .block-link .thumb { width:100%; height:auto; aspect-ratio:1 / 1; border-radius:10px; }
.blocks-grid .block-link span { flex:none; margin-right:0 !important; }
.blocks-grid .block-link .thumb + span { margin-right:0; }
.block-header { margin-top:10px; text-align:center; font-size:.85rem; font-weight:700; text-transform:uppercase; letter-spacing:.14em; opacity:.65; }
.block-header::after { content:''; display:block; margin:10px auto 0; width:48px; height:2px; background:var(--accent); border-radius:2px; opacity:.7; }
.block-video { border-radius:14px; overflow:hidden; aspect-ratio:16/9; box-shadow:0 8px 32px rgba(0,0,0,.25); }
.block-video iframe { width:100%; height:100%; border:0; display:block; }
.block-email { padding:20px 18px; border-radius:14px; text-align:center; }
.block-email h3 { font-size:1rem; margin-bottom:12px; }
.block-email form { display:flex; gap:8px; }
.block-email input { flex:1; min-width:0; padding:11px 14px; border-radius:10px; border:1px solid rgba(128,128,128,.35); background:rgba(255,255,255,.08); color:inherit; font:inherit; font-size:.95rem; }
.block-email input::placeholder { opacity:.6; color:inherit; }
.block-email button { padding:11px 18px; border-radius:10px; border:0; background:var(--accent); color:#fff; font:inherit; font-weight:700; cursor:pointer; transition:filter .15s; }
.block-email button:hover { filter:brightness(1.12); }
.block-email .msg { margin-top:10px; font-size:.85rem; min-height:1em; opacity:.85; }
.block-text { padding:16px 18px; border-radius:14px; font-size:.95rem; line-height:1.6; }
.block-embed { border-radius:14px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,.25); }
.block-embed iframe { width:100%; border:0; display:block; }
.block-embed.ratio-16-9 { aspect-ratio:16/9; }
.block-embed.ratio-tall { height:400px; }
.block-embed.ratio-short { height:166px; }
.block-faq { padding:6px 0; }
.block-faq details { padding:14px 18px; border-radius:14px; margin-bottom:10px; }
.block-faq summary { font-weight:600; cursor:pointer; list-style:none; }
.block-faq summary::-webkit-details-marker { display:none; }
.block-faq summary::after { content:'+'; float:right; opacity:.6; }
.block-faq details[open] summary::after { content:'–'; }
.block-faq p { margin-top:10px; font-size:.9rem; opacity:.85; line-height:1.5; }
.block-contact { padding:16px 18px; border-radius:14px; text-align:center; }
.block-contact h3 { font-size:1rem; margin-bottom:6px; }
.block-contact a { display:block; font-size:.9rem; opacity:.85; text-decoration:none; margin-top:4px; }
.block-discount { padding:16px 18px; border-radius:14px; text-align:center; }
.block-discount .code { font-family:ui-monospace,monospace; font-size:1.1rem; font-weight:700; letter-spacing:.05em; padding:8px 14px; border-radius:8px; background:rgba(0,0,0,.15); display:inline-block; margin-top:6px; }
.block-image { border-radius:14px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,.25); text-align:center; }
.block-image img { width:100%; height:auto; display:block; }
.block-image-caption { padding:10px 14px 0; font-size:.85rem; font-weight:600; opacity:.85; }
.footer { margin-top:48px; font-size:.75rem; opacity:.45; text-decoration:none; color:inherit; }

/* ---------- Themes ---------- */
.theme-gradient { background:linear-gradient(160deg,#1e1b4b 0%,#4c1d95 45%,#be185d 100%); color:#fff; }
.theme-gradient .block-link, .theme-gradient .block-email, .theme-gradient .block-text, .theme-gradient .block-faq details, .theme-gradient .block-contact, .theme-gradient .block-discount { background:rgba(255,255,255,.14); color:#fff; backdrop-filter:blur(8px); }
.theme-gradient .block-link:hover { background:rgba(255,255,255,.22); }
.theme-gradient .socials a { background:rgba(255,255,255,.14); color:#fff; }

.theme-glass { background:linear-gradient(135deg,#0f172a,#134e4a 60%,#0f172a); color:#f1f5f9; }
.theme-glass .block-link, .theme-glass .block-email, .theme-glass .block-text, .theme-glass .block-faq details, .theme-glass .block-contact, .theme-glass .block-discount { background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.18); color:#f1f5f9; backdrop-filter:blur(14px); box-shadow:0 8px 32px rgba(0,0,0,.3); }
.theme-glass .block-link:hover { background:rgba(255,255,255,.13); }
.theme-glass .socials a { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); color:#f1f5f9; }

.theme-minimal { background:#fafafa; color:#18181b; }
.theme-minimal .block-link, .theme-minimal .block-email, .theme-minimal .block-text, .theme-minimal .block-faq details, .theme-minimal .block-contact, .theme-minimal .block-discount { background:#fff; border:1px solid #e4e4e7; color:#18181b; box-shadow:0 1px 3px rgba(0,0,0,.06); }
.theme-minimal .block-link:hover { border-color:var(--accent); box-shadow:0 4px 14px rgba(0,0,0,.08); }
.theme-minimal .socials a { background:#fff; border:1px solid #e4e4e7; color:#3f3f46; }
.theme-minimal .block-email input { background:#fafafa; border-color:#d4d4d8; }

.theme-dark { background:#09090b; color:#fafafa; }
.theme-dark .block-link, .theme-dark .block-email, .theme-dark .block-text, .theme-dark .block-faq details, .theme-dark .block-contact, .theme-dark .block-discount { background:#18181b; border:1px solid #27272a; color:#fafafa; }
.theme-dark .block-link:hover { border-color:var(--accent); background:#1f1f23; }
.theme-dark .socials a { background:#18181b; border:1px solid #27272a; color:#d4d4d8; }

.theme-neon { background:#030014; color:#e0e7ff;}
.theme-neon .avatar, .theme-neon .avatar-fallback { box-shadow:0 0 24px var(--accent); }
.theme-neon .block-link, .theme-neon .block-email, .theme-neon .block-text, .theme-neon .block-faq details, .theme-neon .block-contact, .theme-neon .block-discount { background:rgba(139,92,246,.06); border:1px solid var(--accent); color:#e0e7ff; box-shadow:0 0 12px color-mix(in srgb, var(--accent) 35%, transparent), inset 0 0 12px color-mix(in srgb, var(--accent) 12%, transparent); }
.theme-neon .block-link:hover { box-shadow:0 0 26px color-mix(in srgb, var(--accent) 60%, transparent); }
.theme-neon .socials a { border:1px solid var(--accent); color:#e0e7ff; box-shadow:0 0 8px color-mix(in srgb, var(--accent) 30%, transparent); }
.theme-neon h1 { text-shadow:0 0 18px color-mix(in srgb, var(--accent) 70%, transparent); }

.theme-paper { background:#f5f0e8; color:#292524; }
.theme-paper .block-link, .theme-paper .block-email, .theme-paper .block-text, .theme-paper .block-faq details, .theme-paper .block-contact, .theme-paper .block-discount { background:#fffdf8; border:1.5px solid #292524; color:#292524; box-shadow:3px 3px 0 #292524; }
.theme-paper .block-link:hover { transform:translate(-1px,-1px); box-shadow:5px 5px 0 #292524; }
.theme-paper .socials a { background:#fffdf8; border:1.5px solid #292524; color:#292524; box-shadow:2px 2px 0 #292524; }
.theme-paper .block-email input { background:#fff; border:1.5px solid #292524; }
.theme-paper .block-email button { border:1.5px solid #292524; box-shadow:2px 2px 0 #292524; }

@media (max-width:480px){ .page{ padding:36px 14px 56px; } h1{ font-size:1.3rem; } }
`;

function isBlockLive(b, now = new Date()) {
  if (b.start_at && new Date(b.start_at) > now) return false;
  if (b.end_at && new Date(b.end_at) < now) return false;
  return true;
}

function renderBlock(b, basePath) {
  const meta = b.metadata || {};

  if (b.type === 'header') {
    return `<div class="block-header">${esc(b.title)}</div>`;
  }

  // Generic video embed — auto-detects YouTube or Vimeo from the pasted URL.
  // (The dedicated 'youtube'/'vimeo' types below still work for anyone using them.)
  if (b.type === 'video' || b.type === 'youtube') {
    const yt = youtubeId(b.url);
    if (yt) return `<div class="block-embed ratio-16-9"><iframe src="https://www.youtube-nocookie.com/embed/${esc(yt)}" title="${esc(b.title || 'Video')}" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
    const vm = vimeoId(b.url);
    if (vm) return `<div class="block-embed ratio-16-9"><iframe src="https://player.vimeo.com/video/${esc(vm)}" title="${esc(b.title || 'Video')}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    return ''; // no recognizable video id yet
  }

  if (b.type === 'vimeo') {
    const id = vimeoId(b.url);
    if (!id) return '';
    return `<div class="block-embed ratio-16-9"><iframe src="https://player.vimeo.com/video/${esc(id)}" title="${esc(b.title || 'Video')}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  }

  if (b.type === 'spotify') {
    const embed = spotifyEmbedUrl(b.url);
    if (!embed) return '';
    return `<div class="block-embed ratio-short"><iframe src="${esc(embed)}" title="${esc(b.title || 'Spotify')}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></div>`;
  }

  if (b.type === 'soundcloud') {
    const embed = soundcloudEmbedUrl(b.url);
    if (!embed) return '';
    return `<div class="block-embed ratio-short"><iframe src="${esc(embed)}" title="${esc(b.title || 'SoundCloud')}" loading="lazy"></iframe></div>`;
  }

  if (b.type === 'calendly' || b.type === 'typeform') {
    if (!b.url) return '';
    return `<div class="block-embed ratio-tall"><iframe src="${esc(b.url)}" title="${esc(b.title || b.type)}" loading="lazy"></iframe></div>`;
  }

  if (b.type === 'text') {
    return `<div class="block-text">${b.title ? `<strong>${esc(b.title)}</strong><br>` : ''}${esc(meta.body || '').replace(/\n/g, '<br>')}</div>`;
  }

  if (b.type === 'faq') {
    const items = Array.isArray(meta.items) ? meta.items : [];
    if (!items.length) return '';
    return `<div class="block-faq">${items
      .map((it) => `<details><summary>${esc(it.q || '')}</summary><p>${esc(it.a || '')}</p></details>`)
      .join('')}</div>`;
  }

  if (b.type === 'contact') {
    const parts = [];
    if (meta.phone) parts.push(`<a href="tel:${esc(meta.phone)}">📞 ${esc(meta.phone)}</a>`);
    if (meta.email) parts.push(`<a href="mailto:${esc(meta.email)}">✉️ ${esc(meta.email)}</a>`);
    if (meta.company) parts.push(`<span style="display:block;font-size:.85rem;opacity:.7;margin-top:4px">${esc(meta.company)}</span>`);
    return `<div class="block-contact"><h3>${esc(meta.name || b.title || 'Contact')}</h3>${parts.join('')}</div>`;
  }

  if (b.type === 'discount') {
    return `<div class="block-discount">
      ${meta.description ? `<div>${esc(meta.description)}</div>` : ''}
      <div class="code">${esc(b.title || '')}</div>
    </div>`;
  }

  // Plain image block (e.g. a WhatsApp QR code) — rendered as a static <img>,
  // not a clickable /r/:id redirect. Reuses the existing `thumbnail` column
  // (already just a generic image-URL string field) rather than adding a new
  // column; `url` is left unused for this type.
  if (b.type === 'image') {
    if (!b.thumbnail) return '';
    return `<div class="block-image">${b.title ? `<div class="block-image-caption">${esc(b.title)}</div>` : ''}<img src="${esc(b.thumbnail)}" alt="${esc(b.title || '')}" loading="lazy"></div>`;
  }

  if (b.type === 'email') {
    // block ids are UUIDs in hosted mode — must be a quoted JS string, not a bare identifier.
    return `<div class="block-email" data-block="${esc(String(b.id))}">
      <h3>${esc(b.title || 'Join my mailing list')}</h3>
      <form onsubmit="return subscribe(event, '${esc(String(b.id))}')">
        <input type="email" name="email" placeholder="you@email.com" required autocomplete="email">
        <button type="submit">Subscribe</button>
      </form>
      <div class="msg"></div>
    </div>`;
  }

  // default: link (also covers maps, gofundme, discount code links, tour/events,
  // discord, whatsapp, instagram, tiktok — these are all just styled URL redirects,
  // the categorization is a dashboard/picker concern, not a rendering one)
  const thumb = b.thumbnail ? `<img class="thumb" src="${esc(b.thumbnail)}" alt="">` : '';
  const label = b.title || ICON_LINK_LABELS[b.type] || '';
  return `<a class="block-link${b.animate ? ' animate' : ''}" href="${basePath}/r/${b.id}" ${/^https?:/.test(b.url) ? '' : 'rel="nofollow"'}>${thumb}<span>${esc(label)}</span></a>`;
}

function renderPublicPage({ settings, blocks, origin = '', basePath = '' }) {
  const s = settings;
  const font = FONTS[s.font] || FONTS.system;
  const theme = THEMES.includes(s.theme) ? s.theme : 'gradient';
  const title = s.seo_title || `${s.display_name} — Links`;
  const desc = s.seo_description || s.bio || `All links for ${s.display_name}`;
  const socials = (() => { try { return JSON.parse(s.socials || '{}'); } catch { return {}; } })();
  const live = blocks.filter((b) => isBlockLive(b));

  let bgStyle = '';
  if (s.bg_type === 'color' && s.bg_value) bgStyle = `body{background:${esc(s.bg_value)};}`;
  else if (s.bg_type === 'gradient' && s.bg_value) bgStyle = `body{background:${esc(s.bg_value)};}`;
  else if (s.bg_type === 'image' && s.bg_value) bgStyle = `body{background:url('${esc(s.bg_value)}') center/cover fixed no-repeat;}`;

  const socialRow = Object.entries(socials)
    .filter(([k, v]) => SOCIALS[k] && v)
    .map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener" aria-label="${esc(SOCIALS[k].label)}" title="${esc(SOCIALS[k].label)}">${SOCIALS[k].svg}</a>`)
    .join('');

  const avatar = s.avatar
    ? `<img class="avatar" src="${esc(s.avatar)}" alt="${esc(s.display_name)}">`
    : `<div class="avatar-fallback">${esc((s.display_name || '?').trim().charAt(0).toUpperCase())}</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${s.avatar ? `<meta property="og:image" content="${esc(origin + s.avatar)}">` : ''}
<meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔗</text></svg>">
<style>
:root { --font-stack: ${font.stack}; }
${THEME_CSS}
:root { --accent: ${esc(s.accent || '#8b5cf6')}; }
${bgStyle}
</style>
${s.custom_css ? `<style>\n${s.custom_css}\n</style>` : ''}
</head>
<body class="theme-${theme}">
<main class="page">
  ${avatar}
  <h1>${esc(s.display_name)}</h1>
  ${s.bio ? `<p class="bio">${esc(s.bio)}</p>` : ''}
  ${socialRow ? `<div class="socials">${socialRow}</div>` : ''}
  <div class="blocks${s.layout === 'grid' ? ' blocks-grid' : ''}">
    ${live.map((b) => renderBlock(b, basePath)).join('\n    ')}
  </div>
</main>
<script>
async function subscribe(e, blockId){
  e.preventDefault();
  var form = e.target, msg = form.parentElement.querySelector('.msg');
  var email = form.email.value;
  try {
    var r = await fetch('${basePath}/api/public/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: email, block_id: blockId }) });
    var j = await r.json();
    msg.textContent = r.ok ? (j.message || 'Subscribed! 🎉') : (j.error || 'Something went wrong');
    if (r.ok) form.reset();
  } catch { msg.textContent = 'Network error — try again'; }
  return false;
}
// Report height to an embedding parent frame so the embed script can auto-size the iframe.
if (window.parent !== window) {
  var lastH = 0;
  function reportHeight() {
    var h = document.documentElement.scrollHeight;
    if (h !== lastH) { lastH = h; window.parent.postMessage({ source: 'link-in-bio', height: h }, '*'); }
  }
  new ResizeObserver(reportHeight).observe(document.body);
  reportHeight();
}
</script>
</body>
</html>`;
}

module.exports = { renderPublicPage, FONTS, THEMES, SOCIALS, isBlockLive, LINK_STYLE_TYPES };
