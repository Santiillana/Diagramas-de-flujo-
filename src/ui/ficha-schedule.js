import { DIAS_SIN_CLASES, FICHA_TIME_ZONE, HORARIO_CLASES } from "../content/ficha.js";
import { isActivityOverdue, readFichaData } from "./ficha-store.js";

const pad = value => String(value).padStart(2, "0");
const toKey = ({ year, month, day }) => `${year}-${pad(month)}-${pad(day)}`;

function localParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FICHA_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const weekday = ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 })[values.weekday];
  return {
    year: Number(values.year), month: Number(values.month), day: Number(values.day),
    weekday, minutes: Number(values.hour) * 60 + Number(values.minute)
  };
}

function parseCivilDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

function shiftDate(key, amount) {
  const { year, month, day } = parseCivilDate(key);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return toKey({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
}

function weekdayFor(key) {
  const { year, month, day } = parseCivilDate(key);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function formatDate(key, options = { weekday: "long", day: "numeric", month: "long" }) {
  const { year, month, day } = parseCivilDate(key);
  return new Intl.DateTimeFormat("es-CO", { ...options, timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function formatTime(value) {
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour < 12 ? "a. m." : "p. m.";
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:${pad(minute)} ${suffix}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function classesForDate(key) {
  const weekday = weekdayFor(key);
  if (DIAS_SIN_CLASES.includes(weekday)) return [];
  return HORARIO_CLASES.filter(item => {
    if (item.diaSemana !== weekday) return false;
    if (item.vigenteDesde && key < item.vigenteDesde) return false;
    if (item.vigenteHasta && key > item.vigenteHasta) return false;
    return true;
  }).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

function statusFor(dateKey, item, now) {
  const todayKey = toKey(now);
  if (dateKey < todayKey) return ["ended", "Ya terminó"];
  if (dateKey > todayKey) return ["upcoming", "Próxima"];
  const start = Number(item.horaInicio.slice(0, 2)) * 60 + Number(item.horaInicio.slice(3));
  const end = Number(item.horaFin.slice(0, 2)) * 60 + Number(item.horaFin.slice(3));
  if (now.minutes >= start && now.minutes < end) return ["now", "Ahora"];
  if (now.minutes < start) return ["upcoming", "Próxima"];
  return ["ended", "Ya terminó"];
}

function activitiesForDate(key) {
  return readFichaData().activities.filter(activity =>
    !activity.archivedAt && (activity.assignedOn === key || activity.dueOn === key)
  );
}

function activityLabel(activity, key, todayKey) {
  if (activity.dueOn === key && activity.assignedOn === key) return "Asignada y vence hoy";
  if (activity.dueOn === key) return key < todayKey ? "Vencía este día" : "Fecha límite";
  return "Asignada este día";
}

function renderActivityCard(activity, key, now) {
  const todayKey = toKey(now);
  const overdue = isActivityOverdue(activity, todayKey);
  const label = overdue ? "Atrasada" : activity.dueOn === key ? "Fecha límite" : "Asignada";
  const status = ({
    pending: "Pendiente",
    in_progress: "En curso",
    submitted: "Entregada",
    needs_correction: "Por corregir",
    approved: "Aprobada"
  })[activity.status] || "Pendiente";
  return `<article class="ficha-activity-card" data-overdue="${overdue}">
    <div class="ficha-activity-main"><h4>${escapeHtml(activity.title)}</h4>
      <p>${escapeHtml(activityLabel(activity, key, todayKey))}${activity.classId ? " · " + escapeHtml(HORARIO_CLASES.find(item => item.id === activity.classId)?.materia || "Clase del sábado") : ""}</p>
    </div>
    <span class="ficha-activity-status">${label} · ${status}</span>
  </article>`;
}

function renderActivityDay(key, now) {
  const activities = activitiesForDate(key);
  if (!activities.length) return "";
  return `<section class="ficha-activities-day" aria-label="Actividades de ${escapeHtml(formatDate(key))}">
    <h4>Actividades y entregas</h4>
    <div class="ficha-activity-list">${activities.map(item => renderActivityCard(item, key, now)).join("")}</div>
  </section>`;
}

function renderClassCard(dateKey, item, now) {
  const [statusClass, statusLabel] = statusFor(dateKey, item, now);
  const title = item.materia || "Clase del sábado";
  return `<article class="ficha-class-card" data-status="${statusClass}">
    <div class="ficha-class-time"><strong>${formatTime(item.horaInicio)}</strong><span>${formatTime(item.horaFin)}</span></div>
    <div class="ficha-class-main"><h3>${escapeHtml(title)}</h3><p>Instructor/a: ${escapeHtml(item.instructor)}</p></div>
    <span class="ficha-class-status ficha-status-${statusClass}">${statusLabel}</span>
  </article>`;
}

function renderDay(dateKey, now, options = {}) {
  const classes = classesForDate(dateKey);
  const label = formatDate(dateKey);
  const body = classes.length
    ? classes.map(item => renderClassCard(dateKey, item, now)).join("")
    : '<p class="ficha-empty-day">No tienes clases programadas este día.</p>';
  return `<section class="ficha-day-block"><header><h3>${escapeHtml(label)}</h3>${options.badge ? `<span>${options.badge}</span>` : ""}</header><div class="ficha-class-list">${body}</div>${renderActivityDay(dateKey, now)}</section>`;
}

function weekStart(key) {
  return shiftDate(key, -((weekdayFor(key) + 6) % 7));
}

function monthStart(key) {
  const { year, month } = parseCivilDate(key);
  return `${year}-${pad(month)}-01`;
}

function monthDays(key) {
  const start = monthStart(key);
  const offset = (weekdayFor(start) + 6) % 7;
  const { year, month } = parseCivilDate(start);
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= count; day++) cells.push(`${year}-${pad(month)}-${pad(day)}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function initFichaSchedule() {
  const views = {
    hoy: document.querySelector("#ficha-hoy"),
    semana: document.querySelector("#ficha-semana"),
    calendario: document.querySelector("#ficha-calendario")
  };
  if (!views.hoy || !views.semana || !views.calendario) return;

  let weekAnchor = toKey(localParts());
  let calendarAnchor = monthStart(toKey(localParts()));
  let selectedCalendarDate = toKey(localParts());
  let weekFollowsToday = true;
  let monthFollowsToday = true;

  function renderToday(now = localParts()) {
    const key = toKey(now);
    const end = shiftDate(key, 7);
    const attention = readFichaData().activities.filter(activity =>
      !activity.archivedAt && activity.status !== "approved" && activity.dueOn &&
      (activity.dueOn <= end)
    ).sort((a, b) => a.dueOn.localeCompare(b.dueOn));
    const attentionMarkup = attention.length
      ? `<section class="ficha-attention"><h3>Entregas que requieren atención</h3><div class="ficha-activity-list">${attention.map(activity => {
          const overdue = isActivityOverdue(activity, key);
          const label = overdue ? "Atrasada" : activity.dueOn === key ? "Vence hoy" : "Próxima";
          return `<article class="ficha-activity-card" data-overdue="${overdue}"><div class="ficha-activity-main"><h4>${escapeHtml(activity.title)}</h4><p>${escapeHtml(label)} · ${escapeHtml(formatDate(activity.dueOn, { day: "numeric", month: "short" }))}</p></div><span class="ficha-activity-status">${escapeHtml(({pending:"Pendiente",in_progress:"En curso",submitted:"Entregada",needs_correction:"Por corregir",approved:"Aprobada"})[activity.status] || "Pendiente")}</span></article>`;
        }).join("")}</div></section>`
      : '<p class="ficha-empty-day">No tienes entregas próximas registradas.</p>';
    views.hoy.innerHTML = `<div class="ficha-schedule-heading"><div><p class="eyebrow">HORARIO OFICIAL · COLOMBIA</p><h2 id="hoy-title">${escapeHtml(formatDate(key))}</h2><p>Zona horaria: America/Bogota</p></div><span class="ficha-source-label">Horario oficial</span></div>${renderDay(key, now, { badge: "Hoy" })}<section class="ficha-attention-panel"><h3>Próximos siete días</h3>${attentionMarkup}</section>`;
  }

  function renderWeek(now = localParts()) {
    if (weekFollowsToday) weekAnchor = toKey(now);
    const start = weekStart(weekAnchor);
    const days = Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
    const end = days[6];
    views.semana.innerHTML = `<div class="ficha-schedule-heading"><div><p class="eyebrow">HORARIO RECURRENTE</p><h2 id="semana-title">Semana del ${escapeHtml(formatDate(start, { day: "numeric", month: "short" }))} al ${escapeHtml(formatDate(end, { day: "numeric", month: "long", year: "numeric" }))}</h2><p>Clases oficiales · America/Bogota</p></div><div class="ficha-schedule-actions"><button type="button" data-ficha-action="week-prev" aria-label="Semana anterior">←</button><button type="button" data-ficha-action="week-today">Esta semana</button><button type="button" data-ficha-action="week-next" aria-label="Semana siguiente">→</button></div></div><div class="ficha-week-grid">${days.map(key => renderDay(key, now, { badge: key === toKey(now) ? "Hoy" : "" })).join("")}</div>`;
  }

  function renderCalendar(now = localParts()) {
    if (monthFollowsToday) {
      const currentMonth = monthStart(toKey(now));
      if (calendarAnchor !== currentMonth) selectedCalendarDate = toKey(now);
      calendarAnchor = currentMonth;
    }
    const { year, month } = parseCivilDate(calendarAnchor);
    const cells = monthDays(calendarAnchor);
    const monthLabel = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" })
      .format(new Date(Date.UTC(year, month - 1, 15, 12)));
    const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const grid = cells.map(key => {
      if (!key) return '<div class="ficha-calendar-cell is-empty" aria-hidden="true"></div>';
      const classCount = classesForDate(key).length;
      const activityCount = activitiesForDate(key).length;
      const selected = key === selectedCalendarDate;
      return `<button type="button" class="ficha-calendar-cell${selected ? " is-selected" : ""}${key === toKey(now) ? " is-today" : ""}" data-ficha-date="${key}" aria-pressed="${selected}">
        <strong>${Number(key.slice(-2))}</strong><span>${classCount ? `${classCount} ${classCount === 1 ? "clase" : "clases"}` : "Sin clases"}</span>${activityCount ? `<small>${activityCount} ${activityCount === 1 ? "actividad" : "actividades"}</small>` : ""}
      </button>`;
    }).join("");
    views.calendario.innerHTML = `<div class="ficha-schedule-heading"><div><p class="eyebrow">CALENDARIO ACADÉMICO</p><h2 id="calendario-title">${escapeHtml(monthLabel)}</h2><p>Selecciona un día para consultar sus clases.</p></div><div class="ficha-schedule-actions"><button type="button" data-ficha-action="month-prev" aria-label="Mes anterior">←</button><button type="button" data-ficha-action="month-today">Este mes</button><button type="button" data-ficha-action="month-next" aria-label="Mes siguiente">→</button></div></div><div class="ficha-calendar-grid ficha-calendar-weekdays">${weekdays.map(day => `<span>${day}</span>`).join("")}</div><div class="ficha-calendar-grid">${grid}</div><div class="ficha-calendar-selected">${renderDay(selectedCalendarDate, now)}</div>`;
  }

  function render() {
    const now = localParts();
    renderToday(now);
    renderWeek(now);
    renderCalendar(now);
  }

  document.addEventListener("click", event => {
    const action = event.target.closest("[data-ficha-action]")?.dataset.fichaAction;
    const date = event.target.closest("[data-ficha-date]")?.dataset.fichaDate;
    if (date) {
      selectedCalendarDate = date;
      renderCalendar();
      return;
    }
    if (!action) return;
    if (action.startsWith("week-")) {
      if (action === "week-prev") { weekFollowsToday = false; weekAnchor = shiftDate(weekStart(weekAnchor), -7); }
      if (action === "week-next") { weekFollowsToday = false; weekAnchor = shiftDate(weekStart(weekAnchor), 7); }
      if (action === "week-today") { weekFollowsToday = true; weekAnchor = toKey(localParts()); }
      renderWeek();
    }
    if (action.startsWith("month-")) {
      const { year, month } = parseCivilDate(calendarAnchor);
      const delta = action === "month-prev" ? -1 : action === "month-next" ? 1 : 0;
      if (action === "month-today") {
        monthFollowsToday = true;
        selectedCalendarDate = toKey(localParts());
        calendarAnchor = monthStart(selectedCalendarDate);
      } else {
        monthFollowsToday = false;
        const date = new Date(Date.UTC(year, month - 1 + delta, 1));
        calendarAnchor = toKey({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: 1 });
        selectedCalendarDate = calendarAnchor;
      }
      renderCalendar();
    }
  });

  window.addEventListener("traza:ficha-change", render);
  render();
  window.addEventListener("focus", render);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });
  window.setInterval(render, 60_000);
}
