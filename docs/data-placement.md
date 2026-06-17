# PIR 2026–2027 Q2 — Data Placement Map

Source: `C:\Users\User\Downloads\data.md` (extracted from `PIR - 2026 - 2027 (2nd Quarter) (2).pptx`).
Purpose: where each block of the final data belongs in the app, and what kind of change each one is.

> Line numbers reference `src/app/page.tsx` **as of this writing** — they will shift once the file is
> fragmented into smaller modules. Anchor on the named objects (`defaultState.dashboard`,
> `defaultState.characterization`, `defaultState.performanceBudget`) and component names instead.

## How the app is wired
- **Static deck** → `public/PIR 2026.dc.html`: Title, Outline, School Profile, MOOE narrative,
  Issues & Concerns, Thank You.
- **React state** → `defaultState` in `src/app/page.tsx` (~line 21). Three objects drive the
  interactive slides:
  - `dashboard` → Enrolment Dashboard slide
  - `characterization` → Characterization carousel
  - `performanceBudget` → Performance & Budget carousel

---

## A. Enrolment Dashboard → `defaultState.dashboard.steps` (~line 27)

| data.md | Target step | Status |
|---|---|---|
| **S3** Kindergarten — T10/A12, T15/A16, T7/A8 (3 SYs) | `Kindergarten` (~31) | UPDATE — app keeps only latest year `values:[7,8]`; needs `years/targets/actuals` to show 3-year trend. |
| **S4** Elementary — T96/98, T98/91, T91/90 | `Elementary` (~39) | MATCH (exact). |
| **S6** Junior High — T52/52, T52/56, T56/59 | `Junior High` (~48) | UPDATE — actuals match; **2024-25 target should be 52, not 48** (`targets:[48,52,56]` → `[52,52,56]`). |
| **S8** Senior High — G11 11→8, G12 16→11 | `Senior High` (~57) | PARTIAL — current year `values:[8,11]` correct; prior-year 11/16 not stored. |
| **S5** Tracking K–G6 + **S7** Tracking G7–G10 (per-grade, 2 yrs) | `Cohort Tracking` (~65) | VERIFY — source for `flows`. KG–G6 deltas match; **JHS portion and KG sign must be re-derived** from S5+S7. |

Narrative paragraphs in S3/S5/S6/S7/S8 → each step's `finding` / `action` (and/or `data-speaker-notes`).

## B. Characterization → `defaultState.characterization` (~line 74)
- **S9** narrative columns → the 9 `domains` (E, I, A, T, M, F, L, S, P): `bullets` / `status`. Already structured.
- **S20** Drivers-vs-Bottlenecks matrix → same 9 domains, but **no driver/bottleneck field exists yet**.

## C. Performance & Budget → `defaultState.performanceBudget.steps` (~line 197)

| data.md | Target | Status |
|---|---|---|
| **S12** ELLNA | `Learning Outcomes` → ELLNA group | MATCH. |
| **S13** CRLA | — | Mirrors ELLNA; no home needed unless a CRLA tab is wanted. |
| **S14** NAT G6 | `Learning Outcomes` → NAT G6 group | MATCH (Fil 73.15, AP 78.70, Math 77.96, Sci 88.15, Eng 85.74). |
| **S15** NAT G10 | `Learning Outcomes` → NAT G10 group | UPDATE — add **Filipino 42.83, AP 42.96, English 33.45** (app has only Overall 34.76, Sci 26.29, Math 28.27). |
| **S16–S19** PHIL-IRI (KS2/KS3 × 2024-25/2025-26, full Ind/Inst/Frust + counts) | `Learning Outcomes` → PHIL-IRI group | UPDATE — **DECISION: keep the FULL breakdown, nothing removed.** App has only a sparse 4-metric subset; expand to all 8 distributions + learner counts. Long narrative text uses a **collapse/expand** control. |
| **S24** NC II roster (16 names) | `NC II` step | NEW — no roster field. |
| **S25** NC II context (16 CSS, ICST, monitored) | `NC II` panels | MATCH. |
| **S26 / S35** Stakeholder support + "Visible Monitoring = Quality Results" | `Work Immersion` step | MATCH (maxim already in `ImmersionVisual`). |
| **S36** Budget ES, **S37** Budget JHS | `Budget Overview` / `SOB 2026` `budgetRows` | MATCH (exact, incl. total 604,565.07). |

