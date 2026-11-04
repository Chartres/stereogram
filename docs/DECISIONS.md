# Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-11-04 | TypeScript renderer in a Web Worker, no Rust/WASM | An A4 render is ~1 s in JS off the main thread; WASM adds a toolchain to CI for a speed-up nobody has asked for. Revisit with a number (ROADMAP "Later"). |
| 2026-11-04 | Cross-eyed mode = parallel on the inverted depth map | Reverses the disparity sign with one line; hidden-surface geometry then assumes the inverted scene, which is acceptable at μ ≤ 0.7. |
| 2026-11-04 | "This screen" preset renders at CSS pixels, not device pixels | What you see is what you download, and the eye-separation slider means the same thing on screen and in the file. DPR rendering is in the backlog. |
| 2026-11-04 | Tile patterns are refitted to the far-plane strip width | The tile then repeats exactly once per strip on the background, which is what textured stereograms need to read. |
| 2026-11-04 | Conversion = first download or copy per session | The aha moment is taking a picture away, which the page can observe; "I saw it" cannot be observed without the ladder (signature move A). |
| 2026-11-04 | Founder case #2 fingerprint pinned at `0001101001000010` | First render of the shipped algorithm; any change to the PRNG, link loop or paint order must show up here. |
