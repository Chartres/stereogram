import { FeedbackCard } from './FeedbackCard'
import { Ladder } from './Ladder'

export function SeeScreen() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">
      <h1 className="font-display text-display">How to see it</h1>
      <p className="mt-4">
        A stereogram hides a shape in a repeating pattern. Your eyes find it when each eye looks at a
        different copy of the pattern. Nothing moves; you only change where your eyes converge.
      </p>

      <h2 className="mt-12 font-display text-title">Parallel viewing (the usual way)</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-6">
        <li>Sit about an arm's length from the screen. Find the two dots above the picture.</li>
        <li>
          Look <em>through</em> the screen, as if at something a metre behind it. Let the picture go soft.
        </li>
        <li>The two dots become three. Hold your gaze there and keep the middle dot steady.</li>
        <li>Wait. The pattern settles into a surface and the shape rises out of it in a few seconds.</li>
        <li>Once you have it, you can look around the picture without losing it.</li>
      </ol>

      <h2 className="mt-12 font-display text-title">If it will not come</h2>
      <ul className="mt-4 list-disc space-y-3 pl-6">
        <li>Bring your face close to the screen until the picture is a blur, then move back slowly without refocusing.</li>
        <li>Hold a finger halfway between your eyes and the screen; look at the finger, then slide your attention to the picture.</li>
        <li>Lower the depth or widen the eye separation on the Make page. A shallow, wide picture is easier than a deep one.</li>
        <li>Try a smaller picture first. A phone at arm's length is easier than a large print at close range.</li>
      </ul>

      <h2 className="mt-12 font-display text-title">Cross-eyed viewing</h2>
      <p className="mt-4">
        Some people find crossing their eyes easier than relaxing them. Switch the viewing mode to
        <strong> cross</strong> on the Make page, then look at a point halfway between you and the screen.
        A picture made for one mode appears inside-out in the other.
      </p>

      <h2 className="mt-12 font-display text-title">An honest note</h2>
      <p className="mt-4">
        About one adult in fourteen cannot fuse stereograms at all (Chopin, Bavelier and Levi, 2019), because
        their eyes do not work together in the way this trick needs. It is not a matter of effort, and it says nothing about eyesight in
        general. If after a few tries there is nothing, that is a fair result, and the picture is still a
        pleasant pattern.
      </p>

      <h2 className="mt-12 font-display text-title">Where this comes from</h2>
      <p className="mt-4">
        Charles Wheatstone showed in 1838 that depth is built from the small difference between what
        the two eyes see. Béla Julesz proved in 1959 that the brain can do this with pure random dots,
        with no recognisable picture in either eye. Christopher Tyler folded the pair into a single image
        in 1979. The algorithm here is the one Thimbleby, Inglis and Witten published in 1994, including
        their hidden-surface removal.
      </p>

      <Ladder />

      <div className="mt-12">
        <FeedbackCard context="see" />
      </div>
    </main>
  )
}
