#!/usr/bin/env node
// Bake the library: CC0 sculptures (Poly Haven glTF) → 8-bit depth PNGs, and Met Open Access
// ornament → 512 px pattern tiles. Writes public/library/** and src/library/provenance.json.
// Run: node scripts/bake-library.mjs [--figures-only|--patterns-only]. Idempotent; skips existing files.
// Licences: Poly Haven CC0 (https://polyhaven.com/license); Met Open Access CC0 (isPublicDomain only).
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs'
import sharp from 'sharp'

const SIZE = 512
const OUT_F = 'public/library/figures'
const OUT_P = 'public/library/patterns'
const PROV = 'src/library/provenance.json'
mkdirSync(OUT_F, { recursive: true })
mkdirSync(OUT_P, { recursive: true })

// id → yaw in degrees (rotation about the vertical axis before the orthographic front view), pitch
const FIGURES = {
  bronze_ray_statue: [0, 30, 'Bronze ray statue'],
  bronze_whale_statue: [90, 10, 'Bronze whale statue'],
  bronze_shark_statue: [90, 10, 'Bronze shark statue'],
  carved_wooden_elephant: [90, 10, 'Carved wooden elephant'],
  concrete_cat_statue: [20, 10, 'Concrete cat statue'],
  gothic_statue: [0, 0, 'Gothic statue'],
  horse_head: [60, 0, 'Horse head'],
  horse_statue_01: [90, 5, 'Horse statue'],
  marble_bust_01: [0, 0, 'Marble bust'],
  bull_head: [0, 0, 'Bull head'],
  lion_head: [0, 0, 'Lion head'],
  lambis_shell: [0, 60, 'Lambis shell'],
  rubber_duck_toy: [90, 10, 'Rubber duck'],
  chess_set: [0, 60, 'Chess set'],
  antique_ceramic_vase_01: [0, 0, 'Antique ceramic vase'],
  brass_vase_01: [0, 0, 'Brass vase'],
  jug_01: [0, 0, 'Jug'],
  food_apple_01: [0, 20, 'Apple'],
  food_pears_asian_01: [0, 20, 'Asian pears'],
  fishermans_hat: [0, 40, "Fisherman's hat"],
  rubber_boots: [90, 10, 'Rubber boots'],
  seadogs_compass: [0, 80, "Sea dog's compass"],
  wooden_bowl_01: [0, 50, 'Wooden bowl'],
  dandelion_01: [0, 0, 'Dandelion'],
  hatchet: [90, 90, 'Hatchet'],
  cross_pein_hammer: [90, 90, 'Cross-pein hammer'],
}

// query → how many; the Met's full-text search is loose, so each hit is checked for isPublicDomain + an image
const PATTERNS = [
  ['katagami', 6, 'katagami'],
  ['stencil Japan Edo', 4, 'katagami'],
  ['William Morris wallpaper', 6, 'morris'],
  ['Iznik tile', 4, 'iznik'],
  ['Grammar of Ornament', 6, 'ornament'],
  ['wallpaper 18th century', 4, 'wallpaper'],
  ['Ottoman textile fragment', 4, 'ottoman'],
  ['Coptic textile', 3, 'coptic'],
]

const only = process.argv[2]
const prov = existsSync(PROV) ? JSON.parse(readFileSync(PROV, 'utf8')) : { figures: [], patterns: [] }

async function json(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}

// ---------- glTF → depth ----------
const CTYPE = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }

function accessor(g, bins, i) {
  const a = g.accessors[i]
  const bv = g.bufferViews[a.bufferView]
  const T = CTYPE[a.componentType]
  const n = NCOMP[a.type]
  const stride = bv.byteStride || n * T.BYTES_PER_ELEMENT
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0)
  const buf = bins[bv.buffer]
  const out = new T(a.count * n)
  for (let k = 0; k < a.count; k++) {
    const view = new T(buf, base + k * stride, n)
    out.set(view, k * n)
  }
  return { data: out, n }
}

