# Stereogram — design

Invariants come from the hub: `flywheel/docs/standards/taste.md` (four type steps, contrast floors
measured from tokens, accent twice per screen, filled fields, three gaps) and `mobile-ux.md` (44 px
targets, bottom nav, picture above the fold at 390). This file records what is this product's own.

## Identity

A print on paper. The stereogram is the only picture on the screen; everything else is type on
warm paper, the way a Magic Eye book page was: one image, a small caption, the two dots above it.
Display and titles in a book serif (Iowan Old Style / Palatino stack, no web font: offline, $0,
nothing fetched); labels and controls in the system sans. Calm, serious, no mascots, no gradients.

## Tokens (`src/tokens.css`; ratios computed by `src/design/contrast.test.ts`)

| token | hex | used for | floor |
|---|---|---|---|
| paper | #f4f1ea | page | — |
| paper-2 | #e8e3d7 | filled fields, canvas placeholder | — |
| ink | #1c1a17 | text, the pressed segment | 4.5 on paper, paper-2 |
| ink-soft | #5b564e | labels, captions | 4.5 on paper, paper-2 |
| accent | #0f5a63 | the one primary slab (Download), links, the helper dots on the picture, focus rule, active tab rule | 4.5 as text on paper; paper text on it 4.5; 3 as a rule on paper-2 |
| edge | #857d70 | control edges | 3 on paper |

Type: Display 28/32 (unused on Make; the See page heading), Title 20/26 (wordmark, Download, section
headings on See), Body 17/26, Label 13/18 uppercase tracked. Gaps 8 / 24 / 48.

## Screens

- **Make.** Wordmark + Feedback → the picture (1:1 CSS pixels for "This screen") → caption line with
  size, scale, and status → Download slab + three secondary buttons → sections: Scene, Pattern, Depth &
  viewing, Size, Options → one paragraph of provenance. At 390 wide the picture's top is under 160 px
  and Download is above the fold (P4 pins it).
- **How to see.** A book page: Display heading, numbered steps, an honest note, where it comes from.

## Signature element per screen

Make: the two helper dots in the accent, the only colour on the picture. See: the Display heading.
