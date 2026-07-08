<div align="center">

# 🌿 LinkLeaf

### Your one page for every link you share.

**A beautiful link-in-bio builder. Use the free hosted version in seconds — or self-host the open-source code yourself. No branding lock-in, your subscriber data is always yours.**

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)
[![Hosted](https://img.shields.io/badge/hosted-linkleaf.im-f97316)](https://linkleaf.im)
[![Self-host](https://img.shields.io/badge/self--host-Docker%20ready-2496ED?logo=docker&logoColor=white)](#-self-host-it-developers)
![Node](https://img.shields.io/badge/Node-20%2B-339933?logo=node.js&logoColor=white)

## [**🚀 Create your page free at linkleaf.im →**](https://linkleaf.im)

_No install, no terminal, no credit card. Claim your handle and you're live in 60 seconds._

[⭐ Star this repo](https://github.com/bensblueprints/Link-Leaf) &nbsp;·&nbsp; [🧑‍💻 Self-host it](#-self-host-it-developers)

![LinkLeaf landing page](docs/screenshots/01-landing.png)

</div>

---

## ✨ See it

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/08-public-page.png" alt="A live public page"><br><em>Your public page — fast, mobile-first, zero trackers</em></td>
    <td width="50%"><img src="docs/screenshots/04-dashboard-blocks.png" alt="Dashboard blocks editor"><br><em>Drag-to-reorder block editor</em></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/05-add-block-picker.png" alt="Add-block catalog"><br><em>A full catalog of blocks to add</em></td>
    <td width="50%"><img src="docs/screenshots/06-themes.png" alt="Theme picker"><br><em>6 polished themes + full custom styling</em></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/03-onboarding.png" alt="Onboarding wizard"><br><em>Claim your handle in a 60-second wizard</em></td>
    <td width="50%"><img src="docs/screenshots/07-analytics.png" alt="Analytics"><br><em>Views, clicks & CTR — your data, your database</em></td>
  </tr>
</table>

---

## 🎁 What you get

- **Profile** — avatar, display name, bio, and a social icon row (Instagram, X, TikTok, YouTube, Facebook, LinkedIn, GitHub, Twitch, Spotify, and more)
- **Rich blocks** — links (with thumbnails + hover animation), headers, text, FAQ accordions, contact cards, discount codes, and embedded **YouTube, Vimeo, Spotify, SoundCloud, Calendly & Typeform**
- **Email capture** — collect subscribers into your own list, one-click CSV export
- **Drag to reorder** — grab, drop, done; order saves automatically
- **Scheduling** — give any block a start/end date for launches and limited drops
- **6 polished themes** — gradient, glass, minimal, dark, neon, paper — plus custom accent, background & CSS
- **Analytics** — page views, clicks per link, CTR, 30-day chart — **yours**, never sold
- **Blazing-fast public page** — server-rendered, mobile-first, SEO + Open Graph, **zero external requests** (no font pings, no trackers)

## 🚀 Just want a page? Use the hosted version

Most people should start here — it's free and there's nothing to install:

### **→ [linkleaf.im](https://linkleaf.im)**

Sign up, claim your username, and share `linkleaf.im/yourname`. Free forever to start; upgrade any time for unlimited embeds, email capture, custom styling, and no badge.

## 🧑‍💻 Self-host it (developers)

LinkLeaf is open-source (MIT). If you'd rather run the whole thing on your own server, you can — it's a single Node service backed by Postgres, and it ships a Docker Compose file that brings up the app + database together.

```bash
git clone https://github.com/bensblueprints/Link-Leaf.git
cd Link-Leaf
cp .env.example .env          # set DB_PASSWORD, SESSION_SECRET, etc.
docker compose -f docker-compose.hosted.yml up -d --build
```

Put Caddy / nginx / Traefik in front for TLS, point your domain at the box, and you're running your own multi-tenant LinkLeaf. Configuration lives in `.env` (see `.env.example`); Whop billing is optional and only needed if you want paid plans.

> Prefer a simple single-user setup with SQLite instead of the full multi-tenant stack? The repo also supports `APP_MODE=single` (one page, one admin password, `docker compose up -d`).

## ⚖️ LinkLeaf vs Linktree

| | **LinkLeaf** | Linktree |
|---|---|---|
| Price | **Free to start** | $5–$9/mo for the good stuff |
| Your own handle/domain | ✅ | Paid plan only |
| Branding on your page | **None on paid** | On free plan |
| Email capture + CSV | ✅ | Paid plan |
| Link scheduling | ✅ | Paid plan |
| Analytics | ✅ Yours | Theirs |
| Custom CSS | ✅ | ❌ |
| Self-host / own your data | ✅ Open-source | ❌ |

## 🤝 Fork it & build integrations — get paid if we feature you

LinkLeaf is built to be extended, and we want your integrations. Adding a new **block type** or an integration with another platform is a small, self-contained change — see **[docs/INTEGRATIONS.md](docs/INTEGRATIONS.md)**.

**The incentive:** if we pick up your fork/integration and put it in a **new video and launch**, you get a **cut of the profits** from everyone who buys the customer-facing app because of it. This applies across all our apps. Details in **[CONTRIBUTING.md](CONTRIBUTING.md)**.

Got an idea? [Open an issue](https://github.com/bensblueprints/Link-Leaf/issues) and pitch it — we're actively looking for integrations worth marketing.

## 🛠️ Tech stack

- **Server:** Node 20+, Express — one process serves the API, dashboard, and public pages
- **Database:** Postgres (multi-tenant) with bcrypt auth and session cookies
- **Billing:** optional Whop integration via a signed webhook
- **Dashboard UI:** React 18, Vite, Tailwind CSS, Lucide icons
- **Public page:** server-rendered plain HTML/CSS — no framework payload, instant on mobile

## 🧑‍💻 Development

```bash
npm install
npm run dev          # Vite dev server for the dashboard UI (proxies /api)
npm test             # end-to-end smoke tests
```

## 📄 License

MIT © 2026 Ben ([bensblueprints](https://github.com/bensblueprints)) — build on it, ship it, make it yours.

<div align="center">
<br>
<strong>Made with 🌿 LinkLeaf</strong><br>
<a href="https://linkleaf.im">linkleaf.im</a>
</div>