function mat4mul(a, b) {
  const o = new Array(16).fill(0)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]
  return o
}
function trs(node) {
  if (node.matrix) return node.matrix
  const [tx, ty, tz] = node.translation || [0, 0, 0]
  const [qx, qy, qz, qw] = node.rotation || [0, 0, 0, 1]
  const [sx, sy, sz] = node.scale || [1, 1, 1]
  const xx = qx * qx, yy = qy * qy, zz = qz * qz, xy = qx * qy, xz = qx * qz, yz = qy * qz, wx = qw * qx, wy = qw * qy, wz = qw * qz
  return [
    (1 - 2 * (yy + zz)) * sx, 2 * (xy + wz) * sx, 2 * (xz - wy) * sx, 0,
    2 * (xy - wz) * sy, (1 - 2 * (xx + zz)) * sy, 2 * (yz + wx) * sy, 0,
    2 * (xz + wy) * sz, 2 * (yz - wx) * sz, (1 - 2 * (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ]
}
function apply(m, x, y, z) {
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]
}

/** All world-space triangles of the scene. */
function triangles(g, bins) {
  const tris = []
  const visit = (ni, parent) => {
    const node = g.nodes[ni]
    const world = mat4mul(parent, trs(node))
    if (node.mesh != null)
      for (const p of g.meshes[node.mesh].primitives) {
        if ((p.mode ?? 4) !== 4) continue
        const pos = accessor(g, bins, p.attributes.POSITION)
        const idx = p.indices != null ? accessor(g, bins, p.indices).data : Uint32Array.from({ length: pos.data.length / 3 }, (_, i) => i)
        const v = []
        for (let i = 0; i < pos.data.length; i += 3) v.push(apply(world, pos.data[i], pos.data[i + 1], pos.data[i + 2]))
        for (let i = 0; i + 2 < idx.length; i += 3) tris.push([v[idx[i]], v[idx[i + 1]], v[idx[i + 2]]])
      }
    for (const c of node.children || []) visit(c, world)
  }
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  for (const n of (g.scenes?.[g.scene ?? 0]?.nodes) ?? g.nodes.map((_, i) => i)) visit(n, I)
  return tris
}

/** Orthographic front view after yaw (about Y) and pitch (about X); nearest = 255, background = 0. */
function rasterize(tris, yaw, pitch) {
  const cy = Math.cos((yaw * Math.PI) / 180), sy = Math.sin((yaw * Math.PI) / 180)
  const cp = Math.cos((pitch * Math.PI) / 180), sp = Math.sin((pitch * Math.PI) / 180)
  const rot = ([x, y, z]) => {
    const x1 = cy * x + sy * z, z1 = -sy * x + cy * z
    const y2 = cp * y - sp * z1, z2 = sp * y + cp * z1
    return [x1, y2, z2]
  }
  const T = tris.map((t) => t.map(rot))
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const t of T) for (const [x, y, z] of t) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z)
  }
  const span = Math.max(maxX - minX, maxY - minY)
  const pad = 0.06
  const s = (SIZE * (1 - 2 * pad)) / span
  const ox = SIZE / 2 - ((minX + maxX) / 2) * s
  const oy = SIZE / 2 + ((minY + maxY) / 2) * s
  const zbuf = new Float32Array(SIZE * SIZE).fill(-Infinity)
  for (const t of T) {
    const p = t.map(([x, y, z]) => [x * s + ox, oy - y * s, z])
    const x0 = Math.max(0, Math.floor(Math.min(p[0][0], p[1][0], p[2][0]))), x1 = Math.min(SIZE - 1, Math.ceil(Math.max(p[0][0], p[1][0], p[2][0])))
    const y0 = Math.max(0, Math.floor(Math.min(p[0][1], p[1][1], p[2][1]))), y1 = Math.min(SIZE - 1, Math.ceil(Math.max(p[0][1], p[1][1], p[2][1])))
    const [ax, ay, az] = p[0], [bx, by, bz] = p[1], [cx, cy2, cz] = p[2]
    const det = (bx - ax) * (cy2 - ay) - (cx - ax) * (by - ay)
    if (Math.abs(det) < 1e-9) continue
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5
        const l1 = ((bx - px) * (cy2 - py) - (cx - px) * (by - py)) / det
        const l2 = ((cx - px) * (ay - py) - (ax - px) * (cy2 - py)) / det
        const l3 = 1 - l1 - l2
        if (l1 < 0 || l2 < 0 || l3 < 0) continue
        const z = l1 * az + l2 * bz + l3 * cz
        const i = y * SIZE + x
        if (z > zbuf[i]) zbuf[i] = z
      }
  }
  // normalise over covered pixels only (do not squash the object into the far plane)
  let zmin = Infinity, zmax = -Infinity
  for (const z of zbuf) if (z !== -Infinity) { zmin = Math.min(zmin, z); zmax = Math.max(zmax, z) }
  const out = Buffer.alloc(SIZE * SIZE)
  for (let i = 0; i < zbuf.length; i++) out[i] = zbuf[i] === -Infinity ? 0 : Math.round(40 + 215 * ((zbuf[i] - zmin) / (zmax - zmin || 1)))
  return out
}

