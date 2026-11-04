# Stereogram — signature

The part of Stereogram that could only have come from Pavol. Standard: flywheel
`docs/standards/signature.md`. Nothing in "Signature moves" is built before Pavol has picked it.
Landscape: flywheel `docs/discovery/stereogram-landscape.md` (4 Nov 2026).

## Lineage

| Source | Year | changes: |
|---|---|---|
| Charles Wheatstone, *Contributions to the Physiology of Vision* ([link](https://stereosite.com/collecting/the-birth-of-stereoscopy-wheatstone-on-binocular-vision-1838-original-source/)) | 1838 | "Requires practice": the product treats viewing as a skill learned in stages, not a trick that works or fails. |
| London Stereoscopic Company, "A Stereoscope in Every Home" ([link](https://blog.scienceandmediamuseum.org.uk/a-z-photography-l-is-for-london-stereoscopic-company/)) | 1862 | The only mass stereo hobby was a device plus a curated library of plates; the gallery is a book of plates, not a preset grid. |
| Béla Julesz, random-dot stereograms; Tyler's NAS memoir ([link](https://www.nasonline.org/wp-content/uploads/2024/06/julesz-bela.pdf)) | 1959 / 1971 | Random dots stay the default pattern; the gallery tells the Dalí-halo story, the first religious-art use of a hidden figure. |
| Thimbleby, Inglis & Witten, Waikato working paper and IEEE Computer ([link](https://researchcommons.waikato.ac.nz/entities/publication/fe29dad1-8f21-48be-beee-2b6bd3b8a708)) | 1993 / 1994 | The renderer verbatim; their proposed on-screen shimmer becomes the course's screen-only aid. |
| Lancashire NHS orthoptics, home stereogram exercises ([link](https://www.lancsteachinghospitals.nhs.uk//media/.leaflets/6554e16b48a483.99772925.pdf)) | current | The staged sequence (cat, bucket, ABC/123, relax step) is the ladder's shape. |
| Hans Holbein, *The Ambassadors* ([link](https://www.printmag.com/3d-visualization/holbein-to-niemann-a-500-year-old-marvel-lives/)) | 1533 | "Find the angle": the found moment is a reward for patience; every plate carries that line. |
| Met Open Access: katagami stencils, William Morris, Iznik, *The Grammar of Ornament* ([link](https://metmuseum.github.io/)) | 19th c. and earlier | Backgrounds are real ornament with provenance, the Breedon "magic carpet" reading of the tile. |
| Santiago Ramón y Cajal, paired random-mark messages ([link](https://pmc.ncbi.nlm.nih.gov/articles/PMC12035379/)) | c. 1870 | The hidden message for one person ("Cajal's letter") has a precedent eighty years before Julesz. |
| Maria Montessori, control of error ([link](https://digital.library.upenn.edu/women/montessori/method/method.html)) | 1912 | The viewer marks their own "seen it"; nothing verifies, scores or nags. |

## Refused

- No on-device AI depth estimation as the product (Owl3D and Tembrica ship a 28–50 MB model and become the same product). Users bring depth maps from Blender, portrait mode or their own tools; the page stays deterministic (§6c).
- No watermark, no upsell, no account, no gallery of uploads to a server.
- No "Magic Eye" in the name: a live trademark of Magic Eye Inc. Descriptive use in copy only.
- No eye-exercise claims beyond what the Latvia 2013 thesis supports; the course links an orthoptist.
- No streaks or badges around seeing it. About 7 % of adults cannot (Chopin et al. 2019); the page says so and shows the depth map in one tap.
- No toy look. One picture on paper, a caption, two dots.

## Signature moves

| Move | What the user sees | From | Metric | Status |
|---|---|---|---|---|
| The museum's hidden figures | A shape picker of ~50 real sculptures (bronze ray, marble bust, gothic statue, Smithsonian casts, Kenney animals) and ~40 patterns (katagami, Morris, Iznik, Grammar of Ornament, fabric, bark, in-house tilings), each with a provenance line that prints under the picture. | Met Open Access, Smithsonian, Poly Haven; *ad fontes* | `key_action` action=`pick_figure` / `pick_pattern` with the asset id | approved 2026-11-04 |
| A book of plates | `#/book`: ~100 pre-generated plates at deploy time, paged like a book, one plate per screen with a caption, a "find the angle" line, a one-tap answer and "make your own from this plate". Share-a-guess links carry parameters only. | London Stereoscopic Company 1862; the Magic Eye books; Holbein | `key_action` action=`plate_open`, `plate_answer`; `conversion` via=`book` | approved 2026-11-04 |
| The patient eye | A six-step course on the See page: shallow wide sphere → bucket-like block → letters → the default → a plate from the book → a drawn one; a relax step between; shimmer toggle; the viewer marks "seen it" themself; the last rung says the 7 % figure. | Wheatstone 1838; NHS orthoptics; Thimbleby 1993; Montessori | `key_action` action=`ladder_step`; `conversion` via=`ladder` | approved 2026-11-04 |
| Comenius's spectacles | One plate on the See page whose depth inverts between parallel and crossed viewing, with Delusion's spectacles from *Labyrinth of the World* ch. IV as the caption. | Comenius 1623 | `key_action` action=`spectacles_open` | live 2026-11-04 |
| Advent Jesse book and the Mikuláš plate | 24 printable plates, one Jesse-tree symbol a day from 29 Nov, no streak; a 5 Dec plate where parallel brings the angel forward and crossed the čert. | Vyšehrad Codex c. 1085; the Czech Mikuláš | `key_action` action=`plate_open` (advent ids) | proposed; Pavol passed on 4 Nov |
| Colophon on a Van de Graaf page | The PDF plate: 2:3 page, margins 2:3:4:6, the picture in the type area, renderer, seed, sources and licence in the foot margin. | Tschichold; private-press colophons | `key_action` action=`print_plate` | live 2026-11-04 |
| Relief shelf | SMK plaster casts (public domain, binary STL from api.smk.dk) and Smithsonian Open Access reliefs and busts (CC0 GLB from 3d-api.si.edu) as figures; Cleveland's CC0 reliefs stay on the list until a Sketchfab login exists. | SMK; Smithsonian Open Access | `key_action` action=`pick_figure` | live 2026-11-04 |
| How fine can you see depth | `#/depth`: a bank card calibrates the screen, the blind spot gives the distance, a random-dot pair and a 1-up/2-down staircase give the threshold; the result prints the pixel floor and the 4.3× band and sends nothing but "finished". | Julesz 1960; ASTEROID (2019); UW virtual chinrest (2020) | `key_action` action=`acuity_done` | live 2026-11-04 |
| Modrotlač | A blueprint tile: white sprigs and dots on indigo, redrawn in-house (ÚĽUV images unlicensed), with the UNESCO line as provenance; later the carved printing block as a relief. | Blueprint resist printing, UNESCO 2018 (CZ/SK/AT/DE/HU) | `key_action` action=`pick_pattern` id=modrotlac | live 2026-11-04 |
| The Chartres path | The 11-circuit labyrinth as a figure, path raised and walls sunk, with its provenance; the owner's own name. | Chartres cathedral, c. 1200 | `key_action` action=`pick_figure` id=chartres | live 2026-11-04 |
| Public Domain Day | Every 1 January the book gains plates from authors who died 70 years before; the first on 1 Jan 2027 (deaths of 1956); Lada's cut-out Nativity on 1 Jan 2028. | Public Domain Day | `key_action` action=`plate_open` (pdd ids) | live 2026-11-04 (scheduled task trig_018rAAkwS7wK66U53J2pdBxM) |
| Landscapes from the Earth and the Moon | Hidden reliefs from public-domain elevation tiles: Grand Canyon, Etna, Tatras, Tycho crater. | USGS 3DEP / SRTM, LRO LOLA | `key_action` action=`pick_figure` (landscape ids) | proposed, later |

Status: `proposed` → `approved` (dated) → `live` → or `changed` / `reverted`.

### Proposal: which to build first

- **Option A — Library + book (moves 1 and 2 together).** A build-time pipeline bakes ~50 depth
  PNGs (Poly Haven, Smithsonian, Kenney, Met scans; CC0, ~3 MB) and ~40 pattern tiles (Met Open
  Access, ambientCG, in-house tilings; ~6 MB lazy-loaded) with a `provenance.json`; the same
  pipeline renders ~100 plates for `#/book`. Cost: one evening of agent time, no runtime library,
  no new dependency beyond a Node bake script. Serves the new anchor persona (looks first, makes
  second) and P1–P3. Risk: licence hygiene per asset; the pipeline keeps the credit line with
  each file and the CI asserts every shipped asset has one.
- **Option B — The patient eye first.** The course on the See page, ~150 lines, one journey. Serves
  P4 and the honest note. Cheaper, but on its own it leaves the product looking like Owl3D with
  fewer scenes.
- **Option C — All three in one push.** Library, book, course; about two evenings. Highest
  chance the soft-launch gate ("one approved move live and measured") is passed with something
  nobody else has.
- **Recommendation:** A now, then B as the next sprint. The library is what §6c calls `data`
  and is the only thing in this market a user's own model cannot produce from a prompt; the
  book is its storefront; the course is the method that follows once there is something worth
  looking at.

## Visual signature

A page from a Magic Eye book on paper: one picture, a caption with its provenance, two dots
above it, a book serif. The picture is the only thing with colour besides the two dots. Patterns
are ornament, not neon.

## Founder lens

Constitution articles that bind it (by number only): II, III, VI, VIII. The differentiation that
follows: real sculpture and real ornament with their sources, a viewing course from orthoptists
and Wheatstone rather than Easy/Normal/Hard, a book instead of a grid, the truth about who cannot
see it, no AI-depth headline, no watermark, no trademark borrowed.

## Decision log

| Date | Options shown | Pavol chose | Note |
|---|---|---|---|
| 2026-11-04 | first proposal: patient eye / from the paper / message card | — | superseded the same evening by the landscape research |
| 2026-11-04 | A library + book / B course first / C all three | **C, all three**, 50-minute box | "Great, all three please" (21:06 CET) |
| 2026-11-04 | five ranked moves from the lateral sweep (`docs/IDEAS.md`) + the long list | **1, 3, 4, 5, modrotlač, the Chartres labyrinth, Public Domain Day**; passed on 2 (Advent) | "I like 1345, modrotlač, Chartres labyrinth, and the public domain day" (21:46 CET) |
