const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STORE_KEY = "periodCycleSettings.v2";
const LOG_KEY = "periodCycleLogs.v2";

const phaseLabels = {
  period: "生理期",
  follicular: "濾泡期",
  fertile: "受孕窗",
  ovulation: "排卵日",
  luteal: "黃體期",
};

const phaseCopy = {
  period: {
    title: "正在生理期",
    text: "身體正在排出子宮內膜，這幾天可以優先照顧睡眠、保暖與疼痛記錄。",
    action: "記錄流量與疼痛",
  },
  follicular: {
    title: "濾泡期",
    text: "能量通常會慢慢回升，適合觀察分泌物、安排運動與建立下一次週期基準。",
    action: "記錄心情與能量",
  },
  fertile: {
    title: "受孕窗",
    text: "這段時間接近排卵，日期只屬估算。若用於避孕，請搭配可靠避孕方式。",
    action: "留意分泌物變化",
  },
  ovulation: {
    title: "預估排卵日",
    text: "今天接近預估排卵日，可能出現透明黏稠分泌物或單側輕微不適。",
    action: "記錄排卵跡象",
  },
  luteal: {
    title: "黃體期",
    text: "黃體期可能出現疲倦、乳房不適或情緒波動。規律睡眠和症狀追蹤會更有幫助。",
    action: "記錄 PMS 變化",
  },
};

const careMap = {
  period: [
    ["rose", "補水與保暖", "若有悶痛，可以記錄疼痛程度與是否影響日常。", "droplet"],
    ["teal", "降低負擔", "把高強度安排改成輕量活動，讓身體恢復。", "heart"],
    ["violet", "睡眠優先", "睡前減少刺激，隔天比較容易看出症狀變化。", "moon"],
  ],
  follicular: [
    ["teal", "觀察能量", "濾泡期常是狀態回升期，適合記錄精神與運動。", "heart"],
    ["violet", "建立基準", "分泌物、睡眠和情緒都能幫助下個月看趨勢。", "calendar"],
    ["rose", "保持彈性", "週期不是每天都固定，壓力和作息都可能讓日期浮動。", "flower"],
  ],
  fertile: [
    ["rose", "受孕窗提醒", "若正在避免懷孕，不要只依賴日期推算。", "bell"],
    ["teal", "看身體訊號", "排卵前後分泌物可能變得清澈、滑順或較有彈性。", "droplet"],
    ["violet", "記錄變化", "把分泌物、腹部感覺和心情一起記下來。", "save"],
  ],
  ovulation: [
    ["rose", "排卵日估算", "日期會隨週期浮動，若要更準可搭配排卵試紙或體溫。", "flower"],
    ["teal", "留意不適", "單側下腹悶痛或透明分泌物可記在今日記錄。", "droplet"],
    ["violet", "安排提醒", "把下一次生理期預估日期匯出到日曆。", "calendar"],
  ],
  luteal: [
    ["violet", "情緒與睡眠", "黃體期適合追蹤 PMS、睡眠和壓力變化。", "moon"],
    ["rose", "症狀記錄", "乳房不適、脹氣、頭痛都可以用症狀標籤保存。", "heart"],
    ["teal", "下次生理期", "若日期大幅延後或出血異常，建議諮詢醫師。", "bell"],
  ],
};

