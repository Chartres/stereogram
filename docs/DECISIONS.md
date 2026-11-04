# Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-11-04 | TypeScript renderer in a Web Worker, no Rust/WASM | An A4 render is ~1 s in JS off the main thread; WASM adds a toolchain to CI for a speed-up nobody has asked for. Revisit with a number (ROADMAP "Later"). |
| 2026-11-04 | Cross-eyed mode = parallel on the inverted depth map | Reverses the disparity sign with one line; hidden-surface geometry then assumes the inverted scene, which is acceptable at μ ≤ 0.7. |
| 2026-11-04 | "This screen" preset renders at CSS pixels, not device pixels | What you see is what you download, and the eye-separation slider means the same thing on screen and in the file. DPR rendering is in the backlog. |
| 2026-11-04 | Tile patterns are refitted to the far-plane strip width | The tile then repeats exactly once per strip on the background, which is what textured stereograms need to read. |
| 2026-11-04 | Conversion = first download or copy per session | The aha moment is taking a picture away, which the page can observe; "I saw it" cannot be observed without the ladder (signature move A). |
| 2026-11-04 | Founder case #2 fingerprint pinned at `0001101001000010` | First render of the shipped algorithm; any change to the PRNG, link loop or paint order must show up here. |
| 2026-11-04 | The book's plates are rendered on the client from fixed (figure, pattern, seed) specs, not shipped as PNGs | Same pixels every time, 100 plates cost a few hundred bytes instead of 20–40 MB; a static plate image for social unfurls can be added per plate later. |
| 2026-11-04 | Figures: Poly Haven only tonight; Smithsonian, Kenney and Met scans deferred | si.edu refused automated fetches and Kenney is zip-only; the bake script takes more sources when they are added to its table. |
| 2026-11-04 | Met tiles are the central 60 % of the image at 512 px, palette PNG | Keeps the ornament and drops the mount; 7.6 MB total, fetched on first use and runtime-cached, not precached. |
| 2026-11-04 | Signature moves recorded `building`, flipped to `live` after the deploy read-back | signature.md: live needs approved_on, which is 2026-11-04 ("all three please"). |
| 2026-11-04 | Figures fill 96 % of the shorter side (was 86 %), shapes enlarged, phone pictures 1.1× taller than wide | Pavol's phone shot: the hidden thing was too small to find at 359 px wide. Founder case #2 (row 0 of a 2-row map) is unaffected. |
