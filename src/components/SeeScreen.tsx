import type { ReactNode } from 'react'
import { FeedbackCard } from './FeedbackCard'
import { Ladder } from './Ladder'
import { Spectacles } from './Spectacles'

// The See page as an app: the thing the screen turns on (the ladder) leads; the reading folds
// under rows; one slab to the measurement. Same shape as Make.
function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="rounded-md bg-paper-2 px-4 py-2">
      <summary className="min-h-11 cursor-pointer list-none py-2 font-display text-title">{title}</summary>
      <div className="space-y-3 pb-4 pt-1">{children}</div>
    </details>
  )
}

export function SeeScreen() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-2">
      <header className="flex items-baseline justify-between">
        <h1 className="font-display text-title">How to see it</h1>
        <FeedbackCard context="see" />
      </header>
      <p className="mt-2 text-ink-soft">
        Look <em>through</em> the page, let the two dots become three, and wait. Nothing moves; only where your eyes
        converge changes. Six rungs below, easiest first.
      </p>

      <Ladder />

      <Spectacles />

      <section className="mt-12 space-y-2">
        <Row title="Parallel viewing, step by step">
          <ol className="list-decimal space-y-2 pl-6">
            <li>Sit about an arm's length from the screen. Find the two dots above the picture.</li>
            <li>Look through the screen, as if at something a metre behind it. Let the picture go soft.</li>
            <li>The two dots become three. Hold your gaze there and keep the middle dot steady.</li>
            <li>Wait. The pattern settles into a surface and the shape rises out of it in a few seconds.</li>
            <li>Once you have it, you can look around the picture without losing it.</li>
          </ol>
        </Row>
        <Row title="If it will not come">
          <ul className="list-disc space-y-2 pl-6">
            <li>Bring your face close to the screen until the picture is a blur, then move back slowly without refocusing.</li>
            <li>Hold a finger halfway between your eyes and the screen; look at the finger, then slide your attention to the picture.</li>
            <li>Lower the depth or widen the eye separation on the Make page. A shallow, wide picture is easier than a deep one.</li>
            <li>Try a smaller picture first. A phone at arm's length is easier than a large print at close range.</li>
          </ul>
        </Row>
        <Row title="Cross-eyed viewing">
          <p>
            Some people find crossing their eyes easier than relaxing them. Switch the viewing mode to <strong>cross</strong> on
            the Make page, then look at a point halfway between you and the screen. A picture made for one mode appears
            inside-out in the other; Comenius's spectacles above show it.
          </p>
        </Row>
        <Row title="An honest note">
          <p>
            About one adult in fourteen cannot fuse stereograms at all (Chopin, Bavelier and Levi, 2019), because their eyes do
            not work together in the way this trick needs. It is not a matter of effort, and it says nothing about eyesight in
            general. If after a few tries there is nothing, that is a fair result, and the picture is still a pleasant pattern.
          </p>
        </Row>
        <Row title="Where this comes from">
          <p>
            Charles Wheatstone showed in 1838 that depth is built from the small difference between what the two eyes see. Béla
            Julesz proved in 1959 that the brain can do this with pure random dots, with no recognisable picture in either eye.
            Christopher Tyler folded the pair into a single image in 1979. The algorithm here is the one Thimbleby, Inglis and
            Witten published in 1994, including their hidden-surface removal.
          </p>
        </Row>
      </section>

      <a href="#/depth" className="mt-6 flex min-h-12 items-center justify-center rounded-md bg-accent px-5 font-display text-title text-paper">
        Measure how fine you see depth
      </a>
    </main>
  )
}