const els = {
  form: document.querySelector("#cycleForm"),
  lastPeriod: document.querySelector("#lastPeriod"),
  cycleLength: document.querySelector("#cycleLength"),
  periodLength: document.querySelector("#periodLength"),
  advancedToggle: document.querySelector("#advancedToggle"),
  lutealField: document.querySelector("#lutealField"),
  lutealLength: document.querySelector("#lutealLength"),
  lutealOutput: document.querySelector("#lutealOutput"),
  lutealHint: document.querySelector("#lutealHint"),
  cyclesAhead: document.querySelector("#cyclesAhead"),
  resetBtn: document.querySelector("#resetBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  validationNote: document.querySelector("#validationNote"),
  todayText: document.querySelector("#todayText"),
  phaseTitle: document.querySelector("#phaseTitle"),
  phaseToken: document.querySelector("#phaseToken"),
  statusSubline: document.querySelector("#statusSubline"),
  startPeriodBtn: document.querySelector("#startPeriodBtn"),
  cycleRing: document.querySelector("#cycleRing"),
  cyclePointer: document.querySelector("#cyclePointer"),
  cycleDayText: document.querySelector("#cycleDayText"),
  phaseName: document.querySelector("#phaseName"),
  phaseRange: document.querySelector("#phaseRange"),
  nextPeriodText: document.querySelector("#nextPeriodText"),
  daysUntilNext: document.querySelector("#daysUntilNext"),
  ovulationText: document.querySelector("#ovulationText"),
  fertileText: document.querySelector("#fertileText"),
  daysUntilOvulation: document.querySelector("#daysUntilOvulation"),
  bodyStageTitle: document.querySelector("#bodyStageTitle"),
  bodyStageText: document.querySelector("#bodyStageText"),
  nextActionText: document.querySelector("#nextActionText"),
  calendarTitle: document.querySelector("#calendarTitle"),
  calendarGrid: document.querySelector("#calendarGrid"),
  prevMonth: document.querySelector("#prevMonth"),
  currentMonth: document.querySelector("#currentMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  cycleList: document.querySelector("#cycleList"),
  careList: document.querySelector("#careList"),
  logTitle: document.querySelector("#logTitle"),
  selectedDateText: document.querySelector("#selectedDateText"),
  flowLevel: document.querySelector("#flowLevel"),
  painLevel: document.querySelector("#painLevel"),
  painOutput: document.querySelector("#painOutput"),
  notes: document.querySelector("#notes"),
  saveLogBtn: document.querySelector("#saveLogBtn"),
  clearLogBtn: document.querySelector("#clearLogBtn"),
  logStatus: document.querySelector("#logStatus"),
};

let currentMonthDate = startOfMonth(today());
let selectedLogDate = today();
let currentPlan = null;
let logs = loadJson(LOG_KEY, {});

function today() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function inputDate(date) {
  return date.toISOString().slice(0, 10);
}

function icsDate(date) {
  return inputDate(date).split("-").join("");
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function startOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function sameDate(a, b) {
  return inputDate(a) === inputDate(b);
}

function diffDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

function inRange(date, start, end) {
  return date >= start && date <= end;
}

function formatDate(date, withYear = false) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "UTC",
    year: withYear ? "numeric" : undefined,
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
  }).format(date);
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setText(node, value) {
  if (node) node.textContent = value;
}

function getSettings() {
  const lastPeriodValue = els.lastPeriod.value;
  const cycleLength = Number(els.cycleLength.value);
  const periodLength = Number(els.periodLength.value);
  const lutealLength = Number(els.lutealLength.value);
  const cyclesAhead = Number(els.cyclesAhead.value);

  if (!lastPeriodValue) {
    throw new Error("請先選擇上次生理期第一天。");
  }

  if (parseDate(lastPeriodValue) > today()) {
    throw new Error("上次生理期第一天不能晚於今天。");
  }

  if (cycleLength < 21 || cycleLength > 45) {
    throw new Error("平均週期請填 21 到 45 天。");
  }

  if (periodLength < 2 || periodLength > 10) {
    throw new Error("生理期持續天數請填 2 到 10 天。");
  }

  if (periodLength >= cycleLength) {
    throw new Error("生理期持續天數必須小於平均週期天數。");
  }

  if (lutealLength < 7 || lutealLength > 19 || lutealLength >= cycleLength) {
    throw new Error("黃體期請設定為 7 到 19 天，且必須小於平均週期。");
  }

  return {
    lastPeriod: parseDate(lastPeriodValue),
    cycleLength,
    periodLength,
    lutealLength,
    cyclesAhead,
    advanced: els.advancedToggle.checked,
  };
}

function makeCycle(settings, index) {
  const start = addDays(settings.lastPeriod, settings.cycleLength * index);
  const nextStart = addDays(start, settings.cycleLength);
  const ovulation = addDays(nextStart, -settings.lutealLength);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);

  return {
    index,
    start,
    nextStart,
    periodEnd: addDays(start, settings.periodLength - 1),
    ovulation,
    fertileStart,
    fertileEnd,
    lutealStart: addDays(ovulation, 1),
    lutealEnd: addDays(nextStart, -1),
  };
}

function getCycleForDate(settings, date) {
  const cycleIndex = Math.floor(diffDays(date, settings.lastPeriod) / settings.cycleLength);
  return makeCycle(settings, cycleIndex);
}

function getPhaseForDate(date, cycle) {
  if (inRange(date, cycle.start, cycle.periodEnd)) return "period";
  if (sameDate(date, cycle.ovulation)) return "ovulation";
  if (inRange(date, cycle.fertileStart, cycle.fertileEnd)) return "fertile";
  if (date < cycle.ovulation) return "follicular";
  return "luteal";
}

