# Landing Video Recording Plan

This guide maps each landing-page video to the current product UI as it exists in the app today.

## Global Setup

- Record in dark mode.
- Use a clean seeded demo account only.
- Recommended viewport: `1280x800`.
- Recommended browser zoom: `90%` or `100%`, whichever keeps the primary action fully visible without scrolling.
- Hide bookmarks bar, extensions, notifications, OS clock popups, and personal profile info.
- Move the cursor slowly and deliberately.
- Prefer one decisive click per beat.
- End every clip on a stable state and hold for `1.0s` to `1.5s`.
- Export `MP4` first, then generate `WebM`.
- Capture one clean poster frame from the finished state of each clip.

## Asset Map

- Hero:
  - `public/assets/videos/demo-hero-discovery.mp4`
  - `public/assets/videos/demo-hero-discovery.webm`
  - `public/assets/videos/poster-hero-discovery.jpg`
- Job Discovery:
  - `public/assets/videos/demo-discovery.mp4`
  - `public/assets/videos/demo-discovery.webm`
  - `public/assets/videos/poster-discovery.jpg`
- AI Fit Analysis:
  - `public/assets/videos/demo-fit-score.mp4`
  - `public/assets/videos/demo-fit-score.webm`
  - `public/assets/videos/poster-fit-score.jpg`
- Cold Email:
  - `public/assets/videos/demo-cold-email.mp4`
  - `public/assets/videos/demo-cold-email.webm`
  - `public/assets/videos/poster-cold-email.jpg`
- Smart Apply:
  - `public/assets/videos/demo-smart-apply.mp4`
  - `public/assets/videos/demo-smart-apply.webm`
  - `public/assets/videos/poster-smart-apply.jpg`

## Clip 1: Hero

- Landing surface:
  - Top hero visual
- Route:
  - `/dashboard/discover`
- Goal:
  - Show the full differentiator in one compact story:
  - discovery -> AI scoring -> AI evaluation -> multi-select -> Smart Apply confirm
- Target length:
  - `10s` to `12s`

### Pre-flight

- Make sure Discover already has opportunities loaded.
- Make sure at least `4` visible jobs are present.
- Make sure the top-ranked card already looks strong after scoring.

### Exact Script

1. Go to `/dashboard/discover`.
2. Wait until the page header `Discover` and the `Preferences` bar are visible.
3. Click `AI Score top matches`.
4. Wait for the scoring pass to finish and the toast to settle.
5. On the highest-scored job card, open the `AI evaluation` disclosure.
6. Pause long enough for the reasoning and dimension scores to be readable.
7. Check `4` job checkboxes using the `Select for batch Smart Apply` checkboxes on the left side of job cards.
8. Click `Batch Smart Apply (4)`.
9. Wait for the dialog `Run Smart Apply on 4 jobs?`.
10. Pause briefly so the dialog title and description are readable.
11. Click `Continue`.
12. Wait for the success toast and one visibly updated job/application state.
13. Hold the final state for `1.0s` to `1.5s`.

### Framing Notes

- Keep the top toolbar and the first two rows of jobs in frame.
- Do not scroll during the clip.
- The most important beats are:
  - `AI Score top matches`
  - `AI evaluation`
  - `Batch Smart Apply (4)`
  - `Run Smart Apply on 4 jobs?`

## Clip 2: Job Discovery

- Landing surface:
  - `Job Discovery` card
- Route:
  - `/dashboard/discover`
- Goal:
  - Make discovery feel live and ranked, not static
- Target length:
  - `8s` to `10s`

### Exact Script

1. Go to `/dashboard/discover`.
2. Keep the `Preferences` bar and the top of the job feed visible.
3. Click `Run Discovery`.
4. Wait for the completion toast and refreshed feed.
5. Click `AI Score top matches`.
6. Wait until the scores are visible on the cards.
7. Open the `AI evaluation` section on the strongest-looking job.
8. Hold on the expanded evaluation with:
  - overall score
  - reasoning
  - dimension lines
  - strengths/gaps if present
9. Stop on that expanded, fully-scored state.

### Important Detail

- The expandable section label in the current UI is exactly `AI evaluation`.
- The job-source badges may show names like `Greenhouse`, `Remotive`, or `The Muse`. Keep one visible if possible.

## Clip 3: AI Fit Analysis

