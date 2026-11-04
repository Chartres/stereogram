// Single-image stereogram renderer after Thimbleby, Inglis & Witten, "Displaying 3D Images:
// Algorithms for Single-Image Random-Dot Stereograms", IEEE Computer 27(10), 1994.
// Per row: link pixels that must share a colour (`same`), with hidden-surface removal, then
// paint right-to-left. Pure: takes a DepthMap, returns RGBA pixels. No DOM.
import { invertDepth, type DepthMap, type Rgba } from './depth'
import { fitTile } from './pattern'
import { mulberry32 } from './prng'

export type ViewMode = 'parallel' | 'cross'

export type PatternSpec =
  | { kind: 'dots'; density?: number } // black dots on white, density = share of black pixels
  | { kind: 'color' } // random colour per free pixel
  | { kind: 'tile'; tile: Rgba } // any picture, fitted to the far-plane strip width

export interface StereogramOptions {
  /** E — eye separation in output pixels (the far-plane strip repeats every separation(0) ≈ E/2). */
  eyeSeparation: number
  /** μ — depth of field; 1/3 in the paper. Larger = deeper relief, harder to fuse. */
  depthOfField?: number
  mode?: ViewMode
  /** Thimbleby's hidden-surface removal; off reproduces the naïve algorithm (echoes near edges). */
  hiddenSurface?: boolean
  seed: number
  pattern: PatternSpec
}

/** Stereo separation on screen for a point at depth z ∈ [0, 1] (eq. 1 in the paper, mu·z instead of z·mu for a near plane at z=1). */
export function separation(z: number, E: number, mu: number): number {
  return Math.round(((1 - mu * z) * E) / (2 - mu * z))
}

/** Link map for one row: same[x] = the pixel to the right that must share x's colour (or x itself). */
export function linkRow(z: Float32Array, E: number, mu: number, hiddenSurface: boolean): Int32Array {
  const maxX = z.length
  const same = new Int32Array(maxX)
  for (let x = 0; x < maxX; x++) same[x] = x
  for (let x = 0; x < maxX; x++) {
    const s = separation(z[x], E, mu)
    let left = x - (s >> 1)
    let right = left + s
    if (left < 0 || right >= maxX) continue
    let visible = true
    if (hiddenSurface) {
      let t = 1
      let zt: number
      do {
        zt = z[x] + (2 * (2 - mu * z[x]) * t) / (mu * E)
        visible = (x - t < 0 || z[x - t] < zt) && (x + t >= maxX || z[x + t] < zt)
        t++
      } while (visible && zt < 1)
    }
    if (!visible) continue
    let l = same[left]
    while (l !== left && l !== right) {
      if (l < right) {
        left = l
        l = same[left]
      } else {
        same[left] = right
        left = right
        l = same[left]
        right = l
      }
    }
    same[left] = right
  }
  return same
}

export function renderStereogram(depthIn: DepthMap, opts: StereogramOptions): Rgba {
  const mu = opts.depthOfField ?? 1 / 3
  const E = Math.max(8, Math.round(opts.eyeSeparation))
  const hidden = opts.hiddenSurface ?? true
  // Cross-eyed viewing reverses the disparity sign: the same picture reads inside-out, so we
  // invert the relief instead. ponytail: hidden-surface geometry then assumes the inverted scene.
  const depth = (opts.mode ?? 'parallel') === 'cross' ? invertDepth(depthIn) : depthIn
  const { width, height } = depth
  const out = new Uint8ClampedArray(width * height * 4)
  const rnd = mulberry32(opts.seed)
  const far = separation(0, E, mu)
  const tile = opts.pattern.kind === 'tile' ? fitTile(opts.pattern.tile, far) : null
  const density = opts.pattern.kind === 'dots' ? (opts.pattern.density ?? 0.5) : 0.5

  const row = new Float32Array(width)
  for (let y = 0; y < height; y++) {
    row.set(depth.data.subarray(y * width, (y + 1) * width))
    const same = linkRow(row, E, mu, hidden)
    const base = y * width * 4
    for (let x = width - 1; x >= 0; x--) {
      const o = base + x * 4
      if (same[x] === x) {
        if (tile) {
          const tx = x % tile.width
          const ty = y % tile.height
          const s = (ty * tile.width + tx) * 4
          out[o] = tile.data[s]
          out[o + 1] = tile.data[s + 1]
          out[o + 2] = tile.data[s + 2]
        } else if (opts.pattern.kind === 'color') {
          out[o] = Math.floor(rnd() * 256)
          out[o + 1] = Math.floor(rnd() * 256)
          out[o + 2] = Math.floor(rnd() * 256)
        } else {
          const v = rnd() < density ? 0 : 255
          out[o] = v
          out[o + 1] = v
          out[o + 2] = v
        }
      } else {
        const p = base + same[x] * 4
        out[o] = out[p]
        out[o + 1] = out[p + 1]
        out[o + 2] = out[p + 2]
      }
      out[o + 3] = 255
    }
  }
  return { width, height, data: out }
}

/** Where the two helper dots go: centred, one far-plane separation apart. Fuse them into three and the picture appears. */
export function helperDots(width: number, E: number, mu: number): { left: number; right: number } {
  const far = separation(0, E, mu)
  return { left: Math.round(width / 2 - far / 2), right: Math.round(width / 2 + far / 2) }
}
