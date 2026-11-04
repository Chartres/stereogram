# Stereogram — roadmap

Reading order for a cold start: `AGENTS.md` → this file → `BACKLOG.md` → `docs/DECISIONS.md`.

## Now (rewritten at the end of every session; last: 2026-11-04)

- **Stage:** building (entered 2026-11-04). Gate to soft-launch: deployed MVP passing `/qa`, CI
  green, one approved signature move live and measured, analytics verified firing.
- **What's live:** first commit of the scaffolded, Standard-compliant repo. All of the generator
  (shapes, text, draw, upload, four pattern kinds, five size presets, Worker render, links, PNG
  download, copy, helper dots, reveal), the viewing guide, feedback control, analytics wiring,
  discoverability kit, 44 unit tests + 11 e2e journeys with committed shots.
- **In flight:** deploy via the hub's `connect-pages` (slug `stereogram`); `links.live` is set once
  it answers; release tag after the live read-back.
- **Landscape done (4 Nov, evening):** `flywheel/docs/discovery/stereogram-landscape.md` and the
  page `docs/landscape-2026-11-04.html`. Verdict: crowded (Owl3D, Tembrica, KilledByAPixel in 2026);
  nobody has a library of real sculpture, pattern provenance, a book of plates or a viewing course.
- **Pavol's phone pass (22:23):** elephant now three-quarter, tiles levelled, book interleaves kinds (busts no longer run), 51 figures (SMK casts incl. Dying Gaul, Laocoön, Moses; Smithsonian reliefs), 34 tiles. AIO: enrolled in `data/aio/queries.json` since registration; the weekly measurement runs on its own.
- **0.3.0 (22:30):** seven more moves live: Comenius's spectacles, the printed plate with colophon,
  the relief shelf (SMK casts + Smithsonian reliefs), the depth test at `#/depth`, modrotlač, the
  Chartres labyrinth, Public Domain Day as a yearly scheduled task. Custom domain still waits on
  Zone · DNS · Edit on the token the hub really holds (CF-all).
- **Signature moves (Pavol picked C, all three, 21:06):** shipped the same evening as 0.2.0: the
  library (26 figures, 36 Met tiles, provenance under every picture), `#/book` (100 plates), the
  patient eye ladder on See. Smithsonian, Kenney and Met-scan figures and Terrarium landscapes
  are the next bake sources. Open: confirm the one-liner and the `community` track.

## Next (each with its test)

| When | Item | Kill / success test |
|---|---|---|
| after the signature review (default A) | Bake pipeline: ~50 CC0 sculptures → depth PNGs, ~40 Met/ambientCG/in-house tiles, `provenance.json`; CI asserts every asset has a credit | `pick_figure` / `pick_pattern` events arrive; licence check green |
| with A | `#/book`: ~100 plates rendered at build, paged, caption + answer + share-a-guess links | `plate_open` arrives within a week of deploy |
| next sprint | The patient eye: six-step course, shimmer, 7 % note (fix the guide's "one in twenty" to "about one in fourteen") | `ladder_step` arrives; P4 journey gains the ladder |
| 2026-11-11 | Cleveland's CC0 reliefs (reliquary, Coptic panel) for the shelf: Sketchfab login needed (owner: a token in the keychain) | 2 more figures |
| 2026-11-11 | Depth test: a real-phone pass (does the card slider reach 85.6 mm on a 390 px screen? does free fusion of 48 mm panels work on a phone?) | P11 walked on Pavol's phone, shot kept |
| every 1 Jan | Public Domain Day plates: the scheduled task `trig_018rAAkwS7wK66U53J2pdBxM` fires 09:10 Prague on 1 January, bakes works of authors dead 70 years and opens a PR | a PR each 1 January; Lada's Nativity on 1 Jan 2028, not before |
| 2026-11-11 | Centre-out painting for tile patterns (the left half of textured pictures smears; TIW paints right-to-left) | P1 heart + confetti shot has no diagonal tearing; founder case #2 row fingerprint changes with a DECISIONS line |
| 2026-11-11 | Stereo pair (left/right) export for people who cannot fuse autostereograms, and anaglyph red-cyan | P4 journey gains a "pair" step; the download is two PNGs |
| 2026-11-18 | Sean Ellis micro-survey arrives (the FeedbackCard already carries it); check rows in `flywheel-core.feedback` | ≥1 feedback row before the building time-box ends |

## Later

- Animated stereograms (a sequence of depth maps → GIF/WebM) — only if a persona asks.
- Rust/WASM renderer if an A4 render exceeds 2 s on a mid phone (measure first; the Worker keeps the UI alive today).
- Czech UI (`lang` switch) if Czech queries show up in the AI-search measurement.

## Working conventions

- TDD in `src/domain/` (pure), persona e2e in `e2e/journeys.spec.ts` with shots committed under `e2e/shots/`.
- `FOUNDER-CASES.md` is code; a change needs a `docs/DECISIONS.md` line.
- Signature moves go to Pavol before they are built; everything technical is decided here and logged.
- `scripts/ci-local.sh` before every push.
