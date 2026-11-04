# Stereogram — signature

The part of Stereogram that could only have come from Pavol. Standard: flywheel
`docs/standards/signature.md`. Nothing in "Signature moves" is built before Pavol has picked it.

## Lineage

| Source | Year | changes: |
|---|---|---|
| Charles Wheatstone, *Contributions to the Physiology of Vision* (the stereoscope) ([link](https://royalsocietypublishing.org/doi/10.1098/rstl.1838.0019)) | 1838 | The guide explains depth as the difference between two eyes, not as a trick of the picture. The "pair" export (Next) is Wheatstone's original device. |
| Béla Julesz, *Binocular depth perception of computer-generated patterns*, Bell System Technical Journal ([link](https://doi.org/10.1002/j.1538-7305.1960.tb03954.x)); *Foundations of Cyclopean Perception* (1971) | 1960 / 1971 | Random dots are the default pattern, not a decoration: Julesz showed the brain builds depth from pure noise with no recognisable picture in either eye. The default seed 1994 and dot density 50 % keep his conditions. |
| Christopher Tyler & Maureen Clarke, *The autostereogram*, SPIE 1256 ([link](https://doi.org/10.1117/12.19904)) | 1990 | One image instead of a pair; the helper dots are Tyler's fusion aid. |
| Harold Thimbleby, Stuart Inglis, Ian Witten, *Displaying 3D Images: Algorithms for Single-Image Random-Dot Stereograms*, IEEE Computer 27(10) ([link](https://doi.org/10.1109/2.318576)) | 1994 | The renderer is their algorithm verbatim, hidden-surface removal included; the sliders are their E and μ; the founder cases pin their numbers (90 / 72 px). |
| Hans Holbein, *The Ambassadors* (the anamorphic skull) ([link](https://www.nationalgallery.org.uk/paintings/hans-holbein-the-younger-the-ambassadors)) | 1533 | A picture that holds a second picture for the viewer who takes the right position: the hidden-text scene and the "message card" option below. |
| Maria Montessori, *The Montessori Method*, ch. on control of error ([link](https://digital.library.upenn.edu/women/montessori/method/method.html)) | 1912 | Option A below: the viewer teaches themself with a ladder of pictures that get harder, each one checkable without a teacher. |

## Refused

- No "AI depth from a photo" button. A user's own model can do that; the page stays deterministic (FLYWHEEL-STANDARD §6c).
- No account, no gallery, no upload to a server: the picture is made and kept on the viewer's device.
- No gamified streaks or badges around "seeing it". One person in twenty cannot, and the page says so plainly (constitution VIII).
- No purple-gradient, blob, emoji look. One picture on paper.

## Signature moves

| Move | What the user sees | From | Metric | Status |
|---|---|---|---|---|
| The patient eye | A ladder of six pictures on the See page, from a shallow wide relief to the default, each with its own helper dots and a "I saw it" mark the viewer sets themself. The ladder remembers where they got to (localStorage). | Julesz 1971; Montessori's control of error | `key_action` action=`ladder_step` (step n); `conversion` via=`ladder` | proposed |
| From the paper | A fold-out under the picture that shows the 1994 formula live: E, μ, separation(z) for the far and near planes, and the row-linking drawn for the row under the pointer. | Thimbleby, Inglis & Witten 1994; *ad fontes* | `key_action` action=`paper_open` | proposed |
| Message card | A text stereogram becomes a greeting: the link opens with the pattern, the hidden word, and a one-line note from the sender; a "print as A6 card" preset. | Holbein 1533; Wheatstone's parlour stereoscope cards | `key_action` action=`card_sent`; `conversion` via=`card` | proposed |

Status: `proposed` → `approved` (dated) → `live` → or `changed` / `reverted`.

### Proposal: the first move

- **Option A — The patient eye.** Six steps: μ 0.12 / E 220 wide and shallow with a sphere; then
  0.18; 0.25; 0.33 (the default); a text step; a drawn step. Each step has helper dots and a
  "Seen it" button; the next step unlocks only by the viewer's own say-so (control of error, no
  verification, no score). Cost: one new section on the See page, ~150 lines, one journey (P4 gains
  the ladder). Serves P4 (Eva, 12, has never seen one) and the one-in-twenty honestly: the last
  rung says "if nothing came after six, that's a real result".
- **Option B — From the paper.** A details fold-out with the two formulas and live numbers, and a
  200-px strip that draws the `same[]` links for the row under the cursor. Cost: ~120 lines, one
  component, no new journey. Serves P5 (Jonas, reproducibility) and anyone who wants to know why
  rather than just what.
- **Option C — Message card.** Adds a `note` param, a card layout for the link landing page, an A6
  print preset. Cost: ~200 lines, a new landing state, one journey (P1 gains the note). Serves P1
  (Marek). Reaches people the sender already knows (constitution VI).
- **Recommendation:** A. It is the one a generic generator never has, it comes straight from Julesz
  and Montessori, and it serves the youngest persona and the honest note at once. B is cheap and can
  follow as technical hygiene once A is approved; C is the distribution move for later.

## Visual signature

A page from a Magic Eye book on paper: one picture, a caption, two dots above it, a book serif. The
picture is the only thing with colour besides the two dots.

## Founder lens

Constitution articles that bind it (by number only): II, VI, VIII. The differentiation that follows:
a stereogram is a small evening thing to make with one's daughters (II), it travels by a link or a
printed sheet to people one already knows (VI), and it tells the viewer the truth about who can and
cannot see it (VIII). A tool, not a feed.

## Decision log

| Date | Options shown | Pavol chose | Note |
|---|---|---|---|
| 2026-11-04 | A / B / C above (first proposal, in the scaffold hand-back) | — | awaiting review |
