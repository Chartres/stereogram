// Per-plate link cards. Hash routes (#/book/5) never reach a link unfurler, so each plate has a
// real path, /plate/<n>/, whose HTML is index.html with its own title, description, canonical
// and og:image (the plate itself, rendered at build by scripts/prerender-plates.mjs).

export const HOST = 'https://stereogram.dravec.org'

export const platePath = (n: number) => `/plate/${n}/`
export const plateImage = (n: number) => `/og/plate-${n}.jpg`

/** The plate number a path asks for, or null. */
export function plateFromPath(pathname: string): number | null {
  const m = pathname.match(/^\/plate\/(\d+)\/?$/)
  return m ? Number(m[1]) : null
}

const esc = (s: string) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

function setMeta(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const re = new RegExp(`(<meta\\s+${attr}="${key.replace(/[.:]/g, '\\$&')}"\\s+content=")[^"]*(")`)
  if (!re.test(html)) throw new Error(`plateMeta: <meta ${attr}="${key}"> missing from the template`)
  return html.replace(re, `$1${esc(value)}$2`)
}

/** index.html → the head of one plate's page. Throws if the template lost a tag, so a build can't ship a blank card. */
export function plateHtml(template: string, n: number): string {
  const title = `Plate ${n}: what is hidden here?`
  const description = 'A stereogram. Look through the picture until the two dots become three, and wait. The answer is one tap away.'
  const url = `${HOST}${platePath(n)}`
  const image = `${HOST}${plateImage(n)}`
  let h = template
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} · Stereogram</title>`)
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
  h = setMeta(h, 'name', 'description', description)
  h = setMeta(h, 'property', 'og:url', url)
  h = setMeta(h, 'property', 'og:title', title)
  h = setMeta(h, 'property', 'og:description', description)
  h = setMeta(h, 'property', 'og:image', image)
  h = setMeta(h, 'property', 'og:image:alt', `Stereogram plate ${n}`)
  h = setMeta(h, 'name', 'twitter:title', title)
  h = setMeta(h, 'name', 'twitter:description', description)
  h = setMeta(h, 'name', 'twitter:image', image)
  return h
}
