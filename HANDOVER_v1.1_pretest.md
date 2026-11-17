# MealFit v1.1 pre-test build — Handover record

EE4213 Team 15 · Prepared 2026-11-12 for the usability test scheduled for 2026-11-13.

## 1. Confirmed team details (for a later document update)

| Name used | Full name | Student ID |
|---|---|---|
| Ken | CHAN TSZ KIN | 58530554 |
| Justin | YEUNG KI TSANG | 58531201 |
| Thomas | CHAN CHEUK YIN | 58529856 |
| Karson | CHU TING HEI | 58511933 |

## 2. Participant facts (do not overstate)

- Individual Project: each member interviewed 3 people, giving 12 interview sessions (12 人次) in total. It has not been checked whether anyone was interviewed by more than one member, so do not call them "12 different participants".
- Group prototype usability test: scheduled for 2026-11-13, with at least 3 users planned. No results exist yet. All result fields stay empty until the test is done.

## 3. Versions

| Version | Location | Git tag |
|---|---|---|
| v1.0 (before changes) | `versions/mealfit_v1.0_before_pretest/` (code + 19 screenshots) | `v1.0-before-pretest` (12272d8) |
| v1.1 pre-test build | `versions/mealfit_v1.1_pretest_build/` (code + 16 screenshots + check script + results) | `v1.1-pretest` (b593591) |

The hosted preview site was not changed or republished. It still runs v1.0.

## 4. Changed files

- `app.js`: version label, per-dish portions, price/value/budget logic, safety wording, nutrition badges, Today incomplete totals, report note.
- `data.js`: sample-data header, "Extra meat" only on 6 meat dishes, d8 marked unverified, two real label items added (d24, d25).
- `README.md`: notes updated.
- `staging/food_list_candidates.json` (new): the other 32 items from the team food list, held back from the app.

The original demo dishes and IDs (d1–d23) are unchanged, so the test script still works.

## 5. What changed (code-review fixes, not user-test findings)

1. Nutrition ranges are labelled "Simulated AI estimate", and the app says no AI model is called. Confidence is shown as "(demo)", not verified accuracy.
2. With estimates off or no data, values show "unknown" or "No nutrition data", never 0 and never "Fixed". Today shows "Total incomplete" and names the missing items.
3. Portion options are set per dish. Vegetarian dishes have no "Extra meat". The +HK$8 add-on is marked as a sample price.
4. With an add-on, the price, budget verdict, sorting and fit verdict update. No value label is shown because there is no typical price for the add-on.
5. Safety states are "No known conflict" (not a safety guarantee), "Not confirmed", "Cross-contact risk" and "Source not verified", each shown separately.
6. The report sheet saves the category and note. It says "Recorded in this prototype — not actually sent".

Food list: only item 1 (Vitasoy high-calcium low-fat milk, as d24) and item 20 (salmon onigiri, as d25) were added, using label nutrition only. Price, ingredients, allergens, certification and vegetarian status are not provided, so they show as "Price n/a" and "Not confirmed". Nothing was guessed. Both items are hidden from the default list because they have no price.

## 6. Acceptance checks

An automated headless Chromium run at 390 px passed 35 of 35 checks (`acceptance_results.txt`). Coverage:

- the full flow: criteria → results → detail → portion → swap → confirm → Today;
- vegetarian portions;
- unknown values with estimates off;
- budget after an add-on;
- the no-results state;
- the report note;
- tasks T1–T8;
- JS errors (none found);
- reload reset.

Still to check by hand (待人工驗收):

- the hosted link on a real phone;
- touch and scroll on the participant device;
- one full dry run of T1–T8 by a team member.

## 7. AI decision table (all items 待團隊確認)

| 建議 | 理由 | 實際改動 | 待團隊確認 |
|---|---|---|---|
| Label simulated nutrition and show confidence as a demo label | Avoid implying a real AI model or verified accuracy | Badges, "(demo)" tag, explanation text | Is this wording acceptable for the report? |
| Show unknown instead of 0 when there is no data | Counting unknown as 0 understates intake | "No nutrition data" tag and "Total incomplete" notice | Agree to keep for the test? |
| Offer "Extra meat" only on 6 meat dishes, at a sample +HK$8 | Vegetarian dishes must not offer meat | Portion options per dish | Confirm which dishes and the price |
| Show no value label for add-on prices | No comparable typical price exists | Value text and sorting handle a missing value | Agree? |
| Use safety wording without a guarantee | "Clear"/"safe" overstates the record | Four separate states | Agree to keep for the report? |
| Add only d24 and d25 from the food list | The other items are not needed by the test tasks and lack price and ingredient data | 2 items added, 32 staged | Keep, remove, or add prices? |

## 8. Pending document updates (Report / PPT / Excel / Test Kit not changed this round)

