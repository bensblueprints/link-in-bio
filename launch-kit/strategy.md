# Launch Strategy — Link-in-Bio

## Positioning
"Own your one page on your own domain." Target: creators, musicians, UGC creators who treat their link-in-bio as their storefront but hate renting it monthly and hate third-party branding on their own audience page. Price anchor: Linktree Starter $5/mo, Pro $9/mo.

## Target communities (rules-aware angles)

| Community | Angle |
|---|---|
| r/selfhosted (500k+) | "I made a self-hosted Linktree replacement — one SQLite file, Docker compose, zero external requests." Show HN-style honesty; they hate marketing speak, love the no-trackers detail. Post as a project share (allowed with source link). |
| r/WeAreTheMusicMakers | Value-first: "PSA: your presave/merch link page can live on your own domain for the cost of 2 months of Linktree." No hard selling — answer in comments; check weekly promo thread rules. |
| r/InstagramMarketing / r/Instagram | Focus on the analytics + email capture: "Your link-in-bio clicks are data YOU should own." Avoid link drops; lead with a teardown of what Linktree keeps from you. |
| r/Twitch | Streamers pin one link everywhere. Angle: paper/neon themes + no rate limits during raids. Post in self-promo Saturday threads only. |
| r/opensource | Straight repo share, MIT license front and center; the paid installer is mentioned only if asked (community norms). |
| r/EntrepreneurRideAlong | Build-in-public post: "I'm selling a $19 one-time alternative to a $9/mo SaaS — here's the math and week-1 numbers." |
| Indie Hackers | Same build-in-public post, milestone format. |

## Hacker News — Show HN draft

**Title:** Show HN: Self-hosted link-in-bio page — one SQLite file, no subscription

**Body:**
I got tired of paying $9/month for what is essentially one HTML page, so I built a self-hosted replacement.

It's a single Node process: Express serves a server-rendered public page (zero external requests — fonts are system stacks, no analytics beacons) plus a React admin behind a password. Data is one SQLite file via better-sqlite3: blocks, click events, page views, and email subscribers (CSV export). Links can be scheduled with start/end dates. There's a thin Electron wrapper if you'd rather run it as a desktop app than on a VPS.

Design decisions I'd love feedback on: SSR-only for the public page (the admin SPA never loads for visitors), click tracking via a /r/:id redirect rather than JS, and in-memory sessions on the theory that a single-admin tool doesn't need more.

MIT source. I sell a packaged installer for non-technical creators ($19 one-time) — that experiment in "pay once" pricing vs SaaS is half the reason I'm posting.

## SEO keywords (10)
1. linktree alternative
2. self hosted linktree
3. free linktree alternative
4. link in bio tool
5. link in bio on my own domain
6. open source link in bio
7. linktree alternative one time payment
8. link in bio for musicians
9. link in bio with email capture
10. linktree without branding

## AppSumo / PitchGround pitch

Link-in-Bio is the "pay once, own forever" answer to Linktree's $9/month treadmill — a self-hosted link page builder your buyers install in one click (desktop app) or one `docker compose up` (any $5 VPS). It ships everything the SaaS gates behind Pro: custom domain, 6 polished themes plus full custom CSS, click analytics with a 30-day chart, link scheduling, and an email-collect block that exports straight to CSV — with zero third-party branding and zero trackers on the public page. Source is MIT (real code your community can audit), the deal is a lifetime license with updates. LTV math for your audience: Linktree Pro is $108/year; this pays for itself in under 3 months and there is nothing left to churn from.

## Pricing

**$19 one-time** (installer + lifetime updates).
- vs Linktree Starter $5/mo → pays for itself in **3.8 months**
- vs Linktree Pro $9/mo → pays for itself in **2.1 months**
- 3-year saving vs Pro: **$305**

Optional later: $39 "Creator bundle" tier (priority support + theme pack) once reviews exist. Keep the $19 anchor at launch.
