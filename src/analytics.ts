import { supabase } from './platform/supabase'
import { createFlywheelClient, type SupabaseLike } from './platform/flywheel-client'

// Flywheel Common Platform: cookieless, first-party, fire-and-forget. Names must be on
// src/platform/flywheel-events.json (the contract test checks). Everything product-specific
// goes into key_action props: track('key_action', { action: 'download' }).
const fw = createFlywheelClient({
  app: 'stereogram',
  supabase: supabase as unknown as SupabaseLike | null,
})

export function track(event: string, props?: Record<string, unknown>): void {
  fw.track(event, props)
}

export const feedback = fw.feedback
export const logError = fw.logError

/** The aha moment: the person took a stereogram away (share, download or copy). Once per session. */
export function conversion(via: 'download' | 'copy' | 'share' | 'ladder' | 'book'): void {
  try {
    if (sessionStorage.getItem('fw:converted')) return
    sessionStorage.setItem('fw:converted', '1')
  } catch {
    /* storage blocked: still count it */
  }
  fw.conversion({ via })
}