function phaseRangeText(phase, cycle) {
  if (phase === "period") return `${formatDate(cycle.start)} - ${formatDate(cycle.periodEnd)}`;
  if (phase === "ovulation") return formatDate(cycle.ovulation);
  if (phase === "fertile") return `${formatDate(cycle.fertileStart)} - ${formatDate(cycle.fertileEnd)}`;
  if (phase === "luteal") return `${formatDate(cycle.lutealStart)} - ${formatDate(cycle.lutealEnd)}`;
  return `${formatDate(cycle.start)} - ${formatDate(addDays(cycle.ovulation, -1))}`;
}

function getUpcomingOvulation(settings, activeCycle, date) {
  return activeCycle.ovulation >= date ? activeCycle.ovulation : makeCycle(settings, activeCycle.index + 1).ovulation;
}

function getPlan() {
  const settings = getSettings();
  const todayDate = today();
  const activeCycle = getCycleForDate(settings, todayDate);
  const todayPhase = getPhaseForDate(todayDate, activeCycle);
  const visibleCycles = [];
  const firstIndex = Math.max(0, activeCycle.index);

  for (let i = firstIndex; i < firstIndex + settings.cyclesAhead; i += 1) {
    visibleCycles.push(makeCycle(settings, i));
  }

  return {
    settings,
    todayDate,
    activeCycle,
    todayPhase,
    visibleCycles,
  };
}

function renderAll() {
  try {
    currentPlan = getPlan();
    saveJson(STORE_KEY, {
      lastPeriod: els.lastPeriod.value,
      cycleLength: els.cycleLength.value,
      periodLength: els.periodLength.value,
      advanced: els.advancedToggle.checked,
      lutealLength: els.lutealLength.value,
      cyclesAhead: els.cyclesAhead.value,
    });
    setText(els.validationNote, makeValidationNote(currentPlan.settings));
    renderStatus();
    renderCalendar();
    renderCycles();
    renderCare();
    renderLogForm();
  } catch (error) {
    currentPlan = null;
    setText(els.validationNote, error.message);
  }
}

function makeValidationNote(settings) {
  const warnings = [];
  if (settings.cycleLength < 24 || settings.cycleLength > 38) {
    warnings.push("週期不在常見規則範圍內，日期誤差可能較大。");
  }
  if (settings.periodLength > 8) {
    warnings.push("生理期超過 8 天時，若經常發生建議諮詢醫師。");
  }
  if (!warnings.length) return "已儲存到這台裝置。";
  return warnings.join(" ");
}

function renderStatus() {
  const { settings, activeCycle, todayDate, todayPhase } = currentPlan;
  const dayInCycle = diffDays(todayDate, activeCycle.start) + 1;
  const daysToNext = Math.max(0, diffDays(activeCycle.nextStart, todayDate));
  const upcomingOvulation = getUpcomingOvulation(settings, activeCycle, todayDate);
  const daysToOvulation = Math.max(0, diffDays(upcomingOvulation, todayDate));
  const pointerAngle = ((dayInCycle - 1) / settings.cycleLength) * 360;
  const periodDeg = (settings.periodLength / settings.cycleLength) * 360;
  const fertileStartDay = Math.max(settings.periodLength, diffDays(activeCycle.fertileStart, activeCycle.start));
  const fertileEndDay = Math.min(settings.cycleLength, diffDays(activeCycle.fertileEnd, activeCycle.start) + 1);
  const fertileStartDeg = (fertileStartDay / settings.cycleLength) * 360;
  const fertileEndDeg = Math.max(fertileStartDeg + 8, (fertileEndDay / settings.cycleLength) * 360);
  const copy = phaseCopy[todayPhase];

  setText(els.phaseTitle, copy.title);
  setText(els.phaseToken, `第 ${dayInCycle} / ${settings.cycleLength} 天`);
  setText(els.statusSubline, `${copy.text} 下次生理期預估在 ${formatDate(activeCycle.nextStart)}。`);
  els.cycleRing.style.setProperty("--period-end", `${periodDeg}deg`);
  els.cycleRing.style.setProperty("--fertile-start", `${fertileStartDeg}deg`);
  els.cycleRing.style.setProperty("--fertile-end", `${fertileEndDeg}deg`);
  els.cyclePointer.style.setProperty("--pointer-angle", `${pointerAngle}deg`);
  setText(els.cycleDayText, `第 ${dayInCycle} 天`);
  setText(els.phaseName, phaseLabels[todayPhase]);
  setText(els.phaseRange, phaseRangeText(todayPhase, activeCycle));
  setText(els.nextPeriodText, formatDate(activeCycle.nextStart, true));
  setText(els.daysUntilNext, daysToNext === 0 ? "今天" : `${daysToNext} 天`);
  setText(els.ovulationText, formatDate(activeCycle.ovulation, true));
  setText(els.fertileText, `${formatDate(activeCycle.fertileStart)} - ${formatDate(activeCycle.fertileEnd)}`);
  setText(els.daysUntilOvulation, daysToOvulation === 0 ? "今天" : `${daysToOvulation} 天`);
  setText(els.bodyStageTitle, copy.title);
  setText(els.bodyStageText, copy.text);
  setText(els.nextActionText, copy.action);
}

