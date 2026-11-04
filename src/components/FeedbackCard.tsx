import { useState } from 'react'
import { feedback } from '@/analytics'

const ELLIS = {
  very: "I'd really miss it",
  somewhat: "I'd miss it a little",
  not: "I wouldn't miss it",
} as const
type Ellis = keyof typeof ELLIS

/** One feedback control on every screen (docs/standards/feedback.md). Collapsed until asked for. */
export function FeedbackCard({ context }: { context: string }) {
  const [open, setOpen] = useState(false)
  const [ellis, setEllis] = useState<Ellis | null>(null)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const canSend = !!text.trim() || !!ellis

  function submit() {
    if (!canSend) return
    feedback({ sean_ellis: ellis ?? undefined, text: text.trim() ? `[${context}] ${text.trim()}` : undefined })
    setSent(true)
  }

  if (sent) return <p className="text-ink-soft">Thank you. Pavol reads every message.</p>
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 text-accent underline underline-offset-4">
        Feedback
      </button>
    )
  return (
    <section aria-label="Feedback" className="rounded-md bg-paper-2 p-4">
      <h2 className="font-display text-title">Tell Pavol</h2>
      <p className="mt-2 text-ink-soft">If this page disappeared tomorrow…</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(ELLIS) as Ellis[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={ellis === k}
            onClick={() => setEllis(ellis === k ? null : k)}
            className={`min-h-11 rounded-md border px-3 ${ellis === k ? 'border-accent bg-paper' : 'border-edge'}`}
          >
            {ELLIS[k]}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        aria-label="Your message"
        placeholder="Anything else (optional)"
        className="mt-3 w-full rounded-md bg-paper p-3"
      />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-md border border-edge px-4">
          Close
        </button>
        <button type="button" onClick={submit} disabled={!canSend} className="min-h-11 rounded-md bg-accent px-4 text-paper disabled:opacity-50">
          Send
        </button>
      </div>
    </section>
  )
}
