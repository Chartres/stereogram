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
- **Open decisions (Pavol):** which signature move first (`docs/SIGNATURE.md`: A library + book,
  B course, C all three; default A); confirm the one-liner and the `community` track.

## Next (each with its test)

| When | Item | Kill / success test |
|---|---|---|
| after the signature review (default A) | Bake pipeline: ~50 CC0 sculptures → depth PNGs, ~40 Met/ambientCG/in-house tiles, `provenance.json`; CI asserts every asset has a credit | `pick_figure` / `pick_pattern` events arrive; licence check green |
| with A | `#/book`: ~100 plates rendered at build, paged, caption + answer + share-a-guess links | `plate_open` arrives within a week of deploy |
| next sprint | The patient eye: six-step course, shimmer, 7 % note (fix the guide's "one in twenty" to "about one in fourteen") | `ladder_step` arrives; P4 journey gains the ladder |
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
