# Stereogram — PRD

## Why this exists

People who grew up with Magic Eye books want to make one: a hidden word for a friend, a sheet for a
class, a wallpaper, a test of their own depth map. The tools online are ad-laden, upload your
picture to a server, cap the size, or have not been touched since 2010. A stereogram is pure
deterministic computation; it belongs in the browser, offline, at print size, reproducible from a
link. Pavol's own reason: a thing to make with his daughters in an evening, rooted in Julesz and
Thimbleby rather than in a trend (`docs/SIGNATURE.md`).

## Users and journeys

`docs/PERSONAS.md`: P1 Marek (hidden word, link), P2 Lenka (A4 print), P3 Tom (own depth map), P4 Eva
(phone, first time), P5 Jonas (reproducible), P6 Klára (draws). Anchor: P1.

## Scope (v0.1, shipped with the scaffold)

- Depth sources: 8 shapes, text, soft-brush drawing, greyscale upload (invert, smooth).
- Patterns: random dots (density), colour dots, 3 procedural tiles, own picture.
- Renderer: TIW 1994 with hidden-surface removal; E and μ sliders; parallel / cross; helper dots;
  reveal depth map; seed; Worker rendering.
- Output: 5 size presets + custom to 4096 px; PNG download; copy picture; copy link (URL params).
- Guide: how to see it, the honest note, provenance.
- Standard kit: analytics, feedback, discoverability, PWA offline, icons, OG card.

## Non-goals (now)

Server-side anything; AI depth estimation; accounts or galleries; animation (parked until a persona asks).

## Natural usage frequency

Occasional (a few times a year per person). North Star candidate for `launched`: pictures taken away
per week (`conversion`). Activation event: `conversion`.

## Kill metrics

Building time-box ends 2026-11-18: not live with upload + text + shapes, PNG export and the guide
by then → kill. Soft-launch gate: one approved signature move live and measured; ≥1 feedback row.

## What remains once a user's own model does the obvious part (§6c)

`surface`: a deterministic, offline, print-resolution renderer with reproducible seeds and links,
usable with no model at all; and, once the ladder (signature A) ships, `method`: a way to learn to
see one, which an answer cannot give.

## Architecture

Vite + React + TS, Tailwind 4. `src/domain/` pure (renderer, depth, patterns, params); `src/app/`
Worker shim + canvas sources; `src/components/` UI. Cloudflare Pages via Git integration at
`stereogram.dravec.org`; shared flywheel-core analytics, publishable key only. $0 infra.
