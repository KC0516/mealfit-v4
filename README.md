# MealFit V2.2 — Soft-Validation Update (EE4213 Team 15)

**Build:** `EE4213_Team15_MealFit_v2.2_soft-validation_build`
**Base:** `v2.1-input-controls_build` (all V2.1 changes carried over unchanged)
**Status:** every change below is traced to a numbered usability-test finding (F1–F5) from the moderated test sessions with P1 / P2 / P3.

---

## 1. What changed and why

| ID | Finding (from the test) | Change in this build | Where in the code |
|---|---|---|---|
| **F1** | The safety pill "Cross-contact risk" was clinical wording participants did not act on — P1 and P3 read it and still queued the dish | Pill renamed to **"May share equipment"**; ingredient tag renamed to **"Shared equipment"**; reason line now ends *"— ask staff to be sure"*; **every safety pill gained a `?` trigger** that opens a plain-language explainer modal (6 variants: no-conflict / not-confirmed / may-share-equipment / source-not-verified / conflict / no-avoid-list) | `app.js` `pillSafety()`, `safety()` labels, `render()` tip overlay, `styles.css` `.tip-btn` / `.tip-overlay` |
| **F2** | "Report wrong or missing info" was a small text link inside the ingredients box — P2 could not find it and reported nothing | **Report promoted into the bottom action bar** as a persistent, always-visible button ("Report"), with the ingredients link re-labelled **"See something wrong? Report it"** | `app.js` `vDetail()` action bar, `reportLink` / `reportShort` strings |
| **F3** | Participants could not tell a real label value from a simulated number — they treated both as fact | Inherited and kept from v1.3: 34 real packaged-food items with **"Label value"**, illustrative dishes marked **"Simulated AI estimate"**, unknown values never counted as 0 | `data.js` (d24–d57), `app.js` `sourceBadge()` |
| **F4** | "Not this" was ambiguous — P3 pressed it expecting the dish to disappear, not to get alternatives | Button renamed to **"Not this — find similar"**, given accent colour, and the sheet now asks *why* first (too pricey / need more protein / want something lighter / want something similar) before showing alternatives | `app.js` `vDetail()` action bar, `notThis` string |
| **F5** | The welcome screen opened with an abstract promise P1 did not connect to their task | Welcome copy rewritten in plain language: **"Tell us what you cannot eat."** (EN) / 「告訴我們你不能吃什麼。」(ZH) | `app.js` `w1` strings |
| **F6** | Avoid-list chips used a tick (check) icon — participants read it as "approved" instead of "I am avoiding this" | Icon swapped to **cross (X)** so the visual signal matches the action (exclude, not include) | `app.js` `vCriteria()` avoid chip template |
| **F7** | Budget slider was hard to set to an exact value — fine-grained control on a touch screen is error-prone | Replaced with a **number input** (type=number, min=10, max=80) with HK$ prefix, live clamping on input, hard clamp on blur, plus **4 quick-option chips** (HK$25 / 35 / 45 / 60) | `app.js` `vCriteria()` budget section, `input` + `blur` handlers; `styles.css` `.num-input` |
| **F8** | Protein goal used +/− stepper buttons in 5 g steps — you could not type an exact value, and there was no visible guard against negative numbers | Replaced with a **number input** (type=number) with "g / day" suffix. The calculator helper still works and fills the field | `app.js` `vCriteria()` protein section, `input` handler; `styles.css` `.num-input` |
| **F9** | V2.1 hard-clamped values on blur (below min → forced to min, above max → forced to max) — the system decided for the user instead of informing them | Replaced with **soft inline validation**: red error message appears below the field (budget: below HK$10 / above HK$80 / negative / empty; protein: below 30 g / above 250 g / negative / empty). The user keeps full control; values are only gently defaulted at save time if empty or negative | `app.js` `vCriteria()` error computation, `budgetError` / `proteinError` state, `field-error` CSS; `saveCrit` soft-fallback |

### Bug fixed during V2.0 verification

The **Report sheet crashed** with `ReferenceError: d is not defined` — a defect inherited from v1.3 where the sheet assigned to an undeclared variable. Clicking "Report" therefore produced a blank screen. Fixed in `app.js` (`const rd = dish(U.detail)`), which is what made F2 actually deliverable.

---

## 2. How to run

Static site, no build step, no login, no network calls.

```bash
cd EE4213_Team15_MealFit_v2.0_post_usability_build
python3 -m http.server 8000
# open http://localhost:8000
```

Open at phone width (~390 px) for the intended layout. State (criteria, Today's log, reports) is kept in `localStorage`; use **My criteria → Reset** to clear between test sessions.

## 3. Files

| File | Purpose |
|---|---|
| `index.html` | App shell |
| `app.js` | Screens, fit logic, safety labels + explainer overlay, report sheet, Today log, i18n |
| `data.js` | 23 illustrative canteen dishes (d1–d23) + 34 real packaged-food items with label values (d24–d57) |
| `styles.css` | Visual design; CSS variables with a `[data-theme="dark"]` override block |
| `HANDOVER_v1.1_pretest.md` | Earlier handover note, kept for continuity |

## 4. Verification

`verify_v22.js` drives the built prototype in a real browser (Chromium, 390×844) and asserts every change above plus the untouched core flow (browse → criteria → dish detail → report → swap → add to today → search → Today → language → dark mode).

Result of the last run: **36 / 36 checks passed, 0 uncaught JavaScript errors.** Screenshots from that run are in `screenshots_v2.2/`.

## 5. Notes and limits

- Nutrition ranges for the illustrative dishes are pre-computed sample values that simulate model output; **the prototype does not call any AI model**.
- The `?` explainer is static help text attached to each verdict state, not a generated answer.
- "Report" records the category and note locally in this session only; nothing is sent to a real stall.
- Real label items have no live price, stock or opening-hours data; "Available at" is a listed sale point as written on the food list.
- Dish, stall and price data are illustrative and are not official campus data.
- MealFit is not medical advice.