function renderCalendar() {
  if (!currentPlan) return;

  const year = currentMonthDate.getUTCFullYear();
  const month = currentMonthDate.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const offset = firstDay.getUTCDay();
  const gridStart = addDays(firstDay, -offset);
  const todayDate = today();

  setText(els.calendarTitle, formatMonth(currentMonthDate));
  els.calendarGrid.innerHTML = "";

  for (let i = 0; i < 42; i += 1) {
    const date = addDays(gridStart, i);
    const key = inputDate(date);
    const cycle = getCycleForDate(currentPlan.settings, date);
    const phase = getPhaseForDate(date, cycle);
    const button = document.createElement("button");

    button.type = "button";
    button.className = `day-cell ${phase}`;
    button.textContent = String(date.getUTCDate());
    button.setAttribute("aria-label", `${formatDate(date, true)} ${phaseLabels[phase]}`);

    if (date.getUTCMonth() !== month) button.classList.add("is-muted");
    if (sameDate(date, todayDate)) button.classList.add("is-today");
    if (sameDate(date, selectedLogDate)) button.classList.add("is-selected");
    if (logs[key]) button.classList.add("has-note");

    button.addEventListener("click", () => {
      selectedLogDate = date;
      renderCalendar();
      renderLogForm();
      activateTab("log");
    });

    els.calendarGrid.append(button);
  }
}

function renderCycles() {
  els.cycleList.innerHTML = "";

  for (const cycle of currentPlan.visibleCycles) {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    const dates = document.createElement("span");
    const fertility = document.createElement("span");
    const luteal = document.createElement("span");

    title.textContent = `${formatDate(cycle.start, true)} 開始`;
    dates.textContent = `生理期：${formatDate(cycle.start)} - ${formatDate(cycle.periodEnd)}`;
    fertility.textContent = `受孕窗：${formatDate(cycle.fertileStart)} - ${formatDate(cycle.fertileEnd)}，排卵日 ${formatDate(cycle.ovulation)}`;
    luteal.textContent = `黃體期：${formatDate(cycle.lutealStart)} - ${formatDate(cycle.lutealEnd)}`;

    item.append(title, dates, fertility, luteal);
    els.cycleList.append(item);
  }
}

function renderCare() {
  const items = careMap[currentPlan.todayPhase] ?? careMap.follicular;
  els.careList.innerHTML = "";

  for (const [tone, title, text, icon] of items) {
    const item = document.createElement("article");
    item.className = "care-item";
    item.innerHTML = `
      <span class="tile-icon ${tone}"><svg><use href="#icon-${icon}"></use></svg></span>
      <div><strong></strong><span></span></div>
    `;
    item.querySelector("strong").textContent = title;
    item.querySelector("span:last-child").textContent = text;
    els.careList.append(item);
  }
}

function renderLogForm() {
  const key = inputDate(selectedLogDate);
  const log = logs[key] ?? {};
  const isToday = sameDate(selectedLogDate, today());

  setText(els.logTitle, isToday ? "今日記錄" : "日期記錄");
  setText(els.selectedDateText, formatDate(selectedLogDate, true));
  els.flowLevel.value = log.flow ?? "";
  els.painLevel.value = log.pain ?? "0";
  setText(els.painOutput, `${els.painLevel.value} / 10`);
  els.notes.value = log.notes ?? "";
  document.querySelectorAll('input[name="mood"]').forEach((input) => {
    input.checked = input.value === (log.mood ?? "");
  });
  document.querySelectorAll('input[name="symptoms"]').forEach((input) => {
    input.checked = (log.symptoms ?? []).includes(input.value);
  });
}

function saveLog() {
  const key = inputDate(selectedLogDate);
  const mood = document.querySelector('input[name="mood"]:checked')?.value ?? "";
  const symptoms = [...document.querySelectorAll('input[name="symptoms"]:checked')].map((input) => input.value);
  const log = {
    flow: els.flowLevel.value,
    pain: els.painLevel.value,
    mood,
    symptoms,
    notes: els.notes.value.trim(),
  };
  const hasContent = log.flow || log.mood || log.symptoms.length || log.notes || Number(log.pain) > 0;

  if (hasContent) {
    logs[key] = log;
    setText(els.logStatus, "已儲存。");
  } else {
    delete logs[key];
    setText(els.logStatus, "沒有內容可儲存。");
  }

  saveJson(LOG_KEY, logs);
  renderCalendar();
}

