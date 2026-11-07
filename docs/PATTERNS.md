# What a pattern needs

A stereogram hides depth in how far apart the same detail repeats. The renderer copies the
pattern across the picture one far-plane strip at a time (90 px at the defaults), and shortens
the repeat wherever the figure is nearer. Your eyes fuse the picture by matching each bit of
detail with its copy one strip away; the distance between the matches is the depth.

So a pattern works when every part of it can be matched, and matched only once. In practice:

1. **Texture everywhere.** A flat patch (blank paper, solid ground, a single colour) has
   nothing to match. Its depth is undefined, and where the figure crosses it the picture shows
   white smears instead of a shape. A plain single-colour pattern cannot work at all.
2. **Brightness contrast.** Depth from two eyes runs mostly on light and dark. Two colours of
   the same brightness, red against green say, look different but fuse poorly.
3. **Detail across the rows.** Depth is measured along each row, so only edges that cross a
   row (upright or slanted) carry it. A pattern of horizontal stripes gives nothing to measure.
4. **No repeat inside the strip.** If the pattern repeats itself every few pixels, the eyes can
   match the wrong copy and the figure snaps to a false depth: Brewster's "wallpaper effect"
   (1844). The renderer supplies the one repeat that is allowed, the strip itself.
5. **The right scale.** Detail is judged per strip, not per pixel: about the size of a grain
   of rice at arm's length on a phone. Much coarser and small features of the figure are lost;
   much finer and it aliases on screens and blurs in print.
6. **Seamless edges.** The tile repeats across and down, so its left edge must meet its right
   and its top its bottom, or every row shows a join.

Random dots meet all six by construction, which is why Julesz used them in 1959.

## How the app enforces it

`src/domain/tileQuality.ts` measures the first four on each tile at the default strip width:
the share of flat 7 × 7 neighbourhoods (limit 12 %), brightness contrast (standard deviation
≥ 0.12), the share of gradient energy across the rows (≥ 0.3) and the strongest self-repeat of
each row inside the strip (autocorrelation ≤ 0.6). `src/library/tiles.quality.test.ts` runs it
on every museum tile in the library and `src/domain/tileQuality.test.ts` on every procedural
tile at four strip widths and three seeds, so CI fails before a bad tile reaches a phone.
Scale and seams are handled by the bake (`scripts/seam-tiles.mjs`) and by drawing procedural
tiles at the strip's real width.

On 7 Nov 2026 the check removed 18 of 60 museum tiles: samplers and stencils on blank paper,
Morris's Jasmine on a plain ground, a striped Coptic band, a low-contrast pomegranate. The
procedural Truchet, weave and modrotlač tiles failed rule 4 and the pebbles rule 1; Truchet now
uses two columns of hexagons per tile with toned grounds (from Pavol's Truchet Studio "Fill"
mode), modrotlač scatters its sprigs, weave is gone, and a pen-drawing tile was added.
