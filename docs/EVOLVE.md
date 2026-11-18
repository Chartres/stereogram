# Stereogram — evolve ledger (`/flywheel:evolve`)

Dated sections, newest first. Each run scores the previous run's picks, then proposes new
ones. Corrections stay visible.

## 2026-11-18 — first run (kill-criterion deadline day)

Sources: `flywheel-core.events` and `feedback` (read-only SQL through the Supabase MCP,
18 Nov 07:50 CET; `scripts/evolve-signals.mjs` printed the SQL, no service key on this
machine), a Playwright read-back of the live site (Chromium, 1280×900, deviceScaleFactor 1,
analytics requests aborted so the check wrote no rows), `curl` of the shared URL shapes,
Gmail (read-only), `gh`. Window: 4–17 Nov 2026 unless stated. No previous run to score.

**Correction to the brief.** The landscape lives in
`flywheel/docs/discovery/stereogram-landscape.md` and `docs/landscape-2026-11-04.html`, not
in this repo's `docs/discovery/`.

### 0. Gate check

**Kill criterion** (locked, deadline 2026-11-18): "Not live at stereogram.dravec.org with
shapes, text, upload, PNG export and the viewing guide by the deadline." Read back today:

| Item | Verdict | Evidence (live, 18 Nov) |
|---|---|---|
| Live at stereogram.dravec.org | met | `/` 200; first picture rendered in 4.3 s with no input; 0 page errors |
| Shapes | met | Shape tab, 8 shapes; picking the second changed the canvas |
| Text | met | "Hidden text" = AHOJ changed the canvas; link carries `text=AHOJ` |
| Upload | met | a 300×200 radial depth PNG via the depth-file input changed the canvas |
| PNG export | met | Download PNG gave `stereogram-image-1994.png`, valid PNG 1054×632, 296,551 bytes |
| Viewing guide | met | "How to see" → `#/see`: "How to see it", the six-rung ladder, Comenius's spectacles |

The criterion is met; it was met on 4 Nov (0.1.0) and still holds on 0.5.0.

