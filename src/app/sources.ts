// Depth sources that need a canvas: text, uploaded pictures, pattern tiles. The pure
// conversion lives in src/domain/depth.ts; this file only produces Rgba from the DOM.
import type { DepthMap, Rgba } from '@/domain/depth'
import { depthFromRgba } from '@/domain/depth'

function canvas2d(width: number, height: number) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('canvas 2d unavailable')
  return { c, ctx }
}

/** White text on black as a depth map. Heavy, wide letters, wrapped into lines so each line fills
 * the width: a stereogram reads letters only when they are taller than a strip (~90 px). */
export function textDepth(text: string, width: number, height: number): DepthMap {
  const { c, ctx } = canvas2d(width, height)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  const words = text.trim().split(/\s+/).filter(Boolean)
  const font = (s: number) => `900 ${s}px 'Arial Black', Impact, 'Helvetica Neue', Arial, sans-serif`
  const maxW = width * 0.88
  // try 1..3 lines; keep the layout with the largest letters
  let best: { size: number; lines: string[] } = { size: 0, lines: [text.trim() || ' '] }
  for (let n = 1; n <= Math.min(3, Math.max(1, words.length)); n++) {
    const per = Math.ceil(words.length / n)
    const lines: string[] = []
    for (let i = 0; i < words.length; i += per) lines.push(words.slice(i, i + per).join(' '))
    if (!lines.length) lines.push(' ')
    let size = Math.floor((height * 0.8) / lines.length / 1.05)
    ctx.font = font(size)
    ctx.letterSpacing = '0.04em'
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
    if (widest > maxW) size = Math.floor((size * maxW) / widest)
    if (size > best.size) best = { size, lines }
  }
  ctx.font = font(best.size)
  ctx.letterSpacing = '0.04em'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  const lineH = best.size * 1.05
  const top = height / 2 - ((best.lines.length - 1) * lineH) / 2
  best.lines.forEach((l, i) => ctx.fillText(l, width / 2, top + i * lineH))
  const img = ctx.getImageData(0, 0, c.width, c.height)
  return depthFromRgba({ width: img.width, height: img.height, data: img.data })
}

/** Decode a picture file, cover-fit into width × height (so a portrait map still fills a landscape page). */
export async function fileToRgba(file: Blob, width: number, height: number): Promise<Rgba> {
  const bmp = await createImageBitmap(file)
  const { c, ctx } = canvas2d(width, height)
  const scale = Math.max(width / bmp.width, height / bmp.height)
  const w = bmp.width * scale
  const h = bmp.height * scale
  ctx.drawImage(bmp, (width - w) / 2, (height - h) / 2, w, h)
  bmp.close()
  const img = ctx.getImageData(0, 0, c.width, c.height)
  return { width: img.width, height: img.height, data: img.data }
}

/** A pattern tile at its own size, capped at 512 px wide (it is refitted to the strip width when rendering). */
export async function fileToTile(file: Blob): Promise<Rgba> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 512 / bmp.width)
  const w = Math.max(1, Math.round(bmp.width * scale))
  const h = Math.max(1, Math.round(bmp.height * scale))
  const { c, ctx } = canvas2d(w, h)
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  const img = ctx.getImageData(0, 0, c.width, c.height)
  return { width: img.width, height: img.height, data: img.data }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}
