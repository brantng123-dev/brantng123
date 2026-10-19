# Handover — HKIE structural scheme tool

Paste the "Prompt for a new chat" section below into a new Claude Code chat opened in this folder.

## Prompt for a new chat

I am continuing work on an offline HKIE structural-exam scheme tool. Please read `structural-scheme-tool/HANDOVER.md` first.
Reply in Traditional Chinese, fact-check, and use second-level thinking.

## What the tool is

- A single offline HTML file (`index.html`) that runs on Mac and iPhone Safari.
- The user enters the question's constraints:
  - floors and exceptions
  - grid
  - floor types with minimum column spacing
  - cores
  - restricted zones (column-free, void, double height, ramp, spacing zone, rooms with partitions, walls)
  - settings
- The tool generates column layouts and checks 9 schemes on each:
  - R1–R6 are RC.
  - S1–S3 are steel.
- It hides schemes that are not feasible or not needed.
- It recommends one RC plus one steel scheme that are truly distinct per the HKIE seminar. Material alone is NOT distinct.
- It shows framing plans for every floor, sections, a design appraisal, a side-by-side comparison and an editable calculation report.

## Files

- `src/engine.js` — `buildModel(S)`:
  - storeys, zones and column status per storey
  - transfer points, members, per-level info (unresolved points, transfer plate)
  - structural depth per level
- `src/app.js` — UI and logic:
  - `compile`, `layoutGen`, `evalGen`, `assess`, `recPair`
  - plans and sections (SVG), report
- `src/header.js`, `src/shell.html`, `src/s355.json` — header, CSS shell, steel section table.
- `python3 build.py` → builds `index.html`. Always rebuild after editing `src/`.
- `tests/` — Playwright scripts (need `npm i playwright`; set `CHROMIUM=/path/to/chromium` if needed):
  - `node tests/q2-answer.js` — 2012 shopping-mall question. Current answer: RC R6-L10 + steel S2-L7, score 7/11.
  - `node tests/hotel-bands.js` — hotel-like input (my guess, not the user's file). Lists two-band layouts and why each passes or fails.
  - `node tests/hotel-mylayouts.js "$(pwd)/index.html" 3 my` — the user's own layouts through "My column layouts".
- Branch: `claude/bug-testing-kfil5h` on `brantng123-dev/brantng123`.

## Scheme generation logic (layoutGen)

1. **Per axis (`axisC`)**, the tool builds candidate column lines from the band's building extent:
   - the question grid
   - equal bays with end-cantilever options, rounded to 0.25 m. The cantilever limit is setting `cantGrid`; `cantRef` 1 = measured from the column face.
   - grids on room partitions
   - grids aligned to core / zone edges

   It keeps one candidate per (number of lines, longest bay):
   - Partitions and the question grid come first, then practical spans (about 7.5–12 m; over 18 m last).
   - It keeps 8 per axis for a single grid, 6 X / 5 Y per band, and 3 for the middle band of three bands.
2. **Layouts**:
   - single grid × transfer mode: stop (no transfer) or keep (transfer at the zone roof / plant floor)
   - two-band: split at zone top, plant floor, ground, floor-type change or column-free start
   - three-band
3. **Screen**: spacing per pair (spacing zones override the floor type), end cantilever, spans ≤ 30 m.
   - Score = uniformity×10 + longest span×0.2 + members×0.05 + columns×0.02 + 3 if plate-only.
4. **Pick** which layouts get the full check:
   - the question grid
   - the best per family, up to `maxLayouts` 30
   - per transfer level, the best two of each different upper grid, then by score
   - user "My column layouts" (Step 2) are always checked and shown, pass or fail
5. **Full check (`assess`)** for every layout × scheme.
   - Geometry is strict pass/fail: spacing, spans (RC ≤ 12 m, steel ≤ 18 m), clashes, partitions, cantilevers.
   - Only depth / thickness may be "slightly off" (within 15%).
6. **"Not needed" filter** (not applied to My layouts):
   - The transfer carries fewer than 2 storeys.
   - The same material works without the transfer or grid change, with long spans on about as many floors.
   - A hanger / inclined column / plate is used where a plain scheme works on the same layout.
7. **Answer (`recPair`)** — for every distinct RC × steel pair:
   - Aspect score: grid 3, transfer vs none 3, transfer floor 2, transfer type 2, max span 1.
   - Penalties: slightly off ×4, non-uniform spacing, span outside RC 8–10.5 m / steel 15–18 m.
   - The best pair is recommended; the user can override it in the two columns.

## Known problems / next tasks (most important first)

1. **Transfer plate has no support check and is drawn floating.**
   - `assess` only checks thickness = (longest member span at that level) / `plateRatio` (6) against the structural zone.
   - It never checks that the plate actually bears on columns or walls below.
   - The plan draws the plate as the bounding box of the transfer points ±1 m (`app.js`, search `R.used.has('PLATE')`), not between its supports.
   - Seen on the hotel 3/F plan: a strip along grid B with nothing under it.
   - Fix: derive the plate extent from the supporting columns / walls / core below.
     - Each transfer point must lie within a panel bounded by supports.
     - Span = the distance between those supports.
     - Fail if a transferred column has no support within the plate.
     - Draw the plate to the supports.
2. **The method is rule-of-thumb preliminary sizing, not structural analysis.** This is the HKIE exam level. Inputs:
   - span/depth ratios
   - tributary loads
   - wL²/8 girders
   - column N/A
   - plate span/6

   No frame or FE analysis is done. Any load-path claim must be checked: every transfer element needs supports.
3. Hotel tests use an input I guessed. Re-test with the user's real input (they can export / paste their JSON).
4. Q2's recommended RC scheme changed from R2 (question grid, no transfer) to R6-L10 (PT transfer girders, not in the user's template) after the spacing shortlist change. The user may prefer R2.

## User preferences (important)

- Truly distinct schemes: different load path and framing. Flat slab does not count.
- One RC + one steel answer, maximising difference.
- Uniform spacing rounded to 0.25 m. Steel 15–18 m preferred (max 18), RC max 12 m.
- Never move the question's grid lines; show other column lines by setting-out dimensions.
- Two column sizes: RC 1000 / steel 750 plus one larger if needed.
- Columns inside the building edge; beams flush with edges; straight column lines.
- No meaningless transfers. Hide infeasible schemes, but always show the user's own layouts with reasons.
- No print needed.