- Landing surface:
  - `AI Fit Analysis` card
- Route:
  - `/dashboard/pipeline`
- Goal:
  - Show the drawer workflow and a saved fit result
- Target length:
  - `6s` to `8s`

### Pre-flight

- Make sure there is at least one application card with a valid `Job URL` in the drawer Overview.
- Ideally use a card that produces a strong result like the Vercel-style frontend example.

### Exact Script

1. Go to `/dashboard/pipeline`.
2. Click a pipeline card to open the application drawer.
3. Wait for the drawer header and tabs to appear.
4. Confirm the `AI Actions` tab is active. If it is not, click `AI Actions`.
5. In the `Fit analysis` row, click `Run`.
6. Wait for the loading glow to appear and finish.
7. Let the saved result render inside the `Fit analysis` panel.
8. Hold on the visible score plus strengths/gaps/suggestions for `1.0s` to `1.5s`.

### Important Detail

- The button label is currently `Run`, not `Analyze Fit`.
- The section title is `Fit analysis`.

## Clip 4: Cold Email

- Landing surface:
  - `Cold Email Generator` card
- Route:
  - `/dashboard/pipeline`
- Goal:
  - Show a real saved outreach draft generated from the application context
- Target length:
  - `6s` to `8s`

### Exact Script

1. Go to `/dashboard/pipeline`.
2. Click a card to open the application drawer.
3. Make sure `AI Actions` is active.
4. Scroll only if necessary so the `Cold email` row is fully visible.
5. In the `Cold email` row, click `Run`.
6. Wait for the loading glow to finish.
7. Let the generated email textarea appear in the expanded row.
8. Keep the saved email draft visible and readable.
9. Hold on the final state for `1.0s` to `1.5s`.

### Important Detail

- The current product does not expose a tone toggle for `Cold email`.
- Do not storyboard a tone switch in this clip.
- The button label is currently `Run`.

## Clip 5: Smart Apply

- Landing surface:
  - `Smart Apply` card
- Route:
  - `/dashboard/discover`
- Goal:
  - Show batch selection and one confirmation leading to generated materials
- Target length:
  - `10s` to `12s`

### Pre-flight

- Use a state with at least `4` jobs visible.
- This matters because the confirm dialog appears only when more than `3` jobs are selected.

### Exact Script

1. Go to `/dashboard/discover`.
2. Select `4` jobs using the checkbox on each card labeled `Select for batch Smart Apply`.
3. Pause very briefly so the selected state is visible.
4. Click `Batch Smart Apply (4)`.
5. Wait for the dialog `Run Smart Apply on 4 jobs?`.
6. Hold the dialog long enough to read the promise:
  - creates applications
  - generates draft materials
  - opens each job URL
7. Click `Continue`.
8. Wait for the success toast.
9. Keep one updated job card or linked application state in frame.
10. Hold on the completed state for `1.0s` to `1.5s`.

### Important Detail

- If you only select `1`, `2`, or `3` jobs, the app skips the confirmation dialog and runs immediately.
- For the landing clip, always select `4` jobs so the confirmation beat is captured.

## Tracker Card

- Landing surface:
  - `Interactive Tracker`
- Format:
  - TSX only, no recording needed
- Why:
  - It is the only surface that benefits more from live interaction than from playback.

### What to Demo During QA

- Click stage chips:
  - `Saved`
  - `Applied`
  - `Interview`
  - `Offer`
  - `Rejected`
- Click a visible card to update the detail panel.
- Drag a card onto another stage chip.
- Drag at least one card onto `Offer` to confirm the glow behavior.

## Editing Notes

- Keep the mouse visible in every recording.
- Avoid unnecessary scrolling.
- Do not open additional tabs unless the flow requires it.
- If a toast appears, let it live in frame for a moment, but do not wait so long that the clip feels slow.
- Trim dead time aggressively.

## Loop Notes

- Hero, Discovery, Smart Apply:
  - best loop approach is a hidden cut after the stable end state
- Fit Analysis, Cold Email:
  - easiest loop is a clean cut from the final saved state back to the initial drawer-open state

## Recommended Recording Order

1. `demo-discovery`
2. `demo-smart-apply`
3. `demo-fit-score`
4. `demo-cold-email`
5. `demo-hero-discovery`

This order lets you reuse the same seeded Discover and Pipeline states while recording.
