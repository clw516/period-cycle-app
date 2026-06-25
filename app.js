const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STORE_KEY = "periodCycleSettings";
const LOG_KEY = "periodCycleLogs";

const phaseLabels = {
  period: "月經期",
  follicular: "濾泡期",
  fertile: "受孕窗",
  ovulation: "排卵日",
  luteal: "黃體期",
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
  cycleRing: document.querySelector("#cycleRing"),
  cyclePointer: document.querySelector("#cyclePointer"),
  cycleDayText: document.querySelector("#cycleDayText"),
  phaseName: document.querySelector("#phaseName"),
  phaseRange: document.querySelector("#phaseRange"),
  nextPeriodText: document.querySelector("#nextPeriodText"),
  ovulationText: document.querySelector("#ovulationText"),
  fertileText: document.querySelector("#fertileText"),
  lutealText: document.querySelector("#lutealText"),
  calendarTitle: document.querySelector("#calendarTitle"),
  calendarGrid: document.querySelector("#calendarGrid"),
  prevMonth: document.querySelector("#prevMonth"),
  currentMonth: document.querySelector("#currentMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  cycleList: document.querySelector("#cycleList"),
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

function getSettings() {
  const lastPeriodValue = els.lastPeriod.value;
  const cycleLength = Number(els.cycleLength.value);
  const periodLength = Number(els.periodLength.value);
  const lutealLength = Number(els.lutealLength.value);
  const cyclesAhead = Number(els.cyclesAhead.value);

  if (!lastPeriodValue) {
    throw new Error("請先選擇上次月經第一天。");
  }

  if (parseDate(lastPeriodValue) > today()) {
    throw new Error("上次月經第一天不能晚於今天。");
  }

  if (cycleLength < 21 || cycleLength > 45) {
    throw new Error("平均週期請填 21 到 45 天。");
  }

  if (periodLength < 2 || periodLength > 10) {
    throw new Error("月經持續天數請填 2 到 10 天。");
  }

  if (periodLength >= cycleLength) {
    throw new Error("月經持續天數必須小於平均週期天數。");
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
    els.validationNote.textContent = makeValidationNote(currentPlan.settings);
    renderStatus();
    renderCalendar();
    renderCycles();
    renderLogForm();
  } catch (error) {
    currentPlan = null;
    els.validationNote.textContent = error.message;
  }
}

function makeValidationNote(settings) {
  const warnings = [];
  if (settings.cycleLength < 24 || settings.cycleLength > 38) {
    warnings.push("週期不在常見規則範圍內，日期誤差可能較大。");
  }
  if (settings.periodLength > 8) {
    warnings.push("月經超過 8 天時，若經常發生建議諮詢醫師。");
  }
  if (!warnings.length) return "已儲存到此瀏覽器。";
  return warnings.join(" ");
}

function renderStatus() {
  const { settings, activeCycle, todayDate, todayPhase } = currentPlan;
  const dayInCycle = diffDays(todayDate, activeCycle.start) + 1;
  const pointerAngle = ((dayInCycle - 1) / settings.cycleLength) * 360;
  const periodDeg = (settings.periodLength / settings.cycleLength) * 360;
  const fertileStartDay = Math.max(settings.periodLength, diffDays(activeCycle.fertileStart, activeCycle.start));
  const fertileEndDay = Math.min(settings.cycleLength, diffDays(activeCycle.fertileEnd, activeCycle.start) + 1);
  const fertileStartDeg = (fertileStartDay / settings.cycleLength) * 360;
  const fertileEndDeg = Math.max(fertileStartDeg + 8, (fertileEndDay / settings.cycleLength) * 360);

  els.phaseTitle.textContent = phaseLabels[todayPhase];
  els.phaseToken.textContent = `第 ${dayInCycle} / ${settings.cycleLength} 天`;
  els.cycleRing.style.setProperty("--period-end", `${periodDeg}deg`);
  els.cycleRing.style.setProperty("--fertile-start", `${fertileStartDeg}deg`);
  els.cycleRing.style.setProperty("--fertile-end", `${fertileEndDeg}deg`);
  els.cyclePointer.style.setProperty("--pointer-angle", `${pointerAngle}deg`);
  els.cycleDayText.textContent = `第 ${dayInCycle} 天`;
  els.phaseName.textContent = phaseLabels[todayPhase];
  els.phaseRange.textContent = phaseRangeText(todayPhase, activeCycle);
  els.nextPeriodText.textContent = formatDate(activeCycle.nextStart, true);
  els.ovulationText.textContent = formatDate(activeCycle.ovulation, true);
  els.fertileText.textContent = `${formatDate(activeCycle.fertileStart)} - ${formatDate(activeCycle.fertileEnd)}`;
  els.lutealText.textContent = `${formatDate(activeCycle.lutealStart)} - ${formatDate(activeCycle.lutealEnd)}`;
}

function renderCalendar() {
  if (!currentPlan) return;

  const year = currentMonthDate.getUTCFullYear();
  const month = currentMonthDate.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const offset = firstDay.getUTCDay();
  const gridStart = addDays(firstDay, -offset);
  const todayDate = today();

  els.calendarTitle.textContent = formatMonth(currentMonthDate);
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
    dates.textContent = `月經期：${formatDate(cycle.start)} - ${formatDate(cycle.periodEnd)}`;
    fertility.textContent = `受孕窗：${formatDate(cycle.fertileStart)} - ${formatDate(cycle.fertileEnd)}，排卵日 ${formatDate(cycle.ovulation)}`;
    luteal.textContent = `黃體期：${formatDate(cycle.lutealStart)} - ${formatDate(cycle.lutealEnd)}`;

    item.append(title, dates, fertility, luteal);
    els.cycleList.append(item);
  }
}

function renderLogForm() {
  const key = inputDate(selectedLogDate);
  const log = logs[key] ?? {};
  const isToday = sameDate(selectedLogDate, today());

  els.logTitle.textContent = isToday ? "今日記錄" : "日期記錄";
  els.selectedDateText.textContent = formatDate(selectedLogDate, true);
  els.flowLevel.value = log.flow ?? "";
  els.painLevel.value = log.pain ?? "0";
  els.painOutput.textContent = `${els.painLevel.value} / 10`;
  els.notes.value = log.notes ?? "";
  document.querySelectorAll('input[name="mood"]').forEach((input) => {
    input.checked = input.value === (log.mood ?? "");
  });
}

function saveLog() {
  const key = inputDate(selectedLogDate);
  const mood = document.querySelector('input[name="mood"]:checked')?.value ?? "";
  const log = {
    flow: els.flowLevel.value,
    pain: els.painLevel.value,
    mood,
    notes: els.notes.value.trim(),
  };
  const hasContent = log.flow || log.mood || log.notes || Number(log.pain) > 0;

  if (hasContent) {
    logs[key] = log;
    els.logStatus.textContent = "已儲存。";
  } else {
    delete logs[key];
    els.logStatus.textContent = "沒有內容可儲存。";
  }

  saveJson(LOG_KEY, logs);
  renderCalendar();
}

function clearLog() {
  delete logs[inputDate(selectedLogDate)];
  saveJson(LOG_KEY, logs);
  renderLogForm();
  renderCalendar();
  els.logStatus.textContent = "已清除。";
}

function updateAdvancedVisibility() {
  els.lutealField.hidden = !els.advancedToggle.checked;
  els.lutealHint.textContent = els.advancedToggle.checked ? `${els.lutealLength.value} 天` : "預設 14 天";
}

function exportCalendar() {
  if (!currentPlan) renderAll();
  if (!currentPlan) return;

  const events = [];
  for (const cycle of currentPlan.visibleCycles) {
    events.push(makeEvent("月經期（預估）", cycle.start, addDays(cycle.periodEnd, 1)));
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
  const stamp = inputDate(today()).replaceAll("-", "");
  const uid = `${title}-${inputDate(start)}@period-cycle-app`;
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}T000000Z`,
    `DTSTART;VALUE=DATE:${inputDate(start).replaceAll("-", "")}`,
    `DTEND;VALUE=DATE:${inputDate(end).replaceAll("-", "")}`,
    `SUMMARY:${title}`,
    "DESCRIPTION:此日期由月經週期計算器估算，不能作為醫療診斷或避孕保證。",
    "END:VEVENT",
  ].join("\r\n");
}

function applySavedSettings() {
  const saved = loadJson(STORE_KEY, null);
  const fallbackStart = addDays(today(), -14);

  els.lastPeriod.value = saved?.lastPeriod ?? inputDate(fallbackStart);
  els.cycleLength.value = saved?.cycleLength ?? "28";
  els.periodLength.value = saved?.periodLength ?? "5";
  els.advancedToggle.checked = Boolean(saved?.advanced);
  els.lutealLength.value = saved?.lutealLength ?? "14";
  els.cyclesAhead.value = saved?.cyclesAhead ?? "6";
  updateAdvancedVisibility();
}

els.todayText.textContent = formatDate(today(), true);
els.lastPeriod.max = inputDate(today());
applySavedSettings();
renderAll();

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderAll();
});

[els.lastPeriod, els.cycleLength, els.periodLength, els.cyclesAhead].forEach((input) => {
  input.addEventListener("change", renderAll);
});

els.advancedToggle.addEventListener("change", () => {
  updateAdvancedVisibility();
  renderAll();
});

els.lutealLength.addEventListener("input", () => {
  els.lutealOutput.textContent = `${els.lutealLength.value} 天`;
  updateAdvancedVisibility();
  renderAll();
});

els.resetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORE_KEY);
  applySavedSettings();
  renderAll();
});

els.exportBtn.addEventListener("click", exportCalendar);

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
  els.painOutput.textContent = `${els.painLevel.value} / 10`;
});

els.saveLogBtn.addEventListener("click", saveLog);
els.clearLogBtn.addEventListener("click", clearLog);

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}
