# Stereogram — backlog (mini-scrum, flywheel `docs/standards/mini-scrum.md`)

## inbox
- 2026-11-04 (sweep two): `separation()` rounds to whole pixels, so a 256-level map shows 19 depth planes at the defaults. Candidate: sub-pixel separation by colour interpolation, or bake to reachable planes and say so. Needs a test; the founder-case fingerprint changes. P3/P7.
- 2026-11-04 (sweep two): FFT each library tile and warn when its own period sits near the repeat width (false fusions). P7.
- 2026-11-04 (author, from the first shots): textured tiles smear in the left half on steep relief — TIW paints right-to-left so distortion accumulates leftwards. Persona P1 (text for a friend) with a tile pattern. → candidate: centre-out painting.
- 2026-11-04 (author): helper dots are small on a phone (radius 5 px at 390 wide). P4. Measure on a real phone before changing.
- 2026-11-04 (author): the "This screen" preset ignores device pixel ratio; on a 2× phone the picture is upscaled 2×, which is fine for viewing but soft for a download. P2/P4. Decide: render at DPR and show at CSS size?

## next sprint (1–3 items, each with a journey and a test)
- (waiting on Pavol, default A) the library + the book of plates — `docs/SIGNATURE.md`.

## parked (`persona:?`, one signal only)
- 45 lateral ideas with sources in `docs/IDEAS.md` (4 Nov); the five ranked there go to Pavol as signature proposals.
- Landscapes from elevation tiles (Terrarium / USGS / LOLA). Nobody does it; no persona yet.
- Text-only `.txt` stereogram for geocachers (CacheSleuth precedent; Czech cache GC1NT7W).
- Three-version export (parallel / cross / depth map) per Young Rival.
- Decoder beside the generator; "a picture your AI cannot read" demo (Edwardsson 2026).
- Dual-scene and animated stereograms (TU Wien 1996; re-randomise per frame).
- Physical export (knit, weave, laser).
- Animated stereograms. No persona yet.
- Czech UI. No Czech query signal yet.

## done
- 2026-11-04 See page: "one in twenty" → "about one adult in fourteen" (Chopin, Bavelier & Levi 2019). Trust fix.
- 2026-11-04 scaffold: generator, guide, kit, journeys P1–P6, deploy wiring.
