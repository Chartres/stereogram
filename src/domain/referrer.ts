/** Where a visit came from, for the first page_view: utm_source if present, else the referring
 *  host without "www.", else null (direct, internal navigation, or a stripped referrer). */
export function entrySource(referrer: string, search: string, ownHost: string): string | null {
  const utm = new URLSearchParams(search).get('utm_source')
  if (utm) return utm.slice(0, 40)
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    return host && host !== ownHost ? host : null
  } catch {
    return null
  }
}
