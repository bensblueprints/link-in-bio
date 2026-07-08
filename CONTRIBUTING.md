# Contributing to LinkLeaf

LinkLeaf is open source (MIT) and built to be extended. Fork it, build an integration, and open a PR — the most useful additions get merged, and standout integrations can be **featured in a launch** (see the revenue-share program below).

## 💸 Featured Integration Revenue Share

Here's the deal, and it applies across all of our apps — not just LinkLeaf:

> If we pick up your fork or integration and put it in a **new video and a new launch**, you get a **cut of the profits** from everyone who buys the customer-facing app off the back of it.

In plain terms: build something genuinely useful on top of LinkLeaf, and if we feature it to our audience and it drives sales of the hosted product, **you share in that revenue**. The split is agreed with you per featured integration before the launch. This is a real invitation — we're actively looking for integrations worth putting our name and marketing behind.

Good candidates:
- New **block types** (the fastest win — see [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md))
- Integrations with other platforms (e-commerce, email, booking, analytics, CRMs)
- Import/export tools, themes, embeds, automations

Want to pitch one before you build it? Open an issue describing the integration and we'll tell you if it's a fit for a feature.

## 🚀 Getting set up

```bash
git clone https://github.com/YOUR-USERNAME/Link-Leaf.git
cd Link-Leaf
npm install
npm run dev          # Vite dev server for the dashboard UI (proxies /api)
npm test             # end-to-end smoke tests
```

The app runs in two modes:
- `APP_MODE=single` — self-host, SQLite, one page + one admin password. Simplest to hack on.
- `APP_MODE=multi` — the hosted multi-tenant SaaS (Postgres + accounts + Whop billing). Needs a `DATABASE_URL`; `docker compose -f docker-compose.hosted.yml up -d` brings up the app + a Postgres for you.

Start with `single` mode unless your integration specifically needs multi-tenancy.

## 🧩 Building an integration

The most common and highest-value contribution is a **new block type** — a new thing people can drop onto their page. LinkLeaf is designed so a block is a small, self-contained addition:

1. Add it to the block catalog (`server/block-catalog.js`).
2. Teach the public-page renderer how to draw it (`server/public-page.js`).
3. Add its editor fields to the dashboard (`client-hosted/src/components/BlocksTab.jsx`).

Full step-by-step with a worked example is in **[docs/INTEGRATIONS.md](docs/INTEGRATIONS.md)**.

## 📥 Submitting a PR

1. Fork, branch (`git checkout -b my-integration`).
2. Keep changes focused; match the surrounding code style.
3. Make sure `npm test` passes.
4. Open a PR describing what it does and (if relevant) whether you'd like it considered for a featured launch.

## 📜 License

By contributing you agree your contribution is licensed under the repository's MIT license.