function clearLog() {
  delete logs[inputDate(selectedLogDate)];
  saveJson(LOG_KEY, logs);
  renderLogForm();
  renderCalendar();
  setText(els.logStatus, "已清除。");
}

function updateAdvancedVisibility() {
  els.lutealField.hidden = !els.advancedToggle.checked;
  setText(els.lutealOutput, `${els.lutealLength.value} 天`);
  setText(els.lutealHint, els.advancedToggle.checked ? `${els.lutealLength.value} 天` : "預設 14 天");
}

function exportCalendar() {
  if (!currentPlan) renderAll();
  if (!currentPlan) return;

  const events = [];
  for (const cycle of currentPlan.visibleCycles) {
    events.push(makeEvent("生理期（預估）", cycle.start, addDays(cycle.periodEnd, 1)));
    events.push(makeEvent("受孕窗（預估）", cycle.fertileStart, addDays(cycle.fertileEnd, 1)));
    events.push(makeEvent("排卵日（預估）", cycle.ovulation, addDays(cycle.ovulation, 1)));
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Period Cycle App//ZH-TW//",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "period-cycle-plan.ics";
  link.click();
  URL.revokeObjectURL(url);
}

function makeEvent(title, start, end) {
  const uid = `${title}-${inputDate(start)}@period-cycle-app`;
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsDate(today())}T000000Z`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `SUMMARY:${title}`,
    "DESCRIPTION:此日期由週期計算 App 估算，不能作為醫療診斷或避孕保證。",
    "END:VEVENT",
  ].join("\r\n");
}

function applySavedSettings() {
  const saved = loadJson(STORE_KEY, null) ?? loadJson("periodCycleSettings", null);
  const fallbackStart = addDays(today(), -14);

  els.lastPeriod.value = saved?.lastPeriod ?? inputDate(fallbackStart);
  els.cycleLength.value = saved?.cycleLength ?? "28";
  els.periodLength.value = saved?.periodLength ?? "5";
  els.advancedToggle.checked = Boolean(saved?.advanced);
  els.lutealLength.value = saved?.lutealLength ?? "14";
  els.cyclesAhead.value = saved?.cyclesAhead ?? "6";
  updateAdvancedVisibility();
}

function activateTab(name) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.tabPanel === name);
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === name);
  });
  if (name === "calendar") renderCalendar();
  if (name === "log") renderLogForm();
}

function startPeriodToday() {
  els.lastPeriod.value = inputDate(today());
  selectedLogDate = today();
  if (!els.flowLevel.value) els.flowLevel.value = "medium";
  renderAll();
  activateTab("log");
  setText(els.logStatus, "已把今天設為生理期第一天，可以補上今日狀態。");
}

setText(els.todayText, formatDate(today(), true));
els.lastPeriod.max = inputDate(today());
applySavedSettings();
renderAll();

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderAll();
  activateTab("today");
});

[els.lastPeriod, els.cycleLength, els.periodLength, els.cyclesAhead].forEach((input) => {
  input.addEventListener("change", renderAll);
});

els.advancedToggle.addEventListener("change", () => {
  updateAdvancedVisibility();
  renderAll();
});

els.lutealLength.addEventListener("input", () => {
  updateAdvancedVisibility();
  renderAll();
});

els.resetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem("periodCycleSettings");
  applySavedSettings();
  renderAll();
});

els.exportBtn.addEventListener("click", exportCalendar);
els.startPeriodBtn.addEventListener("click", startPeriodToday);

els.prevMonth.addEventListener("click", () => {
  currentMonthDate = addMonths(currentMonthDate, -1);
  renderCalendar();
});

els.currentMonth.addEventListener("click", () => {
  currentMonthDate = startOfMonth(today());
  renderCalendar();
});

els.nextMonth.addEventListener("click", () => {
  currentMonthDate = addMonths(currentMonthDate, 1);
  renderCalendar();
});

els.painLevel.addEventListener("input", () => {
  setText(els.painOutput, `${els.painLevel.value} / 10`);
});

els.saveLogBtn.addEventListener("click", saveLog);
els.clearLogBtn.addEventListener("click", clearLog);

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tab));
});

document.querySelectorAll("[data-tab-target]").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
});

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}
