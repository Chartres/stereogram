# Stereogram

Free stereogram (Magic Eye) generator in the browser: shapes, text, a drawing or your own depth
map; random dots or a pattern; print-size PNG; no account. Nothing is uploaded and the page works
offline once loaded.

**Live:** https://stereogram.dravec.org

## What it does

- 26 real sculptures (Poly Haven, CC0) as hidden figures and 36 ornament tiles from The Met's Open Access collection as backgrounds; every picture prints where both came from. A book of 100 plates at `#/book`, and a six-step viewing course on the See page.

- Depth from eight built-in shapes, hidden text, a soft-brush drawing, or any greyscale picture
  (white is near; invert if your map is the other way round; smooth the edges of 8-bit maps).
- Patterns: black-and-white random dots with adjustable density, colour dots, three procedural
  tiles, or a picture of your own, fitted to the strip width.
- The renderer is Thimbleby, Inglis & Witten's 1994 algorithm with their hidden-surface removal;
  eye separation and depth of field are the paper's parameters, exposed as sliders. Parallel or
  cross-eyed viewing, helper dots, and a "show the depth map" toggle.
- Sizes: the screen you are looking at (1:1), 1080p, phone wallpaper, square, A4 at 300 dpi.
  Rendering runs in a Web Worker so an A4 print never freezes the page.
- Reproducible: a seed and a shareable link give the same picture pixel for pixel.
- A plain guide on how to see one, including the honest note that about one person in twenty cannot.

## Develop

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # unit + founder cases + contrast gate
npm run build && npm run e2e
```

`AGENTS.md` is the full build/test/release contract. Feedback from the app goes to the shared
flywheel inbox; issues are welcome here too.

## Licence

MIT.