- Test Kit questionnaire: the item 'I would rely on dishes marked "Fixed value"…' and the "Trust Q1 Fixed value" row. The UI now says "Label value" / "Sample label value". This matters for tomorrow, so either read the item aloud as "Label value" or update the kit before testing.
- Report/PPT: wording such as "fixed value", "never Clear" and the safety states should match the four new labels.
- T7 success definition ("…and sends"): the button is now "Submit report" and nothing is actually sent.
- The team table, IDs and the "12 interview sessions" wording need updating after the test.
- The hosting guide and demo script still point to the v1.0 preview.

## 9. Update 2026-11-14 — v1.1.1 purchase locations (small change)

- Source: `Xiang-Gang-Yin-Pin-Ji-Shi-Pin-Ying-Yang-Biao-Qian-Zong-Lan-Han-Xiao-Shou-Dian.xlsx`, sheet 每包裝總覽. Only these columns were used: 編號, 品牌, 產品名稱, 淨含量, 單位, 銷售點.
- Matching: items were matched by brand + product name + net quantity + unit, with 編號 used only as a cross-check. All 34 items matched exactly (d24, d25 and 32 staged items). No ambiguous matches and no 編號 mismatches.
- Field: a new `purchaseLocations` list holds the 銷售點 text exactly as written (e.g. "AC1　學術大樓1"). Each item has one listed sale point; none are duplicated.
  - For d24 and d25 only, the `stall` text dropped "(store not specified)".
  - Prices, nutrition, ingredients, filters and test tasks are unchanged.
  - The new file's label values for these items match the earlier list.
- Display:
  - d24 and d25 cards and detail pages show "Available at 購買地點".
  - The detail page adds "listed sale point — not live stock or opening hours".
  - A real item with no location shows "not listed".
  - d1–d23 demo dishes show no location.
- Unchanged:
  - d24 and d25 still have no price, so they stay hidden by default.
  - Staged items are data-only and are not in the app.
- Checks: 11 of 11 scoped checks passed (`location_check.mjs`, `loc_results.txt`). They covered:
  - pairing;
  - location display (checked via "Show hidden");
  - the "not listed" case (checked by a test-only data change);
  - that d24 and d25 are still hidden;
  - the original flow;
  - JS errors (none found).
- Versions: the v1.1 snapshot (`v1.1-pretest`) is kept. The working version is tagged `v1.1.1-pretest-locations`. The hosted preview was not changed.

## 10. Update 2026-11-14 — v1.2-i18n-theme-pretest (interface language and theme)

- Scope: interface only. No new food, price, nutrition, location, map, GPS, account or backend. d1–d23 ids, prices, ingredients, nutrition and task paths are unchanged. Safety, budget, protein and swap logic are unchanged.
- Location label: d24/d25 `stall` no longer says "(store not specified)". English shows "Available at: AC1　學術大樓1"; the detail page adds "(listed sale point — not live stock or opening hours)". The Chinese interface shows 「購買地點：…」 and 「（清單所列銷售點 — 不代表即時有貨或營業時間）」. The sale-point text stays as written in the Excel.
- Language: English / 繁體中文 (Hong Kong wording). Switch in My criteria → "Language & display", plus a small button on Welcome. Default is English. Held in memory only; a reload returns to English. Switching keeps criteria (including an unsaved draft), portions, Today log, reports and the current screen. All strings live in `app.js` (`STR`) and `data.js` (`nameZh`, `labelZh`, `window.ZH`); there is no external translation service.
- Names: d1–d23 have a short `nameZh`. d24/d25 and staged items keep their original Chinese names. Brands, units, prices and numbers are not translated.
- Protective wording in Chinese: 沒有已知衝突 (+ 這不是安全保證), 未確認, 交叉接觸風險, 來源未核實, 模擬 AI 估算 (本原型沒有呼叫任何 AI 模型), 合計不完整, 僅記錄於本次原型，並未實際送出, and 示範資料 / 標籤數值 / 示範標籤數值 kept distinct. No 「安全」 claims except inside 「不是安全保證」.
- Theme: Light / Dark / System. Default is Light; session only (no localStorage). Done with CSS variables plus one `[data-theme="dark"]` override block. Status pills keep their icons and text. The light `--faint` colour was darkened (#8A918B → #656C66) because "typical HK$…" text measured 3.23:1, below WCAG AA.
- Checks (automated, not user testing): English T1–T8 regression 35/35 (`reg_results_v12.txt`). Scoped checks 95/95 (`v12_check.mjs`, `v12_results.txt`) at 390 px and 1280 px for en/light, zh/dark, zh/light and en/dark. They covered: defaults, language round-trip, d24/d25 locations, protective wording, no safety-guarantee wording, no leftover English UI words, no missing keys / undefined / JS errors, text contrast ≥ AA (computed), overflow, reload reset, and System following the device setting (emulated).
- 待人工檢查: System theme on a real phone that changes its OS theme mid-session; Chinese wording read by a Hong Kong team member; screen-reader reading of the language switch.
- Versions: v1.1.1 is kept (tag `v1.1.1-pretest-locations`, zip unchanged). New tag `v1.2-i18n-theme-pretest`. The hosted preview was not changed; Report / PPT / Excel / Test Kit were not changed.

