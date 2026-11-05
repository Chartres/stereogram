# AGENTS.md — Stereogram

The build/test/release contract for this repo. An agent (or the overnight ralph loop) should be
able to read only this file and ship correctly. Keep every command copy-pasteable and current.
Taste rules that apply to every flywheel product live in the hub: `flywheel/docs/standards/taste.md`.

> One-liner: Free stereogram (Magic Eye) generator in the browser: shapes, text, a drawing or your own depth map; random dots or a pattern; print-size PNG; no account.
> Stack/template: web-static (Vite + React + TS, Tailwind 4, Vitest + RTL + Playwright)  ·  Track: community  ·  Portfolio record: `flywheel/data/products/stereogram.json`

**Picking this up?** Read `docs/ROADMAP.md` first (where things stand, what's in flight, the
handoff conventions), then `BACKLOG.md`. Update ROADMAP's **Now** before you end a session.

## Build
```bash
npm ci
npm run build          # tsc -b && vite build → dist/ (PWA service worker included)
```

## Test (TDD required; persona-journey test per primary journey)
```bash
npm run typecheck      # tsc -b --noEmit (app + e2e)
npm test               # vitest: domain (algorithm, depth maps, params), founder cases, contrast gate, signals contract, components
npm run e2e            # playwright against `npm run preview` on :4173 — build first; writes e2e/shots/*.png (committed; look at them)
scripts/ci-local.sh    # exactly what ci.yml gates; prints PASS:ci-local — run before every push
```
Gate: typecheck · test · build · e2e must pass (CI is `docs/standards/ci.template.yml`). Block only on these.

Layout: `src/domain/` is pure and framework-free (the Thimbleby–Inglis–Witten renderer, depth maps,
patterns, URL params) and is where new logic goes with its test; `src/app/` holds the Worker shim and the
canvas-only depth sources (text, uploads); `src/components/` is the UI. `FOUNDER-CASES.md` rows are
asserted by `src/domain/founder-cases.test.ts`; change a row only with a line in `docs/DECISIONS.md`.

Perf/size asks name a number (bundle kB, p95 ms, suite seconds), re-measure each round, stop at
target — "optimize" without a number is not actionable. Multi-finding reviews use the clean-room
split: findings reduced to `file:line · symptom`, a fresh context fixes one at a time, tests after
each fix (see flywheel `skills/flywheel/references/sweep.md`).

## Run / verify a change in the real app
```bash
npm run dev            # http://localhost:5173 — the first picture renders with no input
```
Check at 390 px wide too: the picture leads, Download sits under it, no horizontal scroll (P4 journey
pins this). A visual change ends with the e2e shots re-read by eye, not just green.

## Release (the finish line — produces a storefront link)
- **Web** → Cloudflare Pages Git integration deploys `main` to `https://stereogram.dravec.org`
  (hub workflow `connect-pages`, slug `stereogram`); no deploy job and no Cloudflare secrets here.
  Platform env on Pages and on this repo's Actions: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- After the live URL serves the new commit: `~/my-git/flywheel/scripts/release-tag.sh deploy` (FLYWHEEL-STANDARD §5).
  Wait on content, not on the deployment list: a deployment appears in `wrangler pages deployment
  list` while it is still building, and its URL answers "Deployment Not Found" until it is done
  (5 Nov: a release was read back too early and looked broken). Poll a file this commit changed on
  `https://<deployment-id>.stereogram.pages.dev/`, then read the custom domain back with `?rb=<n>`.
- Link cards: every plate has /plate/<n>/ with its own og:image, rendered by `scripts/prerender-plates.mjs`
  during `npm run build`. Unfurlers cache a URL's card; check a changed card with `?v=2`.
- Bump `VERSION` + `CHANGELOG.md` and `public/sitemap.xml` `lastmod` in the commit that changes user-visible content.

## Analytics (Common Platform)
Vendored client: `src/platform/flywheel-client.ts`. Fire the shared taxonomy only: `page_view` (per
route), `key_action` with an `action` prop (`share`, `download`, `copy_image`, `share_link`, `preset`,
`upload_depth`, `upload_tile`, `reveal`), `conversion` (the aha moment: a picture taken away by share, download
or copy, once per session, `via` says which; `activation_event: "conversion"` in the portfolio record), `feedback_given`,
`error`. Signals contract (flywheel `docs/standards/signals-contract.md`): send only names on
`src/platform/flywheel-events.json` (the contract test fails otherwise; a new name goes to the
flywheel allow-list first), and main's CI runs `scripts/check-analytics.mjs dist`.

## Signature
`docs/SIGNATURE.md`. The core generator is the obvious part; the moves listed there are reviewed with
Pavol before they are built (flywheel `docs/standards/signature.md`). Persona journeys: `docs/PERSONAS.md`;
a feature is buildable only when it names the journey and the step it improves.

## Done means
Green CI · released (URL) · release tag pushed on the shipped commit
(`deploy-<yyyy-mm-dd>[-n]` via `~/my-git/flywheel/scripts/release-tag.sh`; FLYWHEEL-STANDARD §5) ·
portfolio record updated (stage/gate/links) · storefront link live · (outward promotion only after Pavol's sign-off).
