import type { Params } from '@/domain/params'
import { encodeParams, isShareable } from '@/domain/params'
import { figureById, patternById } from '@/library'

// The printed plate on a Van de Graaf page: type area two thirds of the page, margins
// inner : top : outer : bottom = 2 : 3 : 4 : 6 (Tschichold's reading of the medieval canon).
// Only visible when printing; the colophon in the foot margin makes the plate reproducible.
export function PrintPlate({ src, params, title }: { src: string | null; params: Params; title: string }) {
  if (!src) return null
  const fig = params.scene.kind === 'figure' ? figureById(params.scene.id) : null
  const pat = params.pattern.startsWith('lib:') ? patternById(params.pattern.slice(4)) : null
  const link = isShareable(params) ? `https://stereogram.dravec.org/?${encodeParams(params)}` : null
  const date = new Date().toISOString().slice(0, 10)
  return (
    <div className="print-plate" data-testid="print-plate" aria-hidden="true">
      <style>{`
        .print-plate { display: none; }
        @media print {
          @page { size: A4 portrait; margin: 33mm 46.7mm 66mm 23.3mm; }
          body > #root > :not(.print-plate), nav, header { display: none !important; }
          .print-plate { display: block; font-family: 'Iowan Old Style', Palatino, Georgia, serif; color: #1c1a17; }
          .print-plate img { display: block; width: 100%; height: auto; image-rendering: pixelated; }
          .print-plate h1 { font-size: 14pt; font-weight: 400; margin: 0 0 6pt; }
          .print-plate .colophon { position: fixed; bottom: -58mm; left: 0; width: 100%; font-size: 8.5pt; line-height: 12pt; }
          .print-plate .colophon p { margin: 0; }
        }
      `}</style>
      <h1>{title}</h1>
      <img src={src} alt="" />
      <div className="colophon">
        <p>
          {fig ? `Figure: ${fig.credit}. ` : ''}
          {pat ? `Pattern: ${pat.credit}. ` : ''}
          Rendered with the single-image stereogram algorithm of Thimbleby, Inglis and Witten (IEEE Computer, 1994), hidden surfaces
          {params.hiddenSurface ? ' removed' : ' kept'}; eye separation {params.eyeSeparation} px, depth of field {params.depth.toFixed(2)},
          {params.mode === 'cross' ? ' for crossed eyes' : ' for parallel viewing'}; seed {params.seed}; {params.width} × {params.height} px.
        </p>
        <p>
          Made at stereogram.dravec.org on {date}. {link ? `This plate again: ${link}` : 'Made from a drawing or an upload; it has no link.'}
          {' '}The figure and the pattern are CC0 where so marked; this plate may be copied freely.
        </p>
      </div>
    </div>
  )
}
