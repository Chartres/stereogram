# Stereogram — personas and journeys

Recipe: flywheel `docs/standards/persona-journeys.md`. Triggers, not demographics. Each journey
runs in `e2e/journeys.spec.ts` and writes a shot to `e2e/shots/`. Selection rule: a feature is
buildable only when it names the journey and the step it improves.

| # | Persona | Trigger | Journey (done line) | Watch-fors | Automation |
|---|---|---|---|---|---|
| P1 | **Marek**, 34, remembers Magic Eye books | A friend's birthday; wants a hidden word to send | Open → Text → type AHOJ → Copy link → paste in chat. *Done:* the friend opens the link and sees the same picture. | link must carry text + seed; text too wide must shrink, not clip | e2e |
| P2 | **Lenka**, teacher | A classroom wall sheet for a vision lesson | Open → Size A4 300 dpi → Download. *Done:* a 3508×2480 PNG prints sharp. | render must not freeze the page; the caption must say the picture is shown scaled | e2e (PNG header checked) |
| P3 | **Tom**, 3D hobbyist | Has a depth pass from Blender, black = near | Picture → upload → Show the depth map → Invert → Smooth. *Done:* the relief reads correctly. | cover-fit of a portrait map; invert must flip; 8-bit stair edges need smoothing | e2e |
| P4 | **Eva**, 12, on a phone | Has never seen one; a cousin sent a link | Open on 390 px → picture leads, Download under it → How to see → reads the honest note. *Done:* either sees it or learns that one in twenty cannot. | no x-overflow at 320/375/430; tabs ≥44 px; dots visible on a small screen | e2e |
| P5 | **Jonas**, developer | Wants the same output twice for a blog post | Open a parametrised link twice → identical pixels → Shuffle → new seed in the URL. *Done:* the post's link reproduces the figure. | determinism across Worker/non-Worker paths; hostile params clamp | e2e |
| P6 | **Klára**, 9 (daughter) | Wants to draw her own relief | Draw → brush a stroke → Show the depth map → see the stroke. *Done:* her shape is in the picture. | touch-action none on the painter; height 0 erases; clear on resize is acceptable | e2e |

Anchor persona: P1 (the one-liner made flesh). Seasonal passes: none (no calendar dimension).