async function bakeFigures() {
  for (const [id, [yaw, pitch, title]] of Object.entries(FIGURES)) {
    const file = `${OUT_F}/${id}.png`
    if (existsSync(file)) continue
    try {
      const files = await json(`https://api.polyhaven.com/files/${id}`)
      const g1k = files.gltf?.['1k']?.gltf
      if (!g1k) { console.warn(`skip ${id}: no 1k gltf`); continue }
      const g = await json(g1k.url)
      const bins = []
      for (const b of g.buffers) {
        const inc = Object.entries(g1k.include || {}).find(([k]) => k.endsWith(b.uri))
        const url = inc ? inc[1].url : new URL(b.uri, g1k.url).href
        bins.push(await (await fetch(url)).arrayBuffer())
      }
      const tris = triangles(g, bins)
      const depth = rasterize(tris, yaw, pitch)
      await sharp(depth, { raw: { width: SIZE, height: SIZE, channels: 1 } }).png({ compressionLevel: 9 }).toFile(file)
      prov.figures = prov.figures.filter((f) => f.id !== id)
      prov.figures.push({ id, title, file: `/library/figures/${id}.png`, source: 'Poly Haven', licence: 'CC0', url: `https://polyhaven.com/a/${id}`, credit: `${title}, Poly Haven, CC0` })
      console.log(`figure ${id} (${tris.length} tris)`)
    } catch (e) {
      console.warn(`skip ${id}: ${e.message}`)
    }
  }
}

// ---------- Met → tiles ----------
async function bakePatterns() {
  for (const [q, n, tag] of PATTERNS) {
    let hits
    try {
      hits = await json(`https://collectionapi.metmuseum.org/public/collection/v1.1/search?q=${encodeURIComponent(q)}&hasImages=true&isPublicDomain=true&limit=${n * 3}`)
    } catch (e) { console.warn(`skip query ${q}: ${e.message}`); continue }
    let taken = 0
    for (const oid of hits.objectIDs || []) {
      if (taken >= n) break
      const id = `${tag}-${oid}`
      const file = `${OUT_P}/${id}.png`
      if (existsSync(file)) { taken++; continue }
      try {
        const o = await json(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${oid}`)
        if (!o.isPublicDomain || !o.primaryImage) continue
        const img = Buffer.from(await (await fetch(o.primaryImage)).arrayBuffer())
        // centre crop: the ornament, not the mount or the margin
        const meta = await sharp(img).metadata()
        const side = Math.round(Math.min(meta.width, meta.height) * 0.6)
        await sharp(img)
          .extract({ left: Math.round((meta.width - side) / 2), top: Math.round((meta.height - side) / 2), width: side, height: side })
          .resize(SIZE, SIZE)
          .png({ compressionLevel: 9, palette: true })
          .toFile(file)
        prov.patterns = prov.patterns.filter((p) => p.id !== id)
        const title = o.title || q
        prov.patterns.push({ id, title, file: `/library/patterns/${id}.png`, source: 'The Metropolitan Museum of Art, Open Access', licence: 'CC0', url: o.objectURL, date: o.objectDate || '', credit: `${title}${o.objectDate ? ', ' + o.objectDate : ''}, The Met, CC0` })
        taken++
        console.log(`pattern ${id}: ${title}`)
      } catch (e) {
        console.warn(`skip ${oid}: ${e.message}`)
      }
    }
  }
}

if (only !== '--patterns-only') await bakeFigures()
if (only !== '--figures-only') await bakePatterns()
prov.figures.sort((a, b) => a.title.localeCompare(b.title))
prov.patterns.sort((a, b) => a.id.localeCompare(b.id))
writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n')
console.log(`provenance: ${prov.figures.length} figures, ${prov.patterns.length} patterns`)
