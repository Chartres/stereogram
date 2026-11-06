# Founder cases — known answers a release must still give

Asserted by `src/domain/founder-cases.test.ts` in CI. A case changes only with a line in `docs/DECISIONS.md`.

| # | Question (as a person would ask it) | Known answer | Tolerance |
|---|---|---|---|
| 1 | What are the defaults? | Thimbleby–Inglis–Witten 1994: E = 180 px, μ = ⅓; far-plane strip 90 px, near plane 72 px | exact |
| 2 | Does the default sphere, seed 1994, look the same on every machine? | Yes — row 0 starts `0001101001000010` (black = 1) at 240 px wide | exact |
| 3 | On the A4 preset, does the background repeat strictly? | Yes — every pixel equals the one 200 px to its right (E = 600) | exact |
| 4 | What does a bare link open? | The landing picture, the Discobolus in an Iznik tile panel, with all defaults | exact |