## D. Static-HTML deck → `public/PIR 2026.dc.html`
- **S1** title/institution/outline → Title + Outline sections. MATCH.
- **S2** School Profile → School Profile section (redesigned). MATCH.
- Budget narrative → MOOE Management section.
- **S38** "Thank you!" → Thank You section. MATCH.

## E. No current home (new slide/section or a decision)
1. **S10–S11** Institutional Matrix — enrollment programs / limitations / strengthen / introduce / SDO reasons.
2. **S21–S22** Strategic Review — assessment action framework (same 6-part shape).
3. **S23** PIR Q&A template — "Middle Performers" (trend, programs, best practices, TA, challenges, requests).
4. **S24** NC II roster (16 names).
5. **S27–S34** documentation photos → `image-slot`s; **S30/S32** strategy captions.

---

# (b) Change classification — value edits vs. schema/UI work

### Group 1 — Pure value edits (existing fields; safe even mid-fragmentation)
- **Junior High target:** `dashboard.steps[2].targets[0]` 48 → 52.
- **Speaker notes / finding / action text:** refresh from S3/S5/S6/S7/S8 narratives and S12/S15 findings.
- Verify-only (already correct, no edit): Elementary (S4), ELLNA (S12), NAT G6 (S14), Budget ES/JHS (S36/S37), School Profile (S2).

### Group 2 — Data additions to existing arrays (no schema change; low risk)
- **NAT G10 (S15):** append 3 metric rows (Filipino, AP, English) to the existing `metrics` array —
  same `{label, group, value, target, unit}` shape; the radar/gauge already iterate `metrics`.
- **Senior High prior year (S8):** optional — add 2025-26 values if a 2-year SHS view is wanted (else value-only).

### Group 3 — Schema additions (new fields on existing types; touch the type + its renderer)
- **Kindergarten 3-year (S3):** convert the step from single-year `values` to `years/targets/actuals`
  (type already supports these optional fields) **and** switch its chart render to the multi-year style.
- **PHIL-IRI full (S16–S19):** **DECISION — keep ALL data, remove nothing.** Richer structure for
  Ind/Inst/Frust × language (Filipino/English) × key-stage (KS2/KS3) × year (2024-25/2025-26) + learner
  counts (totals and per-grade). Use a dedicated `philIri` shape and a new sub-visual (stacked
  Independent/Instructional/Frustration bars per language/year). **Long text → collapse/expand**, reusing
  an existing pattern: the carousel panel `maxHeight` expand (page.tsx) or the static deck's
  `.pir-long-wrap` "More/Less" toggle / `<details>` accordion.
- **Characterization drivers/bottlenecks (S20):** add `driver` / `bottleneck` per domain + show them.
- **NC II roster (S24):** add `roster: string[]` to the NC II step + a roster panel/grid.

### Group 4 — Net-new slides/components
- **S10–S11**, **S21–S22**, **S23**: new data objects + new section/carousel components.
- **S27–S34** photos: new `image-slot`s (and the image assets) for a work-immersion gallery.

### Group 5 — Source conflicts (RESOLVED)
- **Teacher count → 16** (confirmed). Canonical total = 16; School Profile already shows 16, so no change there.
  - ⚠️ Sub-detail: S9's narrative says "14 teachers (7 Elem / 5 JHS / 2 SHS)" which sums to 14. With the
    total fixed at 16, the S9 breakdown text needs reconciling (updated per-level distribution that totals 16,
    or keep the prose but correct "14" → "16"). Awaiting the corrected 7/5/2-style split if there is one;
    otherwise the narrative will read "16 teachers" without an itemized split.
- **JHS 2024-25 target → 52** (use data value; app's 48 is wrong). Handled in Group 1.

---

## Suggested execution order (after fragmentation settles)
1. Resolve Group 5 conflicts.
2. Apply Group 1 value edits + Group 2 array additions (quick, low risk).
3. Do Group 3 schema additions one type at a time (Kindergarten → NAT G10 done in G2 → PHIL-IRI → characterization → NC II roster).
4. Build Group 4 new sections last.
