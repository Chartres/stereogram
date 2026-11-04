import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const feedback = vi.fn()
vi.mock('@/analytics', () => ({ feedback: (...a: unknown[]) => feedback(...a) }))

import { FeedbackCard } from './FeedbackCard'

describe('FeedbackCard', () => {
  it('sends the Sean Ellis answer and the text with its context', async () => {
    render(<FeedbackCard context="make" />)
    await userEvent.click(screen.getByRole('button', { name: 'Feedback' }))
    await userEvent.click(screen.getByRole('button', { name: "I'd really miss it" }))
    await userEvent.type(screen.getByLabelText('Your message'), 'print presets please')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(feedback).toHaveBeenCalledWith({ sean_ellis: 'very', text: '[make] print presets please' })
    expect(screen.getByText(/Thank you/)).toBeInTheDocument()
  })
})