**Gate building → soft-launch** (PLAYBOOK row 5, plus the record's `next_gate`):

| Condition | Verdict | Evidence |
|---|---|---|
| Deployed MVP passing `/qa` | partly | no `/qa` run on record; the read-back above passes; 11 e2e journeys green in CI |
| CI green | met | last 5 runs on `main` success (latest 7 Nov, 0.5.0) |
| Approved signature move live and measured | met | `pick_pattern` 60 events / 11 visitors, `pick_figure` 39 / 7, `plate_open` 21 / 8 |
| Analytics verified firing | met, with holes | real events every day 4–17 Nov; daily `flywheel-probe`; holes D7, D8 |
| Sean Ellis micro-survey wired | wired, silent | FeedbackCard on Make, Book, See, Depth; **0 `feedback` rows, 0 `feedback_given`** (next_gate asked ≥1) |
| Red-team job green | not met | `ci.yml` has no red-team job; tier B (no secret in bundle, CSP, deps) applies to a static site |

**Recommendation: ADVANCE to soft-launch**, with the red-team tier-B job and one feedback
row as the first two soft-launch items rather than as blockers.
- *For:* the locked criterion is met on every item; three approved moves are live and
  measured; the open question is reach, and only soft-launch's channel attempts can answer
  it. Five of the seven planned channels have not been tried (D10).
- *Against:* two gate rows are not met (red-team, feedback row) and `/qa` was not run.
  Activation after launch day is 1 converter in 30 visitors (D3), well under soft-launch's
  30%. Advancing asks Pavol for channel sign-offs, which competes for the three focus slots.
- *ITERATE* would mean: hold in building one week, add the red-team job and `/qa`, then
  advance. It costs a week and changes no user-facing fact.
- *KILL* has no case: the criterion is met.

### 1. Discover

- **D1 Visitors.** 53 visitor ids, 4–17 Nov; 1 is `flywheel-probe` (12 page views).
  Of the 52, 23 arrived on launch day 4 Nov, mostly Pavol and the build agent.
  5–17 Nov: **30 visitors, 13 with any key_action, 1 converted.**
- **D2 Bot leakage.** About 14 single-page-view visitors arrive in same-second pairs
  (4 Nov 19:25:56, 21:43:05–09, 23:55–23:56; 5 Nov 03:24:26; 6 Nov 17:09:24; 7 Nov 11:09:57;
  11 Nov 09:48:02). That shape is an unfurler or JS crawler that `BOT_UA` does not catch.
  Real outside visitors 5–17 Nov are likely nearer 20 than 30.
- **D3 Activation.** `conversion` 4 events / 3 visitors, all `via=download`. Two of the three
  are 4 Nov single-view visits (owner tests, by timing). After launch day: 1 visitor
  (10 Nov, two sessions). Picture share (`key_action share`) fired 0 times; `share_link` 2,
  `plate_share` 1.
- **D4 Signature moves.** `pick_pattern` 60/11, `pick_figure` 39/7, `reveal` 28/3,
  `plate_open` 21/8, `plate_answer` 4/3, `print_plate` 2/2, `ladder_step` 1/1,
  `upload_depth` 2/2, `upload_tile` 3/1. Depth test page viewed by 4, `acuity_done` 0.
  `spectacles_open` 0. Routes: make 51 visitors, book 8, see 5, acuity 4.
- **D5 Recurrence.** 5 visitors came back on a second day (excluding the probe).
- **D6 Errors.** `removeChild … not a child of this node` 4× from 1 visitor (10 Nov): the
  signature of a browser translator rewriting React's DOM. `Rejected` 1×. Low volume, one
  person; worth a `translate="no"` on the app root if it recurs.
- **D7 Telemetry gap: no entry source.** `page_view` carried only `route`, so no visit can
  be attributed to a channel and the 19 Nov predictions cannot be scored by channel.
  **Fixed in this run** (`ref` = utm_source or referring host; `src/domain/referrer.ts`).
- **D8 Telemetry gap: picture share.** 0 shares could mean nobody shared, or that the
  phone share path is rarely reached. Unknown until a real phone pass.
- **D9 Voice.** 0 feedback rows, 0 issues. SMK and The Met: sent 6 Nov, no reply in Gmail
  as of 18 Nov. **The Met email says 60 images; the library has 42 tiles since the 7 Nov
  pattern check.** Not resent; a correction, if any, is Pavol's call.
- **D10 Channels.** Of the seven in `flywheel/docs/distribution/stereogram.md`: museums sent;
  named list, r/MagicEye, Show HN, the teacher (draft staged), alternativeto not attempted;
  Public Domain Day waits for 1 Jan.
- **D11 Read-back.** `/`, `/plate/6/`, `/plate/11/`, `/plate/100/`, sitemap, robots,
  llms.txt all 200. `/plate/101/` and `/og.png` also return 200 HTML (soft 404 from the
  Pages SPA fallback): harmless to people, noise to crawlers.
- **D12 Market.** No new sweep this run. The 4 Nov landscape stands: crowded generators
  (Owl3D, Tembrica, KilledByAPixel); nobody else has a provenance-tracked sculpture library,
  a book of plates or a viewing course.

**Predictions (due 19 Nov)**

| Channel | Predicted (14 d) | Status 18 Nov |
|---|---|---|
| 1 Named list | 10–30 | not sent; open |
| 2 r/MagicEye | 50–300 | not posted; open |
| 3 Show HN | 0–5,000 | not posted; open |
| 4 Museums (6 Nov) | 0–1,000 | no reply; all post-launch traffic is 30 visitors, so ≤30 from museums; window closes 20 Nov |
| 5 Teacher | 0–50 | draft not sent; open |
| 6 alternativeto | 10–50/month | not submitted; open |
| 7 Public Domain Day | — | 1 Jan 2027 |

### 2. Define

- HMW-1 get the plates in front of people who already like Magic Eye (D1, D10)?
- HMW-2 know which channel brought whom (D7, D2)?
- HMW-3 turn looking (13 acted) into taking a picture away (1 converted) (D3, D8)?
- HMW-4 hear from one real visitor (D9)?

**Binding constraint: reach.** About 20–30 outside visitors in 13 days, with one channel
tried. At this size activation and retention cannot be read. The kill criterion was a build
criterion; soft-launch's own clock (<20 users after 2 honest channel attempts) is the next
real test.

### 3–4. Develop and deliver

| # | Idea | Kind | HMW | D# | Impact | Conf | Effort | Rev | First cheapest test |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Entry source on page_view ✅ | adjacent | 2 | D7 | 3 | H | S | 2-way | rows carry `ref` after deploy |
| 2 | Post r/MagicEye (draft exists) | adjacent | 1 | D10 | 4 | M | S | 1-way | one post, 48 h |
| 3 | Red-team tier-B job in CI | adjacent | — | gate | 2 | H | S | 2-way | job green on a PR |
| 4 | `translate="no"` + bot pairs filtered (UA list from the pairs' rows) | adjacent | 2 | D2, D6 | 2 | M | S | 2-way | no same-second pairs for 7 d |
| 5 | Plate of the week: one plate link a week to the named list | mid | 1, 3 | D4 | 3 | M | S | 2-way | 4 weeks, ≥3 return visitors |
| 6 | Stereo-pair / anaglyph export for the 1 in 14 who cannot fuse | mid | 3 | D3 | 3 | M | M | 2-way | ROADMAP item; `download` via pair |
| 7 | One-question survey after a plate answer, not in a footer | mid | 4 | D9 | 3 | M | S | 2-way | ≥1 row in 14 d |
| 8 | Printable classroom pack (A4 plates + the ladder as a worksheet) | mid | 1 | D10 | 3 | L | M | 2-way | send to the teacher; 1 reply |
| 9 | Museum embed: a plate card each museum can link from its reuse page | mid | 1 | D9 | 4 | L | M | 2-way | 1 museum reply by 2 Dec |
| 10 | Remove the depth test from the nav; keep `#/depth` as a link from See | radical (removes) | 3 | D4 | 2 | M | S | 2-way | nav clicks shift to book/see |
| 11 | Be the assistant's source: a plates + provenance JSON and llms.txt entries so an AI asked "make me a Magic Eye of X" links a plate | radical (post-AGI) | 1 | D12 | 3 | L | M | 2-way | AIO weekly query cites the site once |
| 12 | Use the incumbent: ask Magic Eye Inc.'s fan pages / r/MagicEye mods for a "make your own" link in their FAQ | radical (incumbent) | 1 | D10 | 4 | L | S | 1-way | 1 yes |

Founder lens: #5 (his own named list, his daughters as first viewers). Fringe source: #12
(hobby moderators, not press).

**Top 3**
1. *Quick win:* #1 shipped; next #2 r/MagicEye. Kill test: by **2 Dec 2026**, fewer than 20
   visitors with `ref=reddit.com` within 14 days of the post → the hobby room is not the channel.
2. *Mid bet:* #7 survey after a plate answer. Kill test: 0 feedback rows by **2 Dec 2026**
   with ≥50 visitors → the survey is in the wrong place or the audience is silent; drop it.
3. *Radical probe:* #9 museum embed. Kill test: no reply from SMK or The Met by
   **2 Dec 2026** (four weeks after sending) → stop the museum channel; the provenance stays as product, not as distribution.

### 5. Questions for Pavol

1. Gate: advance to soft-launch now (default), with red-team tier B and one feedback row as
   the first soft-launch items, or hold one week in building?
2. r/MagicEye and the named list: sign off the drafts in the distribution doc, or name the
   one channel you want first?
3. The Met email said 60 images; the library has 42. Leave it (default), or send a one-line
   correction if they reply?
