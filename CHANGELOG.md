# Changelog

## 0.5.0 — 2026-11-07

Patterns that work. Every tile is now checked against what a stereogram needs (docs/PATTERNS.md):
texture everywhere, brightness contrast, detail across the rows, no repeat inside the strip. The
check removed 18 of 60 museum tiles (samplers and stencils on blank paper, a striped band, a
low-contrast pomegranate) and fixed four procedural ones: the Hex Truchet now has two columns of
hexagons per tile with toned grounds, modrotlač scatters its sprigs, pebbles leave no bare ground,
weave is gone. New: a pen-drawing tile, ballpoint lines on paper. Procedural tiles are drawn at
the strip's real width, so they stay crisp at print size. CI runs the check on every tile.

## 0.4.3 — 2026-11-06

From Pavol's desktop pass: the page opens on the Discobolus hidden in an Iznik tile panel; the
navigation sits at the top on desktops (bottom on phones); the figure and pattern strips have
arrows for a mouse; the depth test's card step says how to hold the card and, on phones, measures
its short side upright, because the long side does not fit; the drawing brush starts smaller.

## 0.4.2 — 2026-11-05

Link cards that show a stereogram. The site's card is the Discobolus hidden in an Iznik tile
panel, with the name on a centred band that survives the square crop of iMessage and
WhatsApp; it is a 271 KB JPEG. Every book plate has its own page, /plate/<n>/, with the plate
itself as its card, rendered at build by the app's own renderer; the book's Share links there.
The sitemap lists all 100 plates. Two mount-crop tiles that a bake had fetched back are out
again, and the bake now refuses removed tiles.

## 0.4.1 — 2026-11-05

On phones the main button is now "Share picture": the system share sheet with the PNG itself
(save to Photos, Messages, WhatsApp, AirDrop, print), the link in the text. Download stays one
tap away as an icon, and is still the main button where the browser cannot share files. The
book's share icon uses the same sheet for a plate's link.

## 0.4.0 — 2026-11-04

Book, See and the depth test take the Make page's shape (one slab, icon actions, reading folded
under rows, the ladder leads the See page). Every figure is lifted off the page (its farthest
point at 47 % depth, not 16 %) so the silhouette is a clear step; every tile is levelled and
seamed (edges cross-faded, bottom half mirrored) so rows no longer show joins; 32 floral tiles
from The Met (chintz, palampore, brocade, kimono, embroidery); a hexagonal Truchet tile from
Pavol's Truchet Studio (the C + X matching in six orientations, two bands).

## 0.3.1 — 2026-11-04

The Make page as an app, from Pavol's phone pass: the picture, one Download slab, five icon
actions, visual strips for figures, shapes and patterns (you see what you pick; the figure strip
opens on Discobolus, the elephant, the labyrinth), fine-tuning folded under one row. Hidden text
is heavy, wide and wraps into lines so letters stay taller than a strip.

## 0.3.0 — 2026-11-04

Seven more signature moves Pavol picked the same evening: Comenius's spectacles (a plate that
inverts between parallel and crossed viewing), the printed plate with its colophon on a Van de
Graaf page, the relief shelf (SMK plaster casts, public domain; Smithsonian Open Access reliefs
and busts, CC0), "How fine can you see depth" (a stereoacuity measurement that prints its own
pixel floor and the 4.3× retest band, nothing stored or shared), the modrotlač tile, the
Chartres labyrinth as a figure, and the Public Domain Day release (a scheduled task every
1 January). The book's pairing of figures and patterns is now a seeded walk.

## 0.2.0 — 2026-11-04

The three signature moves (docs/SIGNATURE.md, approved by Pavol the same evening):
the museum's hidden figures (26 CC0 sculptures from Poly Haven baked to depth maps, 36
ornament tiles from The Met's Open Access collection, each picture printing its provenance),
a book of 100 plates at `#/book`, and the patient eye, a six-step viewing course on the See
page with the shimmer aid from Thimbleby, Inglis and Witten (1993). Landscape research in
flywheel `docs/discovery/stereogram-landscape.md`. Stereoblindness figure corrected to about
one adult in fourteen (Chopin, Bavelier and Levi, 2019).

## 0.1.0 — 2026-11-04

First release. Stereograms from shapes, text, a drawing or an uploaded depth map; random dots,
colour dots, procedural tiles or your own pattern; Thimbleby–Inglis–Witten renderer with
hidden-surface removal in a Web Worker; parallel and cross-eyed viewing; helper dots; five size
presets up to A4 at 300 dpi; PNG download, copy, shareable links; a guide on how to see it.
