# Building a LinkLeaf integration

The fastest, most useful thing you can build is a **new block type** — a new element people can add to their page. This guide walks through it end to end with a worked example: a **"Countdown" block** that shows a live countdown to a date.

A block touches three files:

| File | Role |
|---|---|
| `server/block-catalog.js` | Registers the block so it shows in the "Add block" picker and passes server validation |
| `server/public-page.js` | Renders the block's HTML on the public page |
| `client-hosted/src/components/BlocksTab.jsx` | The editor fields shown in the dashboard |

Blocks carry a few standard columns (`title`, `url`, `thumbnail`) plus a free-form `metadata` JSON object for anything custom — no schema migration needed for new fields.

---

## 1. Register it in the catalog

`server/block-catalog.js` is the single source of truth. Add your block to a category. `implemented: true` makes it live (the server accepts it); `false` shows it greyed-out as "Coming soon".

```js
// in the category of your choice, e.g. "Promotions & Events"
{ type: 'countdown', label: 'Countdown', icon: 'Clock', implemented: true }
```

`icon` is any [lucide-react](https://lucide.dev) icon name — the client resolves it.

## 2. Render it on the public page

In `server/public-page.js`, `renderBlock(b, basePath)` is a series of `if (b.type === ...)` branches returning an HTML string. Add yours. Custom data lives on `b.metadata`.

```js
if (b.type === 'countdown') {
  const target = b.metadata.target || '';
  return `<div class="block-countdown" data-target="${esc(target)}">
    <div class="cd-label">${esc(b.title || 'Countdown')}</div>
    <div class="cd-time" data-countdown>—</div>
  </div>`;
}
```

Add any CSS to the `<style>` block in the same file, and (optional) a small script in the page's inline `<script>` if the block needs client behavior. Keep the public page dependency-free — no external requests.

## 3. Add the editor fields

In `client-hosted/src/components/BlocksTab.jsx`, the `Editor` component renders per-type fields. Custom fields read/write `b.metadata` via the `setMeta(key, value)` helper:

```jsx
{b.type === 'countdown' && (
  <div>
    <label>Count down to</label>
    <input
      type="datetime-local"
      value={b.metadata.target || ''}
      onChange={(e) => setMeta('target', e.target.value)}
    />
  </div>
)}
```

That's it — the block now appears in the picker, saves its data, and renders publicly.

---

## Gating (optional)

If your block should be limited by plan (e.g. free users get one, paid unlimited), enforce it in `server/app-multi.js` where the `POST /blocks` handler checks `gating.*`, and describe the limit in `server/gating.js`. See how `email` (paid-only) and video blocks (free-capped) are handled.

## Testing

`test/smoke-multi.js` creates a block, round-trips its metadata, and asserts it renders on the public page. Copy that pattern for your block and run `npm test`.

## Bigger integrations

Not every integration is a block. You can also add:
- **API endpoints** — new routes on the Express app (`server/app-multi.js`).
- **Import/export** — read/write the `pages`/`blocks` tables (`server/db-multi.js`).
- **Third-party sync** — a webhook receiver + a background job.

If you're building something ambitious, open an issue first — we're happy to point you at the right seams, and it's a good way to flag it for a [featured launch](../CONTRIBUTING.md#-featured-integration-revenue-share).
