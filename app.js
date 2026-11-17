/* MealFit — EE4213 Team 15 group prototype. Vanilla JS, memory routing, device-only storage. */
(function () {
  'use strict';
  const VERSION = 'v2.2-soft-validation';

  // ---------- storage ----------
  // Prototype keeps everything in memory (nothing leaves the device; a reload starts a fresh session,
  // which also makes resetting between usability-test participants easy).
  let MEM = null;
  const store = { get() { return MEM; }, set(v) { MEM = JSON.parse(JSON.stringify(v)); }, clear() { MEM = null; } };
  const DEFAULT_CRIT = { avoid: [], budget: 40, trackProtein: true, dailyProtein: 105, facts: ['protein', 'kcal', 'fullness'], useAI: true };
  function fresh() {
    return { onboarded: false, crit: JSON.parse(JSON.stringify(DEFAULT_CRIT)), mode: 'meal', log: [], reports: {}, feedback: {}, portion: {} };
  }
  let P = Object.assign(fresh(), store.get() || {});
  const save = () => store.set(P);

  // UI (non-persisted) state. Language and theme live here too: session memory only, so a reload
  // always returns to English + Light + Welcome (the test reset method is unchanged).
  const U = { screen: P.onboarded ? 'menu' : 'welcome', cat: 'all', sort: 'fit', showHidden: false, q: '', detail: null, from: 'menu', draft: null, sheet: null, toast: null, explain: false, notThis: null, lang: 'en', theme: 'light', tip: null };

  // ---------- interface text (English / Traditional Chinese) ----------
  // Only interface text and hints are translated. Data-source wording from the team food list,
  // sale-point names, brands, units, prices and nutrition numbers are never translated.
  const STR = {
    en: {
      brandSub: 'campus', langAria: 'Language',
      wTitle: 'Know if a campus dish fits you — before you queue.',
      w1: '<b>Tell us what you cannot eat.</b> Dishes that definitely contain it are hidden. Dishes where we are not sure — shared equipment, unconfirmed ingredients — are flagged instead. <i>This is a guide, not a safety guarantee.</i>',
      w2: '<b>Within your budget.</b> See the price against the typical campus price.',
      w3: '<b>Fits your goal.</b> Protein shown as a label value or a clearly marked estimate range.',
      cantT: "What MealFit can't do",
      cantP: 'In this prototype, estimate ranges and confidence labels are simulated sample values — no AI model is called. Ingredient records come from stalls and students and may be out of date — if you have a severe allergy, still confirm with staff. Not medical or nutrition advice.',
      start: 'Set my criteria (30 sec)', browse: 'Just browse the menu',
      wFine: v => `Prototype ${v} · dishes, prices and ingredients are sample data for testing, except items marked “Label value”.`,
      tabMenu: 'Menu', tabToday: 'Today', tabCrit: 'My criteria', navAria: 'Main', back: 'Back',
      findMeal: 'Find a meal', whyAria: 'Why this order?', editCritAria: 'Edit my criteria', edit: 'Edit',
      avoidSum: l => 'Avoid: ' + l, noAvoidList: 'No avoid-list', goalSum: (g, m) => `${g} g protein / ${m}`, noGoal: 'No protein goal',
      mealOrSnack: 'Meal or snack', fullMeal: 'Full meal', lightSnack: 'Light snack', searchPh: 'Search dish or stall',
      options: n => `${n} option${n === 1 ? '' : 's'} · sorted by`, sortAria: 'Sort by', sortFit: 'Best fit for me', sortPrice: 'Lowest price', sortProtein: 'Most protein',
      showingAll: (a, b, c) => `Showing all dishes, including ${a} that conflict, ${b} over budget and ${c} without a price.`,
      hiddenPre: 'Hidden: ', hiddenEnd: '.', hidSep: ' · ',
      hidAvoid: n => `<b>${n}</b> contain something you avoid`, hidBudget: n => `<b>${n}</b> over your budget`, hidNoPrice: n => `<b>${n}</b> without a price`,
      hideThem: 'Hide them', showThem: 'Show them',
      emptyT: 'No dish matches all your criteria here.', emptyP: 'Try a higher budget, another category, or show hidden dishes.', showHiddenBtn: 'Show hidden dishes',
      menuFine: 'Sample data for prototype testing — not real stall records. Estimates are simulated. “Label value” items come from the team food list.',
      notRated: 'not rated', fullAria: n => `Fullness ${n} of 5`, noData: 'no data', notOnLabel: 'not on label',
      srcAiOff: 'AI estimate off · no data', srcNone: 'No nutrition data', srcLabel: 'Label value', srcSample: 'Sample label value', srcAi: 'Simulated AI estimate',
      priceNA: 'Price n/a <small>not provided</small>', extraDetail: 'with Extra meat · no typical price for this add-on, so no value label', extraCard: 'add-on · no typical',
      typDetail: (t, v) => `typical HK$${t}${v ? ' · ' + v : ''}`, typCard: t => `typical ${t}`, recipeUpd: 'Recipe updated',
      availAt: 'Available at: ', notListed: 'not listed', notLive: ' (listed sale point — not live stock or opening hours)', locSep: ' · ',
      v_good: 'Good fit', v_likely: 'Likely fit', v_part: 'Partial fit', v_no: 'Not for you',
      s_none: 'No avoid-list set', s_noneShort: 'No avoid-list', s_clear: 'No known conflict', s_unconf: 'Not confirmed', s_cross: 'May share equipment', s_unv: 'Source not verified', s_conflict: 'Conflict',
      contains: n => `Contains ${n}`, nameSep: ', ',
      r_unkIng: 'Ingredients not in our records (not confirmed) — check the pack label',
      r_main: n => `Contains ${n} (main ingredient)`, r_field: (n, k) => `Contains ${n} (${k.toLowerCase()})`,
      r_fieldUnconf: k => `${k} not confirmed by stall`, r_cross: (k, n) => `${k}: may share equipment with ${n} — ask staff to be sure`,
      r_unv: 'Source not verified: this record comes from a student report, not the stall',
      b_na: 'Price not provided', b_ok: b => `Within HK$${b}`, b_over: x => `HK$${x} over budget`,
      val_good: 'Good value', val_fair: 'Fair price', val_above: 'Above typical',
      p_naRange: r => `${r} protein`, p_noGoal: 'No goal set', p_off: 'No verified nutrition', p_fits: g => `Meets ${g} g goal`, p_may: g => `May meet ${g} g goal`, p_partial: g => `Partly meets ${g} g`, p_low: g => `Below ${g} g goal`,
      mode_meal: 'meal', mode_snack: 'snack',
      i_unconf: 'Not confirmed', i_cross: 'Shared equipment', i_conflict: 'Conflicts with your list', i_notListed: 'Not listed by stall', i_ingredients: 'Ingredients', i_notInRec: 'Not in our records', i_main: 'Main ingredient',
      portionAria: 'Portion', portion_less: 'Less rice / noodles', portion_regular: 'Regular', portion_extra: 'Extra meat', extraBtn: 'Extra meat +HK$8',
      portionNote: 'Changing the portion updates this estimate, price and verdict for you only. Portion changes and the +HK$8 add-on price are sample values.',
      fullRating: 'Fullness (student rating)',
      aiOffNote: 'AI estimates are turned off in My criteria. This dish has no nutrition label, so no values are shown — they are unknown, not zero.', noNutItem: 'No nutrition data for this item.',
      conf: c => `${c} confidence (demo)`, confTitle: 'Demo label, not a verified accuracy', c_high: 'high', c_medium: 'medium', c_low: 'low',
      hide: 'Hide', howEst: 'How was this estimated?',
      explain1: b => `<b>Prototype note:</b> this range is pre-set sample data that simulates an AI estimate for ${b}. No AI model is called in this prototype. A full version would estimate from the stall's recipe and a typical serving, and show a range because real portions vary.`,
      ex_low: '<b>Low confidence (demo label):</b> this dish varies a lot, so the range is wide. Treat it as a rough guide.',
      ex_high: '<b>High confidence (demo label):</b> portion is consistent and the recipe is simple.',
      ex_medium: '<b>Medium confidence (demo label):</b> the recipe is known but serving size varies.',
      ex_demo: ' The confidence label is for demonstration and is not a verified accuracy.',
      ex_limit: 'Known limitation: estimates are less reliable for local mixed dishes and sauces.',
      realNote: q => `Copied as provided from the product nutrition label in the team food list (per ${q} pack). Fields not on the label are shown as “not on label”, not 0.`,
      sampleNote: 'Sample label values made up for testing — not from a real label. Not estimated by AI.',
      fbQ: 'Does this estimate look right to you?', fb_low: 'Too low', fb_ok: 'About right', fb_high: 'Too high',
      fbNote: 'Recorded in this prototype session only — not sent. It does not change what anyone else sees.',
      changeNote: c => `<b>Recipe updated.</b> ${c} Check the ingredients again if you usually skip this dish.`,
      reportedNote: (c, n) => `<b>You reported: ${c}.</b>${n ? ` Note: “${n}”.` : ''} Recorded in this prototype session only — not sent to a real team.`,
      whyVerdict: 'Why this verdict', noAvoidSet: 'You have not set an avoid-list.',
      clearWhy: 'No known conflict: nothing on your avoid-list appears in this record. This is not a safety guarantee — if you have a severe allergy, still confirm with staff.',
      budgetNA: 'The price was not provided, so the budget cannot be checked.',
      budgetWhy: (p, x, b) => `Price HK$${p}${x ? ' (with Extra meat)' : ''} vs your meal budget of HK$${b}.`,
      notTracking: 'You are not tracking protein.', pw_ai: 'Simulated estimate', pw_label: 'Label value', pw_sample: 'Sample label value',
      proteinWhy: (s, r, g, m, d, k) => `${s} ${r} vs your ${g} g ${m} goal (daily ${d} g ÷ ${k}).`, noVerNut: 'No verified nutrition for this dish.',
      whatsIn: "What's in it", srcPre: 'Source: ', srcSampleWrap: s => 'Sample data (' + s.toLowerCase() + ')', srcUnv: ' · not verified by stall', updated: d => ` · Updated ${d}`,
      days: n => n == null ? 'date not provided' : n === 0 ? 'today' : n === 1 ? 'yesterday' : n < 14 ? `${n} days ago` : `${Math.round(n / 7)} weeks ago`,
      reportLink: 'See something wrong? Report it',
      reportShort: 'Report', nutrition: 'Nutrition', notThis: 'Not this — find similar', addToday: 'Add to today',
      today: 'Today', tg_ai: 'Simulated est.', tg_sample: 'Sample label', tg_label: 'Label', tg_none: 'No nutrition data',
      incomplete: (n, names) => `<b>Total incomplete.</b> ${n} logged item${n > 1 ? 's have' : ' has'} no nutrition data (${names}). ${n > 1 ? 'They are' : 'It is'} not counted as 0 — the real total is higher than shown.`,
      proteinSoFar: 'Protein so far', ofGoal: (g, m) => `of ${g} g daily goal${m ? ' · incomplete' : ''}`, reached: 'You have reached your daily goal.',
      left: (x, m) => `${m ? 'At most about' : 'About'} ${x} g left for the rest of today${m ? ', counting only items with data' : ''}.`, nothingYet: 'Nothing logged yet.',
      inclEst: ' Includes simulated estimates, so treat it as a range.', spentToday: 'Spent today',
      noPriceNote: n => `${n} item${n > 1 ? 's have' : ' has'} no price, so this total is incomplete.`, logged: 'Logged',
      logPriceNA: 'price n/a', logProtein: r => `${r} protein`, logProteinUnk: 'protein unknown', removeAria: n => `Remove ${n}`,
      emptyLog: 'Nothing logged yet. After you decide on a dish, tap “Add to today”.', todayFine: 'Stays on this device only. In this prototype, reloading the page starts a fresh session.',
      setCrit: 'Set my criteria', myCrit: 'My criteria', q1: 'What must you avoid?',
      q1hint: 'Dishes with a known conflict are hidden. If an ingredient is unknown, the record is unverified or there is a cross-contact risk, we flag it — we never call it safe.',
      q2: 'Budget per meal', q3: 'Protein goal', budgetHint: 'Type a value or tap a quick option.', gPerDay: 'g / day', errBudgetLow: 'Budget must be at least HK$10.', errBudgetHigh: 'Budget is above HK$80 — most campus meals are below that.', errBudgetNeg: 'Budget cannot be negative.', errBudgetEmpty: 'Enter a budget to see matching dishes.', errProteinLow: 'Protein goal must be at least 30 g.', errProteinHigh: 'Protein goal is above 250 g — that is very high for most people.', errProteinNeg: 'Protein goal cannot be negative.', errProteinEmpty: 'Enter a daily protein goal.', optional: 'optional', trackLbl: "I'm trying to hit a daily protein target", dec: 'Decrease', inc: 'Increase',
      perDay: x => `per day · ≈ ${x} g per meal`, calcClose: 'Close estimate helper', calcOpen: 'Not sure? Help me estimate', bodyW: 'Body weight (kg)', g_maintain: 'Stay active', g_build: 'Build muscle',
      calcRange: (a, b, r) => `General range: <b>${a}–${b} g/day</b> (${r} g per kg). A general estimate, not medical advice — edit it freely.`, useG: x => `Use ${x} g`,
      noGoalHint: 'No problem — dishes will show protein values without a goal verdict.',
      q4: 'Show on each card', pick3: 'pick up to 3', selected: n => `${n}/3 selected. Everything else is still in the dish details.`,
      aiBox: 'AI estimates & your data', aiToggle: 'Show AI-estimated nutrition for dishes without a label (simulated in this prototype)',
      aiHint: 'When off, those dishes show “no data” — unknown, never 0. AI never decides whether a dish conflicts with your avoid-list; that only comes from stall and label records. Your criteria and log stay on this device (in this prototype, a page reload clears them).',
      resetLink: 'Reset prototype (clear all data)',
      dispBox: 'Language & display', langLbl: 'Language', themeLbl: 'Theme', th_light: 'Light', th_dark: 'Dark', th_system: 'System',
      dispHint: 'Applies right away and only for this session. A page reload returns to English and Light.',
      critFine: v => `MealFit v2.0 (post-usability update) · EE4213 Team 15 · sample data`, showMatches: 'Show my matches', saveChanges: 'Save changes',
      whyT: 'How the list is ordered',
      why1: '<b>No known conflict with your avoid-list</b> — dishes with a known conflict are hidden; “not confirmed”, “source not verified” and “cross-contact” ones come after.',
      why2: '<b>Within your budget</b> — over-budget dishes and items without a price are hidden unless you show them. Add-ons change the price.',
      why3: '<b>Closest to your protein goal</b> — using the label value or the simulated estimate range.',
      safetyTip: 'What do these labels mean?',
      tip_clear: '<b>No known conflict</b> — nothing on your avoid-list is in the confirmed record. Still double-check with staff if you have a severe allergy.',
      tip_unconf: '<b>Not confirmed</b> — this ingredient is not in the stall’s confirmed record. It might be fine, but we don’t know for sure.',
      tip_cross: '<b>May share equipment</b> — the dish itself does not contain your avoid-item, but it might be prepared on the same surface or equipment. Ask staff if you need to be sure.',
      tip_unv: '<b>Source not verified</b> — this record comes from a student report, not directly from the stall.',
      tip_conflict: '<b>Conflicts with your list</b> — this dish contains something on your avoid-list.',
      tip_none: '<b>No avoid-list set</b> — set what you cannot eat in My criteria, and MealFit will check every dish against it.',
      why4: '<b>Better value</b> — price compared with the typical campus price, only when one is available (add-on versions have none).',
      whyFine: 'The order is a simple rule, not a hidden AI score. It only changes when you change your criteria.', gotIt: 'Got it',
      ntT: 'Not this one? Why not?', rs_pricey: 'Too pricey', rs_protein: 'Need more protein', rs_lighter: 'Want something lighter', rs_mood: 'Not in the mood',
      swapsHint: 'Swaps that still respect your avoid-list and budget:', noSwap: 'No swap matches that reason within your criteria. Try another reason or raise your budget.',
      pickReason: 'Pick a reason and we’ll suggest up to 3 swaps.', keepLooking: 'Keep looking myself',
      a_pricey: (x, r) => `HK$${x} cheaper · ${r ? r + ' protein' : 'no nutrition data'}`, a_protein: (x, p) => `+${x} g protein (approx.) · HK$${p}`,
      a_lighter: (k, r) => `${k} · ${r} protein`, a_mood: (v, p) => `Different option · ${v.toLowerCase()} · HK$${p}`,
      addT: 'Add to today?', c_price: 'Price', c_protein: 'Protein', c_kcal: 'Calories', na: 'n/a', unknown: 'unknown',
      addNoNut: 'No nutrition data: Today will list this item as missing and mark the total as incomplete (not counted as 0). You can remove it later.',
      addAi: 'Values are a simulated estimate range. You can remove this later in Today.', addFixed: 'You can remove this later in Today.',
      addConflict: r => `<b>This dish conflicts with your avoid-list:</b> ${r}. You can still log it if you choose.`, cancel: 'Cancel', confirm: 'Confirm',
      repT: 'Report a problem', rp_ing: 'An ingredient is wrong or missing', rp_nut: 'Nutrition looks wrong', rp_price: 'Price has changed', rp_gone: 'Dish no longer sold',
      repDetails: 'Details (optional)', repPh: 'e.g. staff said the soup uses pork bone',
      repFine: 'Prototype only: there is no server, so your report is recorded in this session and <b>not actually sent</b>. In a full version, the team would check with the stall before the shared record changes.',
      submitReport: 'Submit report',
      resetT: 'Reset the prototype?', resetP: "This clears your criteria, today's log and reports on this device. Use it between test sessions.", resetBtn: 'Reset',
      t_snack: 'Showing light options · snack-sized protein goal', t_meal: 'Showing full meals', t_pick3: 'Pick up to 3 — remove one first', t_swapped: 'Swapped — here is the alternative',
      t_removed: n => `Removed ${n}`, t_goalUpd: 'Daily goal updated — you can still edit it', t_first: 'Showing dishes that fit your criteria', t_saved: 'Criteria saved · results updated',
      t_added: n => `Added ${n} to today`, undo: 'Undo', t_reported: 'Recorded in this prototype — not actually sent', t_reset: 'Prototype reset'
    },
    zh: {
      brandSub: '校園', langAria: '語言',
      wTitle: '排隊前，先知道校園餐點是否適合你。',
      w1: '<b>告訴我們你不能吃什麼。</b>確定含有該項目的餐點會被隱藏；不確定的（例如共用器具、未確認成分）會被標示。<i>此為參考，不作為安全保證。</i>',
      w2: '<b>在預算之內。</b>比較價格與校園一般價格。',
      w3: '<b>配合你的目標。</b>蛋白質以標籤數值，或清楚標示的估算範圍顯示。',
      cantT: 'MealFit 做不到的事',
      safetyTip: '這些標籤代表什麼？',
      tip_clear: '<b>沒有已知衝突</b> — 這份紀錄中沒有出現你避食清單上的項目。如有嚴重過敏，請仍向職員確認。',
      tip_unconf: '<b>未確認</b> — 這項成分不在攤檔已確認的紀錄中。可能是安全的，但我們不能確定。',
      tip_cross: '<b>可能共用器具</b> — 餐點本身不含你避食的項目，但可能在同一枱面或器具上處理。如需確定，請向職員查詢。',
      tip_unv: '<b>來源未核實</b> — 這份紀錄來自學生報告，並非攤檔直接提供。',
      tip_conflict: '<b>與你的清單衝突</b> — 這道餐點含有你避食清單上的項目。',
      tip_none: '<b>尚未設定避食清單</b> — 請先在「我的條件」設定你不能吃的項目，MealFit 便會逐一檢查每道餐點。',
      cantP: '在本原型中，估算範圍和信心標籤都是模擬的示範數值 — 原型沒有呼叫任何 AI 模型。成分紀錄來自檔主及學生，可能已經過時 — 如有嚴重過敏，請仍向職員確認。這不是醫療或營養建議。',
      start: '設定我的條件（30 秒）', browse: '只瀏覽餐單',
      wFine: v => `原型 ${v} · 除標示「標籤數值」的項目外，餐點、價格和成分均為測試用示範資料。`,
      tabMenu: '餐單', tabToday: '今日', tabCrit: '我的條件', navAria: '主選單', back: '返回',
      findMeal: '揀餐', whyAria: '為何這樣排序？', editCritAria: '修改我的條件', edit: '修改',
      avoidSum: l => '避免：' + l, noAvoidList: '無避食清單', goalSum: (g, m) => `${m === 'snack' ? '每份小食' : '每餐'} ${g} g 蛋白質`, noGoal: '沒有蛋白質目標',
      mealOrSnack: '正餐或小食', fullMeal: '正餐', lightSnack: '小食', searchPh: '搜尋餐點或檔口',
      options: n => `${n} 個選擇 · 排序：`, sortAria: '排序方式', sortFit: '最適合我', sortPrice: '最便宜', sortProtein: '蛋白質最多',
      showingAll: (a, b, c) => `正顯示全部餐點，包括 ${a} 個有衝突、${b} 個超出預算及 ${c} 個沒有價格。`,
      hiddenPre: '已隱藏：', hiddenEnd: '。', hidSep: '；',
      hidAvoid: n => `<b>${n}</b> 個含有你避免的材料`, hidBudget: n => `<b>${n}</b> 個超出預算`, hidNoPrice: n => `<b>${n}</b> 個沒有價格`,
      hideThem: '隱藏', showThem: '顯示',
      emptyT: '這裡沒有完全符合你條件的餐點。', emptyP: '可提高預算、轉換類別，或顯示已隱藏的餐點。', showHiddenBtn: '顯示已隱藏的餐點',
      menuFine: '原型測試用示範資料 — 並非真實檔口紀錄。估算均為模擬。「標籤數值」項目來自小組食品清單。',
      notRated: '未評分', fullAria: n => `飽肚感 ${n}／5`, noData: '沒有數據', notOnLabel: '標籤未列出',
      srcAiOff: 'AI 估算已關閉 · 沒有數據', srcNone: '沒有營養數據', srcLabel: '標籤數值', srcSample: '示範標籤數值', srcAi: '模擬 AI 估算',
      priceNA: '價格不詳 <small>未提供</small>', extraDetail: '已加肉 · 加配沒有一般價格可比較，所以不顯示價值標籤', extraCard: '加配 · 無一般價',
      typDetail: (t, v) => `一般價 HK$${t}${v ? ' · ' + v : ''}`, typCard: t => `一般價 ${t}`, recipeUpd: '食譜已更新',
      availAt: '購買地點：', notListed: '未列出', notLive: '（清單所列銷售點 — 不代表即時有貨或營業時間）', locSep: ' · ',
      v_good: '合適', v_likely: '大致合適', v_part: '部分合適', v_no: '不適合你',
      s_none: '未設定避食清單', s_noneShort: '無避食清單', s_clear: '沒有已知衝突', s_unconf: '未確認', s_cross: '可能共用器具', s_unv: '來源未核實', s_conflict: '有衝突',
      contains: n => `含${n}`, nameSep: '、',
      r_unkIng: '我們的紀錄沒有成分資料（未確認）— 請查看包裝標籤',
      r_main: n => `含${n}（主要材料）`, r_field: (n, k) => `含${n}（${k}）`,
      r_fieldUnconf: k => `${k}：檔主未確認`, r_cross: (k, n) => `${k}：可能與${n}共用器具 — 如需確定，請向職員查詢`,
      r_unv: '來源未核實：此紀錄來自學生回報，並非由檔主提供',
      b_na: '未提供價格', b_ok: b => `在 HK$${b} 預算內`, b_over: x => `超出預算 HK$${x}`,
      val_good: '抵食', val_fair: '價錢合理', val_above: '高於一般價格',
      p_naRange: r => `蛋白質 ${r}`, p_noGoal: '未設目標', p_off: '沒有已核實營養數據', p_fits: g => `達到 ${g} g 目標`, p_may: g => `可能達到 ${g} g 目標`, p_partial: g => `部分達到 ${g} g`, p_low: g => `低於 ${g} g 目標`,
      mode_meal: '每餐', mode_snack: '每份小食',
      i_unconf: '未確認', i_cross: '共用器具', i_conflict: '與你的清單衝突', i_notListed: '檔主未列出', i_ingredients: '成分', i_notInRec: '我們沒有紀錄', i_main: '主要材料',
      portionAria: '份量', portion_less: '少飯／少麵', portion_regular: '正常', portion_extra: '加肉', extraBtn: '加肉 +HK$8',
      portionNote: '更改份量只會為你更新此估算、價格和結果。份量變化及 +HK$8 加配價均為示範數值。',
      fullRating: '飽肚感（學生評分）',
      aiOffNote: '你已在「我的條件」關閉 AI 估算。這款餐點沒有營養標籤，所以不顯示數值 — 數值是未知，不是零。', noNutItem: '這個項目沒有營養數據。',
      conf: c => `${c}信心（示範）`, confTitle: '示範標籤，並非已核實的準確度', c_high: '高', c_medium: '中', c_low: '低',
      hide: '收起', howEst: '這個估算怎樣得出？',
      explain1: b => `<b>原型說明：</b>這個範圍是預先設定的示範資料，模擬以「${b}」作 AI 估算的結果。本原型沒有呼叫任何 AI 模型。完整版本會根據檔主食譜和一般份量估算，並因實際份量有差異而顯示範圍。`,
      ex_low: '<b>低信心（示範標籤）：</b>這款餐點差異很大，所以範圍較闊，只宜作粗略參考。',
      ex_high: '<b>高信心（示範標籤）：</b>份量穩定，食譜簡單。',
      ex_medium: '<b>中信心（示範標籤）：</b>食譜已知，但份量會有差異。',
      ex_demo: '信心標籤只作示範，並非已核實的準確度。',
      ex_limit: '已知限制：本地混合菜式和醬汁的估算較不可靠。',
      realNote: q => `按小組食品清單中的產品營養標籤照錄（每包 ${q}）。標籤沒有列出的項目顯示為「標籤未列出」，不當作 0。`,
      sampleNote: '為測試而設的示範標籤數值 — 並非來自真實標籤，也不是 AI 估算。',
      fbQ: '你覺得這個估算合理嗎？', fb_low: '偏低', fb_ok: '差不多', fb_high: '偏高',
      fbNote: '只記錄於本次原型 — 並未送出，也不會改變其他人看到的內容。',
      changeNote: c => `<b>食譜已更新。</b>${c}如你平時會避開這款餐點，請再檢查成分。`,
      reportedNote: (c, n) => `<b>你已回報：${c}。</b>${n ? `備註：「${n}」。` : ''}僅記錄於本次原型，並未實際送出給任何團隊。`,
      whyVerdict: '結果原因', noAvoidSet: '你未設定避食清單。',
      clearWhy: '沒有已知衝突：這份紀錄中沒有出現你避食清單上的項目。這不是安全保證 — 如有嚴重過敏，請仍向職員確認。',
      budgetNA: '未有提供價格，所以無法檢查預算。',
      budgetWhy: (p, x, b) => `價格 HK$${p}${x ? '（已加肉）' : ''}，你的每餐預算為 HK$${b}。`,
      notTracking: '你沒有追蹤蛋白質。', pw_ai: '模擬估算', pw_label: '標籤數值', pw_sample: '示範標籤數值',
      proteinWhy: (s, r, g, m, d, k) => `${s} ${r}，你的${m}目標為 ${g} g（每日 ${d} g ÷ ${k}）。`, noVerNut: '這款餐點沒有已核實的營養數據。',
      whatsIn: '成分', srcPre: '來源：', srcSampleWrap: s => '示範資料（' + s + '）', srcUnv: ' · 檔主未核實', updated: d => ` · 更新：${d}`,
      days: n => n == null ? '未提供日期' : n === 0 ? '今日' : n === 1 ? '昨日' : n < 14 ? `${n} 日前` : `${Math.round(n / 7)} 星期前`,
      reportLink: '發現有問題？回報它', reportShort: '回報', nutrition: '營養', notThis: '不要這個 — 找相似的', addToday: '加入今日',
      today: '今日', tg_ai: '模擬估算', tg_sample: '示範標籤', tg_label: '標籤', tg_none: '沒有營養數據',
      incomplete: (n, names) => `<b>合計不完整。</b>已記錄的 ${n} 個項目沒有營養數據（${names}）。這些項目不當作 0 計算 — 實際合計會高於顯示數字。`,
      proteinSoFar: '目前蛋白質', ofGoal: (g, m) => `每日目標 ${g} g${m ? ' · 不完整' : ''}`, reached: '你已達到每日目標。',
      left: (x, m) => `今日餘下${m ? '最多約' : '約'} ${x} g${m ? '（只計算有數據的項目）' : ''}。`, nothingYet: '尚未有紀錄。',
      inclEst: '當中包括模擬估算，請視作一個範圍。', spentToday: '今日花費',
      noPriceNote: n => `有 ${n} 個項目沒有價格，所以此合計不完整。`, logged: '已記錄',
      logPriceNA: '價格不詳', logProtein: r => `蛋白質 ${r}`, logProteinUnk: '蛋白質不明', removeAria: n => `移除 ${n}`,
      emptyLog: '尚未有紀錄。決定好餐點後，按「加入今日」。', todayFine: '資料只留在這部裝置。在本原型中，重新整理頁面會開始新的一節。',
      setCrit: '設定我的條件', myCrit: '我的條件', q1: '你必須避免甚麼？',
      q1hint: '有已知衝突的餐點會被隱藏。如成分不明、紀錄未核實或可能共用器具，我們會加上標示 — 絕不會當作沒有問題。',
      q2: '每餐預算', q3: '蛋白質目標', budgetHint: '輸入金額或點擊快速選項。', gPerDay: '克／日', errBudgetLow: '預算最少為 HK$10。', errBudgetHigh: '預算高於 HK$80 — 校園餐點通常低於此價格。', errBudgetNeg: '預算不能是負數。', errBudgetEmpty: '請輸入預算以查看符合的餐點。', errProteinLow: '蛋白質目標最少為 30 克。', errProteinHigh: '蛋白質目標高於 250 克 — 對大多數人來說非常高。', errProteinNeg: '蛋白質目標不能是負數。', errProteinEmpty: '請輸入每日蛋白質目標。', optional: '選填', trackLbl: '我想達到每日蛋白質目標', dec: '減少', inc: '增加',
      perDay: x => `每日 · 約每餐 ${x} g`, calcClose: '關閉估算工具', calcOpen: '不肯定？幫我估算', bodyW: '體重（kg）', g_maintain: '保持活躍', g_build: '增肌',
      calcRange: (a, b, r) => `一般範圍：<b>每日 ${a}–${b} g</b>（每 kg 體重 ${r} g）。只屬一般估算，並非醫療建議 — 可隨意修改。`, useG: x => `使用 ${x} g`,
      noGoalHint: '沒問題 — 餐點會顯示蛋白質數值，但不會判斷是否達標。',
      q4: '每張卡片顯示', pick3: '最多選 3 項', selected: n => `已選 ${n}/3。其他資料仍可在餐點詳情查看。`,
      aiBox: 'AI 估算及你的資料', aiToggle: '為沒有標籤的餐點顯示 AI 估算營養（本原型為模擬）',
      aiHint: '關閉後，這些餐點會顯示「沒有數據」— 即未知，絕不當作 0。AI 不會決定餐點是否與你的避食清單衝突；這只會根據檔主及標籤紀錄判斷。你的條件和紀錄只留在這部裝置（在本原型中，重新整理頁面會清除）。',
      resetLink: '重設原型（清除所有資料）',
      dispBox: '語言及顯示', langLbl: '語言', themeLbl: '顯示模式', th_light: '淺色', th_dark: '深色', th_system: '跟隨系統',
      dispHint: '即時生效，只適用於本節。重新整理頁面會回到 English 及淺色模式。',
      critFine: v => `MealFit 原型 ${v} · EE4213 Team 15 · 示範資料`, showMatches: '顯示合適餐點', saveChanges: '儲存變更',
      whyT: '清單如何排序',
      why1: '<b>與避食清單沒有已知衝突</b> — 有已知衝突的餐點會被隱藏；「未確認」、「來源未核實」及「可能共用器具」的餐點排在後面。',
      why2: '<b>在預算之內</b> — 超出預算及沒有價格的項目會被隱藏，除非你選擇顯示。加配會改變價格。',
      why3: '<b>最接近你的蛋白質目標</b> — 根據標籤數值或模擬估算範圍。',
      why4: '<b>較抵食</b> — 只在有一般價格時，與校園一般價格比較（加配版本沒有一般價格）。',
      whyFine: '排序是簡單規則，並非隱藏的 AI 評分，只會在你更改條件時改變。', gotIt: '明白',
      ntT: '不要這個？原因是？', rs_pricey: '太貴', rs_protein: '需要更多蛋白質', rs_lighter: '想吃輕一點', rs_mood: '不想吃這個',
      swapsHint: '仍符合你避食清單及預算的替代選擇：', noSwap: '在你的條件內，沒有符合這個原因的替代選擇。請試另一個原因或提高預算。',
      pickReason: '選擇原因後，我們會建議最多 3 個替代選擇。', keepLooking: '我自己再看看',
      a_pricey: (x, r) => `平 HK$${x} · ${r ? '蛋白質 ' + r : '沒有營養數據'}`, a_protein: (x, p) => `蛋白質多約 ${x} g · HK$${p}`,
      a_lighter: (k, r) => `${k} · 蛋白質 ${r}`, a_mood: (v, p) => `不同選擇 · ${v} · HK$${p}`,
      addT: '加入今日？', c_price: '價格', c_protein: '蛋白質', c_kcal: '熱量', na: '不詳', unknown: '不明',
      addNoNut: '沒有營養數據：「今日」會把這個項目列為缺少數據，並把合計標示為不完整（不當作 0）。你之後可以移除。',
      addAi: '數值為模擬估算範圍。你之後可以在「今日」移除。', addFixed: '你之後可以在「今日」移除。',
      addConflict: r => `<b>這款餐點與你的避食清單有衝突：</b>${r}。如你決定，仍可記錄。`, cancel: '取消', confirm: '確認',
      repT: '回報問題', rp_ing: '成分有誤或缺漏', rp_nut: '營養資料看來有誤', rp_price: '價格已改變', rp_gone: '已停售',
      repDetails: '詳情（選填）', repPh: '例如：職員說湯底用了豬骨',
      repFine: '只屬原型：沒有伺服器，所以你的報告只記錄於本次原型，<b>並未實際送出</b>。在完整版本中，團隊會先向檔主核實，才更改共用紀錄。',
      submitReport: '提交報告',
      resetT: '重設原型？', resetP: '這會清除此裝置上的條件、今日紀錄和報告。請在每節測試之間使用。', resetBtn: '重設',
      t_snack: '顯示輕食選擇 · 以小食份量計算蛋白質目標', t_meal: '顯示正餐', t_pick3: '最多選 3 項 — 請先移除一項', t_swapped: '已替換 — 這是替代選擇',
      t_removed: n => `已移除 ${n}`, t_goalUpd: '已更新每日目標 — 你仍可修改', t_first: '顯示符合你條件的餐點', t_saved: '已儲存條件 · 結果已更新',
      t_added: n => `已將 ${n} 加入今日`, undo: '復原', t_reported: '已記錄於本次原型 — 並未實際送出', t_reset: '已重設原型'
    }
  };
  function t(k, ...a) {
    let v = STR[U.lang] && STR[U.lang][k];
    if (v === undefined) { console.error('MealFit i18n: missing key ' + U.lang + '.' + k); v = STR.en[k]; }
    if (v === undefined) return k;
    return typeof v === 'function' ? v(...a) : v;
  }
  const zh = () => U.lang === 'zh';
  const ZHD = window.ZH || { stall: {}, ingKey: {}, ingVal: {}, src: {}, basis: {}, change: {} };
  // display-only lookups (fall back to the original text when there is no Chinese display text)
  const dName = d => zh() && d.nameZh ? d.nameZh : d.name;
  const dStall = d => zh() ? (ZHD.stall[d.stall] || d.stall) : d.stall;
  function dFullName(d) {
    if (!d.real) return `<div class="dname">${esc(dName(d))}</div>`;
    const brand = d.brand ? `<div class="dbrand">${esc(d.brand)}</div>` : '';
    const qty = d.netQty ? `<div class="dqty">${esc(d.netQty)}</div>` : '';
    return `${brand}<div class="dname">${esc(dName(d))}</div>${qty}`;
  }
  function dSearchText(d) {
    const parts = [dName(d), dStall(d), d.cat];
    if (d.real) {
      if (d.brand) parts.push(d.brand);
      if (d.excelCat) parts.push(d.excelCat);
      if (d.purchaseLocations) parts.push(...d.purchaseLocations);
    }
    return parts.join(' ').toLowerCase();
  }
  const ingK = f => zh() ? (ZHD.ingKey[f.k] || f.k) : f.k;
  const ingV = f => zh() ? (ZHD.ingVal[f.v] || f.v) : f.v;
  const srcTxt = d => zh() ? (ZHD.src[d.src] || d.src) : d.src;
  const basisTxt = d => zh() ? (ZHD.basis[d.id] || d.basis) : d.basis;
  const changeTxt = d => zh() ? (ZHD.change[d.id] || d.change) : d.change;
  const tagName = tg => zh() ? (window.TAGNAME_ZH || {})[tg] || TAGNAME[tg] : TAGNAME[tg];
  const lbl = x => zh() && x.labelZh ? x.labelZh : x.label;
  const shortLbl = x => zh() ? (x.shortZh || x.labelZh || x.short || x.label) : (x.short || x.label);

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));
  const dish = id => DISHES.find(d => d.id === id);
  const avoidTags = crit => { const s = new Set(); crit.avoid.forEach(a => (AVOID.find(x => x.id === a) || { tags: [] }).tags.forEach(tg => s.add(tg))); return s; };
  const fmtR = (r, u) => r == null ? t('notOnLabel') : r[0] === r[1] ? `${r[0]}${u ? ' ' + u : ''}` : `${r[0]}–${r[1]}${u ? ' ' + u : ''}`;
  const days = n => t('days', n);

  const I = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    ban: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/></svg>',
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8M3 3v8a4 4 0 0 0 4 4M17 3c-2 2-2 6 0 8v10"/></svg>',
    today: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    help: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.6-2.8 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.1" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  swap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
  };

  // ---------- core logic (unchanged rules; labels are now rendered from keys) ----------
  // Portion options are set per dish: "Extra meat" only where data.js defines it (never on vegetarian dishes).
  const portionOpts = d => d.portions ? ['less', 'regular'].concat(d.extra ? ['extra'] : []) : [];
  const portionOf = d => { const p = P.portion[d.id] || 'regular'; return portionOpts(d).includes(p) ? p : 'regular'; };
  const portionLabel = k => t('portion_' + k);
  function nutrition(d) {
    const n = d.nut;
    if (!n) return null;
    if (n.mode === 'ai' && !P.crit.useAI) return null;
    const p = portionOf(d);
    const out = { mode: n.mode, conf: n.conf, portion: p, real: !!d.real };
    ['protein', 'kcal', 'fat', 'carbs', 'sugar', 'sodium'].forEach(k => out[k] = n[k] == null ? null : n[k].slice());
    // simulated portion adjustments (sample values, AI-estimate dishes only)
    if (p === 'less') { out.kcal = out.kcal && out.kcal.map(v => v - 100); out.carbs = out.carbs && out.carbs.map(v => v - 22); out.protein = out.protein && out.protein.map(v => v - 1); }
    if (p === 'extra') { out.protein = out.protein && [out.protein[0] + 8, out.protein[1] + 12]; out.kcal = out.kcal && [out.kcal[0] + 80, out.kcal[1] + 120]; out.fat = out.fat && [out.fat[0] + 5, out.fat[1] + 8]; }
    return out;
  }
  function priceOf(d) { if (d.price == null) return null; return portionOf(d) === 'extra' ? d.price + 8 : d.price; }
  // typical-price comparison only when it is like-for-like (no typical price exists for an add-on version)
  function valueRatio(d) { if (d.price == null || d.typical == null || portionOf(d) === 'extra') return null; return d.price / d.typical; }

  // Safety result: same rules as v1.1.1. Reasons are kept as structured items and turned into text at render time.
  function safety(d, crit = P.crit) {
    const A = avoidTags(crit);
    if (!A.size) return { state: 'none', lkey: 's_none', reasons: [] };
    const hit = [], check = [];
    if (d.ingUnknown) check.push({ r: 'unkIng', unconf: true });
    d.contains.forEach(tg => { if (A.has(tg)) hit.push({ r: 'main', tags: [tg] }); });
    d.ing.forEach(f => {
      if (f.v === null) { check.push({ r: 'fieldUnconf', f, unconf: true }); return; }
      const m = f.tags.filter(tg => A.has(tg));
      if (!m.length) return;
      const tags = [...new Set(m)];
      if (f.cross) check.push({ r: 'cross', f, tags });
      else hit.push({ r: 'field', f, tags });
    });
    if (hit.length) return { state: 'avoid', lkey: 'contains', ltags: hit[0].tags, reasons: hit.concat(check) };
    const unv = d.unverified ? [{ r: 'unv' }] : [];
    if (check.length) return { state: 'check', lkey: check.some(x => x.unconf) ? 's_unconf' : 's_cross', reasons: check.concat(unv) };
    if (unv.length) return { state: 'check', lkey: 's_unv', reasons: unv };
    return { state: 'clear', lkey: 's_clear', reasons: [] };
  }
  const names = tags => [...new Set(tags.map(tagName))].join(t('nameSep'));
  const safetyLabel = s => s.lkey === 'contains' ? t('contains', names(s.ltags)) : t(s.lkey);
  function reasonText(x) {
    if (x.r === 'unkIng') return t('r_unkIng');
    if (x.r === 'main') return t('r_main', names(x.tags));
    if (x.r === 'field') return t('r_field', names(x.tags), ingK(x.f));
    if (x.r === 'fieldUnconf') return t('r_fieldUnconf', ingK(x.f));
    if (x.r === 'cross') return t('r_cross', ingK(x.f), names(x.tags));
    return t('r_unv');
  }
  function mealGoal() {
    if (!P.crit.trackProtein) return null;
    return Math.round(P.crit.dailyProtein / (P.mode === 'snack' ? 6 : 3));
  }
  function proteinFit(n, g) {
    if (n && n.protein == null) n = null;
    if (g === null) return { key: 'na', rank: 2, n };
    if (!n) return { key: 'off', rank: 4 };
    const [lo, hi] = n.protein, tt = 0.9 * g;
    if (lo >= tt) return { key: 'fits', rank: 0, g };
    if (hi >= tt) return { key: 'may', rank: 1, g };
    if (hi >= 0.5 * g) return { key: 'partial', rank: 2, g };
    return { key: 'low', rank: 3, g };
  }
  const proteinLabel = pf => pf.key === 'na' ? (pf.n ? t('p_naRange', fmtR(pf.n.protein, 'g')) : t('p_noGoal')) : pf.key === 'off' ? t('p_off') : t('p_' + pf.key, pf.g);
  function budgetFit(d) { const p = priceOf(d), b = P.crit.budget; if (p == null) return { ok: null }; return p <= b ? { ok: true, b } : { ok: false, over: p - b }; }
  const budgetLabel = b => b.ok === null ? t('b_na') : b.ok ? t('b_ok', b.b) : t('b_over', b.over);
  function valueOf(d) { const r = valueRatio(d); if (r == null) return null; return r <= 0.9 ? t('val_good') : r <= 1.0 ? t('val_fair') : t('val_above'); }
  function overall(d) {
    const s = safety(d), b = budgetFit(d), pf = proteinFit(nutrition(d), mealGoal());
    if (s.state === 'avoid') return { key: 'no', lkey: 'v_no' };
    const good = (s.state === 'clear' || s.state === 'none') && b.ok === true && ['fits', 'may', 'na'].includes(pf.key);
    if (good) return { key: 'good', lkey: pf.key === 'may' ? 'v_likely' : 'v_good' };
    return { key: 'part', lkey: 'v_part' };
  }
  function evaluate(d) { const n = nutrition(d); return { d, n, s: safety(d), b: budgetFit(d), pf: proteinFit(n, mealGoal()), o: overall(d) }; }

  function list() {
    let all = DISHES.map(evaluate);
    if (U.cat !== 'all') all = all.filter(e => e.d.cat === U.cat);
    else if (P.mode === 'snack') all = all.filter(e => e.d.cat === 'light' || e.d.cat === 'drink');
    if (U.q) { const q = U.q.toLowerCase(); all = all.filter(e => dSearchText(e.d).includes(q)); }
    const hiddenAvoid = all.filter(e => e.s.state === 'avoid'), hiddenBudget = all.filter(e => e.s.state !== 'avoid' && e.b.ok === false),
      hiddenNoPrice = all.filter(e => e.s.state !== 'avoid' && e.b.ok === null);
    let shown = U.showHidden ? all : all.filter(e => e.s.state !== 'avoid' && e.b.ok === true);
    const vr = d => { const r = valueRatio(d); return r == null ? 9 : r; };
    const pr = d => { const p = priceOf(d); return p == null ? 1e9 : p; };
    const pmid = e => e.n && e.n.protein ? e.n.protein[0] + e.n.protein[1] : -1;
    const sRank = { clear: 0, none: 0, check: 1, avoid: 3 };
    const cmp = {
      fit: (a, b) => (sRank[a.s.state] - sRank[b.s.state]) || ((a.b.ok === true ? 0 : 1) - (b.b.ok === true ? 0 : 1)) || (a.pf.rank - b.pf.rank) || (vr(a.d) - vr(b.d)),
      price: (a, b) => (sRank[a.s.state] - sRank[b.s.state]) || pr(a.d) - pr(b.d),
      protein: (a, b) => (sRank[a.s.state] - sRank[b.s.state]) || (pmid(b) - pmid(a))
    }[U.sort];
    shown.sort(cmp);
    return { shown, hiddenAvoid: hiddenAvoid.length, hiddenBudget: hiddenBudget.length, hiddenNoPrice: hiddenNoPrice.length };
  }

  function alternatives(d, reason) {
    const cur = evaluate(d);
    const kind = x => (x.cat === 'rice' || x.cat === 'noodles') ? 'meal' : 'light';
    let c = DISHES.filter(x => x.id !== d.id).map(evaluate).filter(e => e.s.state !== 'avoid' && e.b.ok === true);
    if (reason !== 'lighter' && reason !== 'mood') { const same = c.filter(e => kind(e.d) === kind(d)); if (same.length) c = same; }
    const mid = n => n && n.protein ? (n.protein[0] + n.protein[1]) / 2 : 0;
    const cm = mid(cur.n);
    let why;
    if (reason === 'pricey') { c = c.filter(e => priceOf(d) != null && priceOf(e.d) < priceOf(d)).sort((a, b) => Math.abs(mid(a.n) - cm) - Math.abs(mid(b.n) - cm)); why = e => t('a_pricey', priceOf(d) - priceOf(e.d), e.n && e.n.protein ? fmtR(e.n.protein, 'g') : null); }
    else if (reason === 'protein') { c = c.filter(e => mid(e.n) > cm).sort((a, b) => mid(b.n) - mid(a.n)); why = e => t('a_protein', Math.round(mid(e.n) - cm), priceOf(e.d)); }
    else if (reason === 'lighter') { c = c.filter(e => e.n && cur.n && e.n.kcal && cur.n.kcal && e.n.kcal[1] < cur.n.kcal[0]).sort((a, b) => mid(b.n) - mid(a.n)); why = e => t('a_lighter', fmtR(e.n.kcal, 'kcal'), fmtR(e.n.protein, 'g')); }
    else { c = c.filter(e => e.d.cat !== d.cat || e.d.stall !== d.stall).sort((a, b) => (a.pf.rank - b.pf.rank) || priceOf(a.d) - priceOf(b.d)); why = e => t('a_mood', t(e.o.lkey), priceOf(e.d)); }
    c = c.sort((a, b) => (a.s.state === 'check') - (b.s.state === 'check'));
    return c.slice(0, 3).map(e => ({ e, why: why(e) }));
  }

  // ---------- render pieces ----------
  function pillSafety(s, compact) {
    const map = { clear: ['ok', I.check], none: ['neutral', I.info], check: ['warn', I.alert], avoid: ['bad', I.ban] };
    const [cls, ic] = map[s.state];
    const l = compact === 'short' ? ({ clear: t('s_clear'), none: t('s_noneShort'), check: safetyLabel(s), avoid: t('s_conflict') }[s.state]) : (compact && s.state === 'none' ? t('s_noneShort') : safetyLabel(s));
    const tipKey = ({ s_clear: 'tip_clear', s_unconf: 'tip_unconf', s_cross: 'tip_cross', s_unv: 'tip_unv', s_none: 'tip_none', contains: 'tip_conflict' })[s.lkey];
    const tip = (!compact && tipKey) ? `<button type="button" class="tip-btn" data-act="safetytip" data-tip="${tipKey}" aria-label="${t('safetyTip')}">${I.help}</button>` : '';
    return `<span class="pill ${cls}">${ic}<span>${esc(l)}</span>${tip}</span>`;
  }
  function pillBudget(b) { return `<span class="pill ${b.ok === true ? 'ok' : b.ok === null ? 'neutral' : 'warn'}">${b.ok === true ? I.check : b.ok === null ? I.info : I.tag}<span>${esc(budgetLabel(b))}</span></span>`; }
  function pillProtein(pf) {
    const cls = { fits: 'ok', may: 'ok-soft', partial: 'neutral', low: 'neutral', na: 'neutral', off: 'neutral' }[pf.key];
    return `<span class="pill ${cls}">${pf.key === 'fits' || pf.key === 'may' ? I.check : I.info}<span>${esc(proteinLabel(pf))}</span></span>`;
  }
  function factVal(n, d, id) {
    if (id === 'fullness' && d.fullness == null) return `<span class="muted">${t('notRated')}</span>`;
    if (id === 'fullness') return `<span class="dots" aria-label="${esc(t('fullAria', d.fullness))}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= d.fullness ? 'on' : ''}"></i>`).join('')}</span>`;
    if (!n) return `<span class="muted">${t('noData')}</span>`;
    const f = FACTS.find(x => x.id === id);
    if (n[id] == null) return `<span class="muted">${t('notOnLabel')}</span>`;
    return esc(fmtR(n[id], f.unit));
  }
  function sourceBadge(n, d) {
    if (!n) return d && d.nut && d.nut.mode === 'ai' ? `<span class="src off">${t('srcAiOff')}</span>` : `<span class="src off">${t('srcNone')}</span>`;
    if (n.mode === 'fixed') return n.real ? `<span class="src fixed">${I.tag}${t('srcLabel')}</span>` : `<span class="src fixed">${I.tag}${t('srcSample')}</span>`;
    return `<span class="src ai">${I.spark}${t('srcAi')}</span>`;
  }
  function priceHtml(d, cls) {
    const p = priceOf(d), v = valueOf(d);
    if (p == null) return t('priceNA');
    if (portionOf(d) === 'extra') return `HK$${p} <small>${cls === 'detail' ? t('extraDetail') : t('extraCard')}</small>`;
    const note = d.real && d.priceNote ? `<span class="pricesrc">${esc(d.priceNote)}</span>` : '';
    if (cls === 'detail') return `HK$${p} <small>${t('typDetail', d.typical, v)}</small>${note}`;
    return `HK$${p}<small>${t('typCard', d.typical)}</small>${note}`;
  }
  const verdictHtml = (o, big) => `<div class="verdict ${big ? 'big ' : ''}v-${o.key}">${o.key === 'good' ? I.check : o.key === 'no' ? I.ban : I.info}${esc(t(o.lkey))}`;

  function card(e) {
    const { d, n, s, b, pf, o } = e;
    const facts = P.crit.facts.map(id => `<span class="fact"><span class="fact-l">${esc(lbl(FACTS.find(f => f.id === id)))}</span> ${factVal(n, d, id)}</span>`).join('');
    const dim = s.state === 'avoid' || b.ok !== true;
    return `<button class="card ${dim ? 'dim' : ''} v-${o.key}" data-open="${d.id}" aria-label="${esc(dName(d))}, ${esc(t(o.lkey))}">
      <div class="card-top"><div class="card-nameblock">${dFullName(d)}<div class="card-stall">${esc(dStall(d))}</div>${locLine(d)}</div>
        <div class="card-price">${priceHtml(d)}</div></div>
      ${verdictHtml(o)}${d.change ? `<span class="chg">${t('recipeUpd')}</span>` : ''}</div>
      <div class="pills">${pillSafety(s, true)}${pillBudget(b)}${pillProtein(pf)}</div>
      <div class="facts">${facts}${sourceBadge(n, d)}</div>
    </button>`;
  }

  function locLine(d, detail) {
    if (!d.real) return '';
    const L = d.purchaseLocations || [];
    return `<div class="card-stall loc">${t('availAt')}${L.length ? L.map(esc).join(t('locSep')) : t('notListed')}</div>`;
  }
  function header(title, opts = {}) {
    return `<header class="top">${opts.back ? `<button class="icon-btn" data-act="back" aria-label="${t('back')}">${I.back}</button>` : ''}<h1>${esc(title)}</h1>${opts.right || ''}</header>`;
  }
  function tabs() {
    const tb = (id, label, ic) => `<button class="tab ${U.screen === id || (id === 'menu' && U.screen === 'detail') ? 'on' : ''}" data-go="${id}">${ic}<span>${label}</span></button>`;
    return `<nav class="tabs" aria-label="${t('navAria')}">${tb('menu', t('tabMenu'), I.menu)}${tb('today', t('tabToday'), I.today)}${tb('criteria', t('tabCrit'), I.sliders)}</nav>`;
  }
  // language names are always shown in their own language
  const LANGS = [['en', 'English'], ['zh', '繁體中文']];

  function vWelcome() {
    const other = LANGS.find(([k]) => k !== U.lang);
    return `<main class="screen welcome">
      <div class="w-top"><div class="brand">MealFit<span>${t('brandSub')}</span></div><button class="chip sm" data-lang="${other[0]}" lang="${other[0] === 'zh' ? 'zh-Hant-HK' : 'en'}" aria-label="${t('langAria')}: ${other[1]}">${other[1]}</button></div>
      <h1 class="w-title">${t('wTitle')}</h1>
      <ul class="w-list">
        <li>${I.ban}<div>${t('w1')}</div></li>
        <li>${I.tag}<div>${t('w2')}</div></li>
        <li>${I.check}<div>${t('w3')}</div></li>
      </ul>
      <div class="cant"><b>${t('cantT')}</b><p>${t('cantP')}</p></div>
      <div class="w-actions"><button class="btn primary" data-act="start">${t('start')}</button><button class="btn ghost" data-act="browse">${t('browse')}</button></div>
      <p class="fine">${t('wFine', VERSION)}</p>
    </main>`;
  }

  function vMenu() {
    const { shown, hiddenAvoid, hiddenBudget, hiddenNoPrice } = list();
    const c = P.crit, g = mealGoal();
    const sum = [c.avoid.length ? t('avoidSum', c.avoid.map(a => shortLbl(AVOID.find(y => y.id === a))).join(t('nameSep'))) : t('noAvoidList'), `≤ HK$${c.budget}`, g ? t('goalSum', g, P.mode) : t('noGoal')];
    const hiddenTxt = (hiddenAvoid || hiddenBudget || hiddenNoPrice) ? `<div class="hidden-bar">${U.showHidden ? t('showingAll', hiddenAvoid, hiddenBudget, hiddenNoPrice) : `${t('hiddenPre')}${[hiddenAvoid ? t('hidAvoid', hiddenAvoid) : '', hiddenBudget ? t('hidBudget', hiddenBudget) : '', hiddenNoPrice ? t('hidNoPrice', hiddenNoPrice) : ''].filter(Boolean).join(t('hidSep'))}${t('hiddenEnd')}`}<button class="link" data-act="toggleHidden">${U.showHidden ? t('hideThem') : t('showThem')}</button></div>` : '';
    return `${header(t('findMeal'), { right: `<button class="icon-btn" data-act="why" aria-label="${t('whyAria')}">${I.info}</button>` })}
    <main class="screen">
      <button class="crit-sum" data-go="criteria" aria-label="${t('editCritAria')}">${sum.map(x => `<span>${esc(x)}</span>`).join('')}<em>${t('edit')}</em></button>
      <div class="seg" role="group" aria-label="${t('mealOrSnack')}">
        <button class="${P.mode === 'meal' ? 'on' : ''}" data-mode="meal">${t('fullMeal')}</button><button class="${P.mode === 'snack' ? 'on' : ''}" data-mode="snack">${t('lightSnack')}</button>
      </div>
      <label class="search">${I.search}<input id="q" type="search" placeholder="${t('searchPh')}" value="${esc(U.q)}" aria-label="${t('searchPh')}"></label>
      <div class="chips scroll">${CATS.filter(x => P.mode !== 'snack' || !['rice', 'noodles'].includes(x.id)).map(x => `<button class="chip ${U.cat === x.id ? 'on' : ''}" data-cat="${x.id}">${esc(lbl(x))}</button>`).join('')}</div>
      <div class="sortrow"><span>${t('options', shown.length)}</span>
        <select id="sort" aria-label="${t('sortAria')}"><option value="fit" ${U.sort === 'fit' ? 'selected' : ''}>${t('sortFit')}</option><option value="price" ${U.sort === 'price' ? 'selected' : ''}>${t('sortPrice')}</option><option value="protein" ${U.sort === 'protein' ? 'selected' : ''}>${t('sortProtein')}</option></select></div>
      ${hiddenTxt}
      <div class="cards">${shown.length ? shown.map(card).join('') : `<div class="empty"><b>${t('emptyT')}</b><p>${t('emptyP')}</p><button class="btn ghost sm" data-act="toggleHidden">${t('showHiddenBtn')}</button></div>`}</div>
      <p class="fine center">${t('menuFine')}</p>
    </main>${tabs()}`;
  }

  function vDetail() {
    const d = dish(U.detail), e = evaluate(d), { n, s, b, pf, o } = e, g = mealGoal();
    const A = avoidTags(P.crit);
    const rows = d.ing.map(f => {
      let st = 'ok', note = '';
      if (f.v === null) { st = A.size ? 'warn' : 'neutral'; note = t('i_unconf'); }
      else { const m = f.tags.filter(tg => A.has(tg)); if (m.length) { st = f.cross ? 'warn' : 'bad'; note = f.cross ? t('i_cross') : t('i_conflict'); } else st = 'plain'; }
      return `<div class="irow ${st}"><span class="ik">${esc(ingK(f))}</span><span class="iv">${f.v === null ? `<i>${t('i_notListed')}</i>` : esc(ingV(f))}${note ? `<em>${note}</em>` : ''}</span></div>`;
    }).join('');
    const unkRow = d.ingUnknown ? `<div class="irow ${A.size ? 'warn' : 'neutral'}"><span class="ik">${t('i_ingredients')}</span><span class="iv"><i>${t('i_notInRec')}</i><em>${t('i_unconf')}</em></span></div>` : '';
    const mainRow = d.contains.length ? `<div class="irow ${d.contains.some(tg => A.has(tg)) ? 'bad' : 'plain'}"><span class="ik">${t('i_main')}</span><span class="iv">${esc(d.contains.map(tagName).join(t('nameSep')))}${d.contains.some(tg => A.has(tg)) ? `<em>${t('i_conflict')}</em>` : ''}</span></div>` : '';
    const port = d.portions && n ? `<div class="seg sm" role="group" aria-label="${t('portionAria')}">${portionOpts(d).map(k => `<button class="${portionOf(d) === k ? 'on' : ''}" data-portion="${k}">${k === 'extra' ? t('extraBtn') : portionLabel(k)}</button>`).join('')}</div><p class="fine">${t('portionNote')}</p>` : '';
    const ntable = n ? FACTS.filter(f => f.id !== 'fullness').map(f => `<div class="nrow ${P.crit.facts.includes(f.id) ? 'hl' : ''}"><span>${esc(lbl(f))}</span><b>${n[f.id] == null ? `<span class="muted">${t('notOnLabel')}</span>` : esc(fmtR(n[f.id], f.unit))}</b></div>`).join('') + `<div class="nrow ${P.crit.facts.includes('fullness') ? 'hl' : ''}"><span>${t('fullRating')}</span><b>${factVal(n, d, 'fullness')}</b></div>`
      : `<p class="muted">${d.nut && d.nut.mode === 'ai' ? t('aiOffNote') : t('noNutItem')}</p>`;
    const confTxt = n && n.mode === 'ai' ? `<span class="conf c-${n.conf}" title="${t('confTitle')}">${t('conf', t('c_' + n.conf))}</span>` : '';
    const fb = P.feedback[d.id];
    const explain = n && n.mode === 'ai' ? `<button class="link" data-act="explain" aria-expanded="${U.explain}">${U.explain ? t('hide') : t('howEst')}</button>${U.explain ? `<div class="explain"><p>${t('explain1', esc(basisTxt(d)))}</p><p>${t('ex_' + (n.conf === 'low' || n.conf === 'high' ? n.conf : 'medium'))}${t('ex_demo')}</p><p class="fine">${t('ex_limit')}</p></div>` : ''}` : (n ? (n.real ? `<p class="fine">${t('realNote', esc(d.netQty))}</p>` : `<p class="fine">${t('sampleNote')}</p>`) : '');
    const feedback = n && n.mode === 'ai' ? `<div class="fb"><span>${t('fbQ')}</span><div>${['low', 'ok', 'high'].map(x => `<button class="chip sm ${fb === x ? 'on' : ''}" data-fb="${x}">${t('fb_' + x)}</button>`).join('')}</div>${fb ? `<p class="fine">${t('fbNote')}</p>` : ''}</div>` : '';
    const reported = P.reports[d.id];
    return `${header(d.real && d.brand ? d.brand + ' · ' + dName(d) : dName(d), { back: true })}
    <main class="screen detail">
      <div class="d-head"><div class="d-title">${dFullName(d)}<div class="card-stall">${esc(dStall(d))}</div>${locLine(d, true)}<div class="d-price">${priceHtml(d, 'detail')}</div></div>${verdictHtml(o, true)}</div></div>
      ${d.change ? `<div class="notice">${I.info}<div>${t('changeNote', esc(changeTxt(d)))}</div></div>` : ''}
      ${reported ? `<div class="notice warn">${I.flag}<div>${t('reportedNote', esc(t('rp_' + reported.choice)), reported.note ? esc(reported.note) : '')}</div></div>` : ''}
      <section class="box"><h2>${t('whyVerdict')}</h2>
        <div class="why"><div class="why-row">${pillSafety(s)}<p>${s.state === 'none' ? t('noAvoidSet') : s.reasons.length ? s.reasons.map(r => esc(reasonText(r))).join('<br>') : t('clearWhy')}</p></div>
        <div class="why-row">${pillBudget(b)}<p>${b.ok === null ? t('budgetNA') : t('budgetWhy', priceOf(d), portionOf(d) === 'extra', P.crit.budget)}</p></div>
        <div class="why-row">${pillProtein(pf)}<p>${g === null ? t('notTracking') : n && n.protein ? t('proteinWhy', n.mode === 'ai' ? t('pw_ai') : n.real ? t('pw_label') : t('pw_sample'), fmtR(n.protein, 'g'), g, t('mode_' + P.mode), P.crit.dailyProtein, P.mode === 'snack' ? 6 : 3) : t('noVerNut')}</p></div></div>
      </section>
      <section class="box"><h2>${t('whatsIn')}</h2>${unkRow}${mainRow}${rows}
        <p class="srcline">${t('srcPre')}${esc(t('srcSampleWrap', srcTxt(d)))}</p>
        <button class="link danger" data-act="report">${I.flag}${t('reportLink')}</button>
      </section>
      <section class="box"><h2>${t('nutrition')} <span class="h-badges">${sourceBadge(n, d)}${confTxt}</span></h2>${port}<div class="ntable">${ntable}</div>${explain}${feedback}</section>
    </main>
    <div class="actionbar three"><button type="button" class="btn ghost report-btn" data-act="report">${I.flag}<span>${t('reportShort')}</span></button><button type="button" class="btn ghost swap-btn" data-act="notthis">${I.swap}<span>${t('notThis')}</span></button><button type="button" class="btn primary" data-act="add" ${s.state === 'avoid' ? 'data-conflict="1"' : ''}>${I.plus}${t('addToday')}</button></div>`;
  }

  // Log entries keep the dish id and portion so names follow the current language.
  const logName = x => {
    const d = dish(x.id);
    if (!d) return x.name + (x.portion ? (U.lang === 'zh' ? `（${portionLabel(x.portion)}）` : ` (${portionLabel(x.portion)})`) : '');
    const base = d.real && d.brand ? d.brand + ' ' + dName(d) : dName(d);
    const qty = d.real && d.netQty ? ' (' + d.netQty + ')' : '';
    return base + qty + (x.portion ? (U.lang === 'zh' ? `（${portionLabel(x.portion)}）` : ` (${portionLabel(x.portion)})`) : '');
  };

  function vToday() {
    const g = P.crit.trackProtein ? P.crit.dailyProtein : null;
    const known = P.log.filter(x => x.protein), missing = P.log.filter(x => !x.protein), noPrice = P.log.filter(x => x.price == null);
    const tot = known.reduce((a, x) => { a.lo += x.protein[0]; a.hi += x.protein[1]; a.est = a.est || x.mode === 'ai'; return a; }, { lo: 0, hi: 0, est: false });
    tot.lo = Math.round(tot.lo * 10) / 10; tot.hi = Math.round(tot.hi * 10) / 10;
    tot.spent = P.log.reduce((a, x) => a + (x.price || 0), 0);
    const TAG = { ai: `<em class="src ai sm">${t('tg_ai')}</em>`, sample: `<em class="src fixed sm">${t('tg_sample')}</em>`, label: `<em class="src fixed sm">${t('tg_label')}</em>`, none: `<em class="src off sm">${t('tg_none')}</em>` };
    const incomplete = missing.length ? `<div class="notice warn">${I.alert}<div>${t('incomplete', missing.length, esc(missing.map(logName).join(t('nameSep'))))}</div></div>` : '';
    const pct = g ? Math.min(100, Math.round(((tot.lo + tot.hi) / 2) / g * 100)) : 0;
    const left = g ? [Math.max(0, g - tot.hi), Math.max(0, g - tot.lo)] : null;
    const items = P.log.map((x, i) => `<div class="logrow"><div><b>${esc(logName(x))}</b><span>${esc(x.time)} · ${x.price == null ? t('logPriceNA') : 'HK$' + x.price} · ${x.protein ? t('logProtein', fmtR(x.protein, 'g')) : t('logProteinUnk')} ${TAG[x.mode] || TAG.none}</span></div><button class="icon-btn" data-del="${i}" aria-label="${esc(t('removeAria', logName(x)))}">${I.x}</button></div>`).join('');
    return `${header(t('today'))}
    <main class="screen">
      ${g ? `<section class="box"><h2>${t('proteinSoFar')}</h2><div class="big-num">${known.length || !P.log.length ? (tot.lo === tot.hi ? tot.lo : tot.lo + '–' + tot.hi) + ' g' : '—'}${missing.length ? '+' : ''} <small>${t('ofGoal', g, missing.length)}</small></div>
        <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
        <p>${P.log.length ? (left[1] === 0 ? t('reached') : t('left', left[0] === left[1] ? left[0] : left[0] + '–' + left[1], missing.length)) : t('nothingYet')}${tot.est ? t('inclEst') : ''}</p>${incomplete}</section>` : ''}
      <section class="box"><h2>${t('spentToday')}</h2><div class="big-num">HK$${tot.spent}${noPrice.length ? '+' : ''}</div>${noPrice.length ? `<p class="fine">${t('noPriceNote', noPrice.length)}</p>` : ''}</section>
      <section class="box"><h2>${t('logged')}</h2>${g ? '' : incomplete}${items || `<p class="muted">${t('emptyLog')}</p>`}</section>
      <p class="fine center">${t('todayFine')}</p>
    </main>${tabs()}`;
  }

  function vCriteria() {
    const c = U.draft;
    const first = !P.onboarded;
    const calc = U.calc;
    // Soft validation: compute error keys, never block the user from typing
    const bv = c.budget;
    let budgetError = null;
    if (bv == null || bv === '' || isNaN(+bv)) budgetError = 'errBudgetEmpty';
    else if (+bv < 0) budgetError = 'errBudgetNeg';
    else if (+bv < 10) budgetError = 'errBudgetLow';
    else if (+bv > 80) budgetError = 'errBudgetHigh';
    const pv = c.dailyProtein;
    let proteinError = null;
    if (c.trackProtein) {
      if (pv == null || pv === '' || isNaN(+pv)) proteinError = 'errProteinEmpty';
      else if (+pv < 0) proteinError = 'errProteinNeg';
      else if (+pv < 30) proteinError = 'errProteinLow';
      else if (+pv > 250) proteinError = 'errProteinHigh';
    }
    const segBtns = (attr, cur, items) => items.map(([k, l, lg]) => `<button class="${cur === k ? 'on' : ''}" data-${attr}="${k}" aria-pressed="${cur === k}"${lg ? ` lang="${lg}"` : ''}>${l}</button>`).join('');
    return `${header(first ? t('setCrit') : t('myCrit'), { back: first })}
    <main class="screen crit">
      <section class="box"><h2><span class="num">1</span>${t('q1')}</h2><p class="hint">${t('q1hint')}</p>
        <div class="chips wrap">${AVOID.map(a => `<button class="chip ${c.avoid.includes(a.id) ? 'on' : ''}" data-avoid="${a.id}" aria-pressed="${c.avoid.includes(a.id)}">${c.avoid.includes(a.id) ? I.x : ''}${esc(lbl(a))}</button>`).join('')}</div></section>
      <section class="box"><h2><span class="num">2</span>${t('q2')}</h2>
        <div class="num-input budget-num ${budgetError ? 'has-error' : ''}" role="group" aria-invalid="${!!budgetError}">
          <span class="prefix">HK$</span>
          <input id="budget" type="number" inputmode="numeric" step="1" value="${c.budget}" aria-label="${t('q2')}" aria-describedby="${budgetError ? 'budget-error' : ''}" />
        </div>
        ${budgetError ? `<p id="budget-error" class="field-error" role="alert">${t(budgetError)}</p>` : `<p class="hint">${t('budgetHint')}</p>`}
        <div class="chips">${[25, 35, 45, 60].map(v => `<button class="chip ${c.budget === v ? 'on' : ''}" data-budget="${v}">HK$${v}</button>`).join('')}</div></section>
      <section class="box"><h2><span class="num">3</span>${t('q3')} <em class="opt">${t('optional')}</em></h2>
        <label class="switch"><input type="checkbox" id="track" ${c.trackProtein ? 'checked' : ''}><span></span>${t('trackLbl')}</label>
        ${c.trackProtein ? `<div class="num-input protein-num ${proteinError ? 'has-error' : ''}" role="group" aria-invalid="${!!proteinError}">
          <input id="protein" type="number" inputmode="numeric" step="1" value="${c.dailyProtein}" aria-label="${t('q3')}" aria-describedby="${proteinError ? 'protein-error' : ''}" />
          <span class="suffix">${t('gPerDay')}</span>
        </div>
        ${proteinError ? `<p id="protein-error" class="field-error" role="alert">${t(proteinError)}</p>` : `<p class="hint">${t('perDay', Math.round(c.dailyProtein / 3))}</p>`}
        <button class="link" data-act="calc">${calc ? t('calcClose') : t('calcOpen')}</button>
        ${calc ? `<div class="calc"><label>${t('bodyW')}<input id="cw" type="number" inputmode="numeric" min="35" max="150" value="${calc.w}"></label>
          <div class="seg sm">${[['maintain', t('g_maintain')], ['build', t('g_build')]].map(([k, l]) => `<button class="${calc.goal === k ? 'on' : ''}" data-cgoal="${k}">${l}</button>`).join('')}</div>
          <p>${t('calcRange', calcRange(calc)[0], calcRange(calc)[1], calc.goal === 'build' ? '1.6–2.2' : '1.2–1.6')}</p>
          <button class="btn ghost sm" data-act="usecalc">${t('useG', Math.round((calcRange(calc)[0] + calcRange(calc)[1]) / 2))}</button></div>` : ''}` : `<p class="hint">${t('noGoalHint')}</p>`}</section>
      <section class="box"><h2><span class="num">4</span>${t('q4')} <em class="opt">${t('pick3')}</em></h2>
        <div class="chips wrap">${FACTS.map(f => `<button class="chip ${c.facts.includes(f.id) ? 'on' : ''}" data-fact="${f.id}" aria-pressed="${c.facts.includes(f.id)}">${esc(lbl(f))}</button>`).join('')}</div>
        <p class="hint">${t('selected', c.facts.length)}</p></section>
      <section class="box"><h2>${t('aiBox')}</h2>
        <label class="switch"><input type="checkbox" id="useai" ${c.useAI ? 'checked' : ''}><span></span>${t('aiToggle')}</label>
        <p class="hint">${t('aiHint')}</p>
        ${first ? '' : `<button class="link danger" data-act="reset">${t('resetLink')}</button>`}</section>
      <section class="box"><h2>${t('dispBox')}</h2>
        <p class="hint">${t('langLbl')}</p><div class="seg sm" role="group" aria-label="${t('langLbl')}">${segBtns('lang', U.lang, LANGS.map(([k, l]) => [k, l, k === 'zh' ? 'zh-Hant-HK' : 'en']))}</div>
        <p class="hint">${t('themeLbl')}</p><div class="seg sm" role="group" aria-label="${t('themeLbl')}">${segBtns('thm', U.theme, [['light', t('th_light')], ['dark', t('th_dark')], ['system', t('th_system')]])}</div>
        <p class="hint">${t('dispHint')}</p></section>
      <p class="fine center">${t('critFine', VERSION)}</p>
    </main>
    <div class="actionbar single ${first ? '' : 'above-tabs'}"><button class="btn primary" data-act="saveCrit">${first ? t('showMatches') : t('saveChanges')}</button></div>
    ${first ? '' : tabs()}`;
  }
  function calcRange(c) { const w = Math.max(35, Math.min(150, +c.w || 60)); return c.goal === 'build' ? [Math.round(w * 1.6), Math.round(w * 2.2)] : [Math.round(w * 1.2), Math.round(w * 1.6)]; }

  // ---------- sheets ----------
  const REP = ['ing', 'nut', 'price', 'gone'];
  function sheet() {
    if (!U.sheet) return '';
    const s = U.sheet; let body = '';
    if (s.type === 'why') body = `<h2>${t('whyT')}</h2><ol class="order"><li>${t('why1')}</li><li>${t('why2')}</li><li>${t('why3')}</li><li>${t('why4')}</li></ol><p class="fine">${t('whyFine')}</p><button class="btn primary" data-act="close">${t('gotIt')}</button>`;
    if (s.type === 'notthis') {
      const d = dish(U.detail);
      const reasons = ['pricey', 'protein', 'lighter', 'mood'];
      const alts = s.reason ? alternatives(d, s.reason) : [];
      body = `<h2>${t('ntT')}</h2><div class="chips wrap">${reasons.map(k => `<button class="chip ${s.reason === k ? 'on' : ''}" data-reason="${k}">${t('rs_' + k)}</button>`).join('')}</div>
      ${s.reason ? (alts.length ? `<p class="hint">${t('swapsHint')}</p><div class="alts">${alts.map(a => `<button class="alt" data-swap="${a.e.d.id}"><div><b>${esc(a.e.d.real && a.e.d.brand ? a.e.d.brand + " " + dName(a.e.d) : dName(a.e.d))}</b><span>${esc(dStall(a.e.d))}</span><em>${esc(a.why)}</em></div>${pillSafety(a.e.s, 'short')}</button>`).join('')}</div>` : `<p class="muted">${t('noSwap')}</p>`) : `<p class="hint">${t('pickReason')}</p>`}
      <button class="btn ghost" data-act="close">${t('keepLooking')}</button>`;
    }
    if (s.type === 'add') {
      const d = dish(U.detail), n = nutrition(d), sf = safety(d);
      body = `<h2>${t('addT')}</h2><div class="confirm"><b>${esc(d.real && d.brand ? d.brand + " " + dName(d) : dName(d))}</b><span>${esc(dStall(d))}${d.portions && n ? ' · ' + portionLabel(portionOf(d)) : ''}</span>
        <div class="cgrid"><div><small>${t('c_price')}</small><b>${priceOf(d) == null ? t('na') : 'HK$' + priceOf(d)}</b></div><div><small>${t('c_protein')}</small><b>${n && n.protein ? fmtR(n.protein, 'g') : t('unknown')}</b></div><div><small>${t('c_kcal')}</small><b>${n && n.kcal ? fmtR(n.kcal, '') : t('unknown')}</b></div></div>
        ${!n || !n.protein ? `<p class="fine">${t('addNoNut')}</p>` : n.mode === 'ai' ? `<p class="fine">${t('addAi')}</p>` : `<p class="fine">${t('addFixed')}</p>`}</div>
        ${sf.state === 'avoid' ? `<div class="notice bad">${I.ban}<div>${t('addConflict', esc(reasonText(sf.reasons[0])))}</div></div>` : ''}
        <div class="row2"><button class="btn ghost" data-act="close">${t('cancel')}</button><button class="btn primary" data-act="confirmAdd">${t('confirm')}</button></div>`;
    }
    if (s.type === 'report') {
      const rd = dish(U.detail);
      body = `<h2>${t('repT')}</h2><p class="hint">${esc(rd && rd.real && rd.brand ? rd.brand + " " + dName(rd) : dName(rd))}</p><div class="radios">${REP.map(o => `<label><input type="radio" name="rep" value="${o}" ${s.choice === o ? 'checked' : ''}> ${esc(t('rp_' + o))}</label>`).join('')}</div>
      <label class="ta">${t('repDetails')}<textarea id="repnote" rows="2" placeholder="${t('repPh')}">${esc(s.note || '')}</textarea></label>
      <p class="fine">${t('repFine')}</p>
      <div class="row2"><button class="btn ghost" data-act="close">${t('cancel')}</button><button class="btn primary" data-act="sendReport" ${s.choice ? '' : 'disabled'}>${t('submitReport')}</button></div>`;
    }
    if (s.type === 'reset') body = `<h2>${t('resetT')}</h2><p>${t('resetP')}</p><div class="row2"><button class="btn ghost" data-act="close">${t('cancel')}</button><button class="btn danger" data-act="doReset">${t('resetBtn')}</button></div>`;
    return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true">${body}</div>`;
  }

  // ---------- language & theme (session memory only; no localStorage) ----------
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function applyPrefs() {
    const root = document.documentElement;
    root.lang = zh() ? 'zh-Hant-HK' : 'en';
    root.dataset.theme = U.theme === 'dark' || (U.theme === 'system' && mq && mq.matches) ? 'dark' : 'light';
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (U.theme === 'system') applyPrefs(); });

  // ---------- render & events ----------
  const app = document.getElementById('app');
  function render(keepScroll) {
    const y = keepScroll ? window.scrollY : 0;
    applyPrefs();
    const v = { welcome: vWelcome, menu: vMenu, detail: vDetail, today: vToday, criteria: vCriteria }[U.screen]();
    app.innerHTML = v + (U.tip ? `<div class="tip-overlay" data-act="closetip"><div class="tip-modal" role="dialog" aria-modal="true"><button type="button" class="tip-x" data-act="closetip" aria-label="Close">${I.close}</button><h3>${t('safetyTip')}</h3><p>${t(U.tip)}</p><button type="button" class="btn primary full" data-act="closetip">${t('gotIt')}</button></div></div>` : '') + sheet() + (U.toast ? `<div class="toast" role="status">${esc(U.toast.msg)}${U.toast.undo ? `<button data-act="undo">${t('undo')}</button>` : ''}</div>` : '');
    document.body.classList.toggle('has-sheet', !!U.sheet);
    window.scrollTo(0, y);
    const q = $('#q'); if (q && U.focusQ) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  let toastT;
  function toast(msg, undo) { U.toast = { msg, undo }; clearTimeout(toastT); render(true); toastT = setTimeout(() => { const el = document.querySelector('.toast'); if (el) el.remove(); U.toast = null; }, undo ? 5000 : 2200); }
  function go(screen) {
    if (screen === 'criteria') { U.draft = JSON.parse(JSON.stringify(P.crit)); U.calc = null; }
    U.screen = screen; U.sheet = null; render();
  }

  app.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act],[data-go],[data-open],[data-cat],[data-mode],[data-avoid],[data-budget],[data-fact],[data-step],[data-portion],[data-reason],[data-swap],[data-del],[data-fb],[data-cgoal],[data-lang],[data-thm]');
    if (!el) return;
    const ds = el.dataset;
    // Language / theme only change presentation: criteria, drafts, log, portions, report notes and the current screen are kept.
    if (ds.lang) { const ta = $('#repnote'); if (ta && U.sheet) U.sheet.note = ta.value; U.lang = ds.lang === 'zh' ? 'zh' : 'en'; return render(true); }
    if (ds.thm) { U.theme = ['light', 'dark', 'system'].includes(ds.thm) ? ds.thm : 'light'; return render(true); }
    if (ds.go) return go(ds.go);
    if (ds.open) { U.detail = ds.open; U.explain = false; U.screen = 'detail'; return render(); }
    if (ds.cat) { U.cat = ds.cat; return render(true); }
    if (ds.mode) { P.mode = ds.mode; if (ds.mode === 'snack' && (U.cat === 'rice' || U.cat === 'noodles')) U.cat = 'all'; save(); return toast(ds.mode === 'snack' ? t('t_snack') : t('t_meal')); }
    if (ds.avoid) { const a = U.draft.avoid, i = a.indexOf(ds.avoid); i < 0 ? a.push(ds.avoid) : a.splice(i, 1); return render(true); }
    if (ds.budget) { U.draft.budget = +ds.budget; return render(true); }
    if (ds.fact) { const f = U.draft.facts, i = f.indexOf(ds.fact); if (i >= 0) f.splice(i, 1); else if (f.length < 3) f.push(ds.fact); else return toast(t('t_pick3')); return render(true); }
    if (ds.step) { U.draft.dailyProtein = Math.max(30, Math.min(250, U.draft.dailyProtein + +ds.step)); return render(true); }
    if (ds.cgoal) { U.calc.goal = ds.cgoal; return render(true); }
    if (ds.portion) { P.portion[U.detail] = ds.portion; save(); return render(true); }
    if (ds.reason) { U.sheet.reason = ds.reason; return render(true); }
    if (ds.swap) { U.detail = ds.swap; U.sheet = null; U.explain = false; return toast(t('t_swapped')); }
    if (ds.del !== undefined) { const [x] = P.log.splice(+ds.del, 1); save(); U.lastDel = x; return toast(t('t_removed', logName(x))); }
    if (ds.fb) { P.feedback[U.detail] = ds.fb; save(); return render(true); }
    switch (ds.act) {
      case 'start': return go('criteria');
      case 'browse': P.onboarded = true; save(); return go('menu');
      case 'back': if (U.screen === 'criteria' && !P.onboarded) { U.screen = 'welcome'; return render(); } return go('menu');
      case 'why': U.sheet = { type: 'why' }; return render(true);
      case 'toggleHidden': U.showHidden = !U.showHidden; return render(true);
      case 'notthis': U.sheet = { type: 'notthis' }; return render(true);
      case 'add': U.sheet = { type: 'add' }; return render(true);
      case 'report': U.sheet = { type: 'report' }; return render(true);
      case 'safetytip': U.tip = ds.tip || null; return render(true);
      case 'closetip': U.tip = null; return render(true);
      case 'reset': U.sheet = { type: 'reset' }; return render(true);
      case 'close': U.sheet = null; return render(true);
      case 'explain': U.explain = !U.explain; return render(true);
      case 'calc': U.calc = U.calc ? null : { w: 65, goal: 'build' }; return render(true);
      case 'usecalc': { const r = calcRange(U.calc); U.draft.dailyProtein = Math.round((r[0] + r[1]) / 2); U.calc = null; return toast(t('t_goalUpd')); }
      case 'saveCrit': {
        const first = !P.onboarded;
        // Soft-fallback at save time: if fields are empty/invalid, use sensible defaults
        // so the menu still works. The error state reappears if they come back to criteria.
        const draft = JSON.parse(JSON.stringify(U.draft));
        if (draft.budget === '' || isNaN(+draft.budget) || +draft.budget < 0) draft.budget = 40;
        if (draft.trackProtein && (draft.dailyProtein === '' || isNaN(+draft.dailyProtein) || +draft.dailyProtein < 0)) draft.dailyProtein = 105;
        P.crit = draft; P.onboarded = true; save();
        U.showHidden = false; U.screen = 'menu'; U.sheet = null;
        return toast(first ? t('t_first') : t('t_saved'));
      }
      case 'confirmAdd': {
        const d = dish(U.detail), n = nutrition(d), now = new Date();
        const portion = portionOf(d) !== 'regular' && d.portions && n ? portionOf(d) : null;
        P.log.push({ id: d.id, name: d.name + (portion ? ` (${STR.en['portion_' + portion]})` : ''), portion, price: priceOf(d), protein: n && n.protein ? n.protein : null, kcal: n && n.kcal ? n.kcal : null,
          mode: !n || !n.protein ? 'none' : n.mode === 'ai' ? 'ai' : n.real ? 'label' : 'sample', time: now.toTimeString().slice(0, 5) });
        save(); U.sheet = null; return toast(t('t_added', dName(d)), true);
      }
      case 'undo': if (P.log.length) { P.log.pop(); save(); } clearTimeout(toastT); U.toast = null; return render(true);
      case 'sendReport': { const note = (($('#repnote') || {}).value || U.sheet.note || '').trim(); P.reports[U.detail] = { choice: U.sheet.choice, note, time: new Date().toTimeString().slice(0, 5) }; save(); U.sheet = null; return toast(t('t_reported')); }
      case 'doReset': store.clear(); P = fresh(); U.sheet = null; U.screen = 'welcome'; U.cat = 'all'; U.q = ''; U.lang = 'en'; U.theme = 'light'; return toast(t('t_reset'));
    }
  });
  app.addEventListener('change', ev => {
    const el = ev.target;
    if (el.id === 'sort') { U.sort = el.value; render(true); }
    if (el.id === 'track') { U.draft.trackProtein = el.checked; render(true); }
    if (el.id === 'useai') { U.draft.useAI = el.checked; render(true); }
    if (el.name === 'rep') { const ta = $('#repnote'); if (ta) U.sheet.note = ta.value; U.sheet.choice = el.value; render(true); }
    if (el.id === 'cw') { U.calc.w = el.value; render(true); }
  });
  app.addEventListener('input', ev => {
    const el = ev.target;
    if (el.id === 'budget') {
      const raw = el.value === '' ? '' : +el.value;
      U.draft.budget = (raw === '' || isNaN(raw)) ? '' : Math.round(raw);
      // Update chip active state directly
      document.querySelectorAll('[data-budget]').forEach(b => b.classList.toggle('on', +b.dataset.budget === +raw));
      // Update error state directly (no full re-render to keep focus)
      const wrap = el.closest('.num-input');
      let errKey = null;
      if (raw === '' || isNaN(raw)) errKey = 'errBudgetEmpty';
      else if (raw < 0) errKey = 'errBudgetNeg';
      else if (raw < 10) errKey = 'errBudgetLow';
      else if (raw > 80) errKey = 'errBudgetHigh';
      wrap.classList.toggle('has-error', !!errKey);
      const oldErr = document.getElementById('budget-error');
      const hintEl = wrap.parentElement.querySelector('.hint');
      if (errKey) {
        if (oldErr) { oldErr.textContent = t(errKey); }
        else {
          const p = document.createElement('p');
          p.id = 'budget-error'; p.className = 'field-error'; p.role = 'alert';
          p.textContent = t(errKey);
          wrap.insertAdjacentElement('afterend', p);
          if (hintEl) hintEl.style.display = 'none';
        }
        el.setAttribute('aria-invalid', 'true');
        el.setAttribute('aria-describedby', 'budget-error');
      } else {
        if (oldErr) oldErr.remove();
        if (hintEl) hintEl.style.display = '';
        el.removeAttribute('aria-invalid');
        el.removeAttribute('aria-describedby');
      }
    }
    if (el.id === 'repnote' && U.sheet) U.sheet.note = el.value;
    if (el.id === 'protein') {
      const raw = el.value === '' ? '' : +el.value;
      U.draft.dailyProtein = (raw === '' || isNaN(raw)) ? '' : Math.round(raw);
      // Update error state directly (no full re-render to keep focus)
      const wrap = el.closest('.num-input');
      let errKey = null;
      if (raw === '' || isNaN(raw)) errKey = 'errProteinEmpty';
      else if (raw < 0) errKey = 'errProteinNeg';
      else if (raw < 30) errKey = 'errProteinLow';
      else if (raw > 250) errKey = 'errProteinHigh';
      wrap.classList.toggle('has-error', !!errKey);
      const oldErr = document.getElementById('protein-error');
      const hintEl = wrap.parentElement.querySelector('.hint');
      if (errKey) {
        if (oldErr) { oldErr.textContent = t(errKey); }
        else {
          const p = document.createElement('p');
          p.id = 'protein-error'; p.className = 'field-error'; p.role = 'alert';
          p.textContent = t(errKey);
          wrap.insertAdjacentElement('afterend', p);
          if (hintEl) hintEl.style.display = 'none';
        }
        el.setAttribute('aria-invalid', 'true');
        el.setAttribute('aria-describedby', 'protein-error');
      } else {
        if (oldErr) oldErr.remove();
        if (hintEl) hintEl.style.display = '';
        el.removeAttribute('aria-invalid');
        el.removeAttribute('aria-describedby');
      }
    }
    if (el.id === 'q') { U.q = el.value; U.focusQ = true; render(true); U.focusQ = false; }
  });
  app.addEventListener('blur', ev => {
    // Soft validation: never clamp. Round on blur for cleanliness.
    // Error state is managed by the input handler; no full re-render here.
    const el = ev.target;
    if (el.id === 'budget' || el.id === 'protein') {
      const raw = el.value;
      if (raw !== '' && !isNaN(+raw)) {
        const rounded = Math.round(+raw);
        el.value = rounded;
        if (el.id === 'budget') U.draft.budget = rounded;
        else U.draft.dailyProtein = rounded;
        // Re-check error state with the rounded value
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }, true);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && U.sheet) { U.sheet = null; render(true); } });

  if (U.screen === 'criteria') U.draft = JSON.parse(JSON.stringify(P.crit));
  render();
})();
