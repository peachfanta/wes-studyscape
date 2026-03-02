const STORAGE_KEY = "studyscape.v1";
const WEEKLY_GOAL_SECONDS = 15 * 60 * 60;
const CALENDAR_REFRESH_MS = 5 * 60 * 1000;

const WORLD_LAYERS = [
  { key: "field", name: "Empty Field", unlockWeek: 0 },
  { key: "grass", name: "Grass", unlockWeek: 5 },
  { key: "plants", name: "Plants", unlockWeek: 10 },
  { key: "trees", name: "Trees", unlockWeek: 15 },
  { key: "forest", name: "Forest", unlockWeek: 20 },
  { key: "village", name: "Village", unlockWeek: 23 },
  { key: "town", name: "Town", unlockWeek: 26 },
  { key: "city", name: "City", unlockWeek: 28 },
  { key: "metropolis", name: "Metropolis", unlockWeek: 30 }
];

const STORE_ITEMS = [
  { id: "theme-dark", type: "theme", name: "Dark Theme", price: 45, value: "theme-dark" },
  { id: "theme-nature", type: "theme", name: "Nature Theme", price: 45, value: "theme-nature" },
  { id: "theme-minimal", type: "theme", name: "Minimal Theme", price: 30, value: "theme-minimal" },
  { id: "scheme-coral", type: "scheme", name: "Coral UI Colors", price: 30, value: "scheme-coral" },
  { id: "scheme-ice", type: "scheme", name: "Ice UI Colors", price: 30, value: "scheme-ice" },
  { id: "scheme-mono", type: "scheme", name: "Mono UI Colors", price: 25, value: "scheme-mono" },
  { id: "extra-particles", type: "extra", name: "Particles Effect", price: 35, value: "extra-particles" },
  { id: "extra-glow", type: "extra", name: "Glow Panels", price: 45, value: "extra-glow" },
  { id: "extra-aura", type: "extra", name: "Aura Background", price: 40, value: "extra-aura" }
];

const DEFAULT_STATE = {
  weekStart: "",
  weeklySeconds: 0,
  timerRunning: false,
  timerStartedAt: null,
  timerAccumulatedAt: null,
  successfulWeeks: 0,
  totalWeeks: 0,
  weeklyHistory: [],
  sessions: [],
  tasks: [],
  balance: 0,
  calendarUrl: "",
  calendarEvents: [],
  calendarLastSyncAt: "",
  uploadedTracks: [],
  purchased: [],
  activeCosmetics: {
    theme: "",
    scheme: "",
    extras: []
  },
  spotifyEmbed: ""
};

const state = loadState();
let tickInterval = null;
let calendarRefreshInterval = null;
let audioTracks = [];
let currentTrackIndex = -1;

const els = {
  weeklyGoalCard: document.getElementById("weekly-goal-card"),
  balanceCard: document.getElementById("balance-card"),
  successCard: document.getElementById("success-card"),
  timerStatus: document.getElementById("timer-status"),
  timerDisplay: document.getElementById("timer-display"),
  weeklyHoursText: document.getElementById("weekly-hours-text"),
  weeklyProgressBar: document.getElementById("weekly-progress-bar"),
  weeklySuccessCount: document.getElementById("weekly-success-count"),
  worldStageLabel: document.getElementById("world-stage-label"),
  worldProgressBar: document.getElementById("world-progress-bar"),
  worldProgressText: document.getElementById("world-progress-text"),
  worldScene: document.getElementById("world-scene"),
  startTimerBtn: document.getElementById("start-timer-btn"),
  pauseTimerBtn: document.getElementById("pause-timer-btn"),
  taskForm: document.getElementById("task-form"),
  taskName: document.getElementById("task-name"),
  taskDuration: document.getElementById("task-duration"),
  taskBalance: document.getElementById("task-balance"),
  taskList: document.getElementById("task-list"),
  taskTemplate: document.getElementById("task-template"),
  storeGrid: document.getElementById("store-grid"),
  analyticsRatio: document.getElementById("analytics-ratio"),
  analyticsTotalSuccess: document.getElementById("analytics-total-success"),
  analyticsCurrentHours: document.getElementById("analytics-current-hours"),
  studyChart: document.getElementById("study-chart"),
  weeklySuccessHistory: document.getElementById("weekly-success-history"),
  sessionList: document.getElementById("session-list"),
  icsForm: document.getElementById("ics-form"),
  icsUrl: document.getElementById("ics-url"),
  icsStatus: document.getElementById("ics-status"),
  calendarMeta: document.getElementById("calendar-meta"),
  todayClasses: document.getElementById("today-classes"),
  weekGrid: document.getElementById("week-grid"),
  nextClassTitle: document.getElementById("next-class-title"),
  nextClassCountdown: document.getElementById("next-class-countdown"),
  audioUpload: document.getElementById("audio-upload"),
  audioPlayer: document.getElementById("audio-player"),
  trackLabel: document.getElementById("track-label"),
  prevTrackBtn: document.getElementById("prev-track-btn"),
  playPauseBtn: document.getElementById("play-pause-btn"),
  nextTrackBtn: document.getElementById("next-track-btn"),
  spotifyLink: document.getElementById("spotify-link"),
  spotifyStatus: document.getElementById("spotify-status"),
  saveSpotifyBtn: document.getElementById("save-spotify-btn"),
  spotifyEmbedWrap: document.getElementById("spotify-embed-wrap")
};

init();

function init() {
  ensureWeekState();
  hydrateAudioTracks();
  bindEvents();
  renderAll();
  startTicker();
  if (state.calendarUrl) {
    els.icsUrl.value = state.calendarUrl;
    syncCalendarFromUrl(state.calendarUrl, { silent: true });
  }
  startCalendarAutoRefresh();
}

function bindEvents() {
  els.startTimerBtn.addEventListener("click", startTimer);
  els.pauseTimerBtn.addEventListener("click", pauseTimer);
  els.taskForm.addEventListener("submit", onTaskSubmit);
  els.icsForm.addEventListener("submit", onIcsSubmit);
  els.audioUpload.addEventListener("change", onAudioUpload);
  els.prevTrackBtn.addEventListener("click", () => skipTrack(-1));
  els.nextTrackBtn.addEventListener("click", () => skipTrack(1));
  els.playPauseBtn.addEventListener("click", togglePlayPause);
  els.audioPlayer.addEventListener("ended", () => skipTrack(1));
  els.audioPlayer.addEventListener("play", () => { els.playPauseBtn.textContent = "Pause"; });
  els.audioPlayer.addEventListener("pause", () => { els.playPauseBtn.textContent = "Play"; });
  els.saveSpotifyBtn.addEventListener("click", saveSpotifyEmbed);
}

function renderAll() {
  renderHeader();
  renderTimer();
  renderWorld();
  renderTasks();
  renderStore();
  renderAnalytics();
  renderSessions();
  renderCalendar();
  renderSpotifyEmbed();
  applyCosmetics();
}

function startTicker() {
  if (tickInterval) {
    clearInterval(tickInterval);
  }
  tickInterval = setInterval(() => {
    ensureWeekState();
    renderTimer();
    renderCalendarNextClass();
    renderAnalytics();
  }, 1000);
}

function startCalendarAutoRefresh() {
  if (calendarRefreshInterval) {
    clearInterval(calendarRefreshInterval);
  }
  calendarRefreshInterval = setInterval(() => {
    if (!state.calendarUrl) {
      return;
    }
    syncCalendarFromUrl(state.calendarUrl, { silent: true });
  }, CALENDAR_REFRESH_MS);
}

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + mondayOffset);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function ensureWeekState() {
  let changed = false;
  const now = Date.now();
  const nowWeekStart = getWeekStart(new Date(now));
  if (!state.weekStart) {
    state.weekStart = nowWeekStart.toISOString();
    changed = true;
  }

  if (state.timerRunning) {
    changed = accrueRunningTimeThrough(now) || changed;
  }

  let savedWeekStart = new Date(state.weekStart);
  while (savedWeekStart.getTime() < nowWeekStart.getTime()) {
    finalizeTrackedWeek(savedWeekStart);
    state.weeklySeconds = 0;
    savedWeekStart = addDays(savedWeekStart, 7);
    state.weekStart = savedWeekStart.toISOString();
    changed = true;
  }

  if (changed) {
    saveState();
  }
}

function startTimer() {
  ensureWeekState();
  if (state.timerRunning) {
    return;
  }
  const nowIso = new Date().toISOString();
  state.timerRunning = true;
  state.timerStartedAt = nowIso;
  state.timerAccumulatedAt = nowIso;
  saveState();
  renderTimer();
}

function pauseTimer() {
  if (!state.timerRunning) {
    return;
  }
  const now = Date.now();
  const sessionStartedAt = state.timerStartedAt || new Date(now).toISOString();
  accrueRunningTimeThrough(now);
  const sessionStart = new Date(sessionStartedAt).getTime();
  const elapsed = Math.max(0, Math.floor((now - sessionStart) / 1000));
  state.timerRunning = false;
  state.timerStartedAt = null;
  state.timerAccumulatedAt = null;
  if (elapsed > 0) {
    state.sessions.unshift({
      startedAt: sessionStartedAt,
      endedAt: new Date().toISOString(),
      seconds: elapsed
    });
    if (state.sessions.length > 200) {
      state.sessions = state.sessions.slice(0, 200);
    }
  }
  saveState();
  renderAll();
}

function currentWeekSeconds() {
  if (!state.timerRunning) {
    return state.weeklySeconds;
  }
  const from = new Date(state.timerAccumulatedAt || state.timerStartedAt || Date.now()).getTime();
  const live = Math.max(0, (Date.now() - from) / 1000);
  return state.weeklySeconds + live;
}

function accrueRunningTimeThrough(nowMs) {
  if (!state.timerRunning) {
    return false;
  }
  const anchor = new Date(state.timerAccumulatedAt || state.timerStartedAt || nowMs).getTime();
  if (!Number.isFinite(anchor) || anchor >= nowMs) {
    state.timerAccumulatedAt = new Date(nowMs).toISOString();
    return false;
  }

  let cursor = anchor;
  let changed = false;
  while (cursor < nowMs) {
    const segmentWeekStart = getWeekStart(new Date(cursor));
    const segmentWeekEnd = addDays(segmentWeekStart, 7).getTime();
    const segmentEnd = Math.min(nowMs, segmentWeekEnd);
    const deltaSeconds = Math.max(0, (segmentEnd - cursor) / 1000);
    state.weeklySeconds += deltaSeconds;
    changed = true;
    cursor = segmentEnd;

    if (cursor === segmentWeekEnd) {
      const trackedWeekStart = new Date(state.weekStart || segmentWeekStart);
      finalizeTrackedWeek(trackedWeekStart);
      state.weeklySeconds = 0;
      state.weekStart = addDays(trackedWeekStart, 7).toISOString();
    }
  }
  state.timerAccumulatedAt = new Date(nowMs).toISOString();
  return changed;
}

function finalizeTrackedWeek(weekStartDate) {
  const success = state.weeklySeconds >= WEEKLY_GOAL_SECONDS;
  state.totalWeeks += 1;
  if (success) {
    state.successfulWeeks += 1;
  }
  state.weeklyHistory.push({
    weekStart: weekStartDate.toISOString(),
    seconds: Math.round(state.weeklySeconds),
    success
  });
  if (state.weeklyHistory.length > 52) {
    state.weeklyHistory = state.weeklyHistory.slice(-52);
  }
}

function renderHeader() {
  els.weeklyGoalCard.textContent = "15.0h";
  els.balanceCard.textContent = `$${Math.round(state.balance)}`;
  els.successCard.textContent = String(state.successfulWeeks);
}

function renderTimer() {
  const seconds = currentWeekSeconds();
  const hours = seconds / 3600;
  els.timerDisplay.textContent = formatDuration(seconds);
  els.weeklyHoursText.textContent = `${hours.toFixed(1)}h`;
  els.weeklyProgressBar.style.width = `${Math.min((seconds / WEEKLY_GOAL_SECONDS) * 100, 100)}%`;
  els.weeklySuccessCount.textContent = String(state.successfulWeeks);
  els.timerStatus.textContent = state.timerRunning ? "Running" : "Paused";
  els.startTimerBtn.disabled = state.timerRunning;
  els.pauseTimerBtn.disabled = !state.timerRunning;
}

function worldStageFromWeeks(successfulWeeks) {
  let active = WORLD_LAYERS[0];
  for (const stage of WORLD_LAYERS) {
    if (successfulWeeks >= stage.unlockWeek) {
      active = stage;
    }
  }
  return active;
}

function renderWorld() {
  const cappedWeeks = Math.min(Math.max(0, Math.floor(state.successfulWeeks)), 30);
  const stage = worldStageFromWeeks(cappedWeeks);
  els.worldStageLabel.textContent = `Stage ${cappedWeeks}: ${stage.name}`;
  const progress = cappedWeeks / 30;
  els.worldProgressBar.style.width = `${progress * 100}%`;
  els.worldProgressText.textContent = `${cappedWeeks} / 30 weeks`;

  WORLD_LAYERS.forEach((layer) => {
    const layerEl = els.worldScene.querySelector(`[data-layer="${layer.key}"]`);
    if (!layerEl) {
      return;
    }
    layerEl.classList.toggle("unlocked", cappedWeeks >= layer.unlockWeek);
  });
}

function onTaskSubmit(event) {
  event.preventDefault();
  const name = els.taskName.value.trim();
  const duration = Number(els.taskDuration.value);
  if (!name || !Number.isFinite(duration) || duration < 5) {
    return;
  }
  state.tasks.unshift({
    id: crypto.randomUUID(),
    name,
    durationMinutes: duration,
    done: false,
    rewarded: false
  });
  els.taskName.value = "";
  els.taskDuration.value = "";
  saveState();
  renderTasks();
}

function payoutForMinutes(minutes) {
  if (!minutes || minutes <= 0) {
    return 0;
  }
  const hours = minutes / 60;
  if (hours <= 0.5) {
    return (hours / 0.5) * 5;
  }
  if (hours <= 1) {
    return 5 + ((hours - 0.5) / 0.5) * 7;
  }
  if (hours <= 2) {
    return 12 + (hours - 1) * 18;
  }
  return 30 + (hours - 2) * 15;
}

function toggleTaskDone(taskId, done) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) {
    return;
  }
  task.done = done;
  if (done && !task.rewarded && task.durationMinutes) {
    const reward = payoutForMinutes(task.durationMinutes);
    state.balance += reward;
    task.rewarded = true;
  }
  saveState();
  renderAll();
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((t) => t.id !== taskId);
  saveState();
  renderTasks();
}

function renderTasks() {
  els.taskList.innerHTML = "";
  els.taskBalance.textContent = `$${Math.round(state.balance)}`;
  for (const task of state.tasks) {
    const node = els.taskTemplate.content.firstElementChild.cloneNode(true);
    const checkbox = node.querySelector("input");
    const title = node.querySelector(".task-title");
    const meta = node.querySelector(".task-meta");
    const deleteBtn = document.createElement("button");
    const durationText = `${task.durationMinutes}m`;
    const reward = `$${Math.round(payoutForMinutes(task.durationMinutes))}`;

    checkbox.checked = task.done;
    checkbox.addEventListener("change", (e) => toggleTaskDone(task.id, e.target.checked));
    title.textContent = task.name;
    meta.textContent = `${durationText} | Reward ${reward}${task.rewarded ? " (paid)" : ""}`;
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "text-btn";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));
    node.appendChild(deleteBtn);
    els.taskList.appendChild(node);
  }
}

function renderStore() {
  els.storeGrid.innerHTML = "";
  for (const item of STORE_ITEMS) {
    const card = document.createElement("article");
    const owned = state.purchased.includes(item.id);
    const active = isCosmeticActive(item);
    const btn = document.createElement("button");

    card.className = "store-item";
    card.innerHTML = `<h4>${item.name}</h4><p>$${item.price}</p><small>${item.type}</small>`;
    if (!owned) {
      btn.textContent = "Buy";
      btn.disabled = state.balance < item.price;
      btn.addEventListener("click", () => buyStoreItem(item.id));
    } else {
      btn.textContent = active ? "Active" : "Apply";
      btn.className = active ? "success" : "";
      btn.addEventListener("click", () => applyStoreItem(item.id));
    }
    card.appendChild(btn);
    els.storeGrid.appendChild(card);
  }
}

function buyStoreItem(itemId) {
  const item = STORE_ITEMS.find((s) => s.id === itemId);
  if (!item || state.purchased.includes(itemId) || state.balance < item.price) {
    return;
  }
  state.balance -= item.price;
  state.purchased.push(itemId);
  applyStoreItem(itemId);
  saveState();
  renderAll();
}

function isCosmeticActive(item) {
  if (item.type === "extra") {
    return state.activeCosmetics.extras.includes(item.value);
  }
  return state.activeCosmetics[item.type] === item.value;
}

function applyStoreItem(itemId) {
  const item = STORE_ITEMS.find((s) => s.id === itemId);
  if (!item || !state.purchased.includes(itemId)) {
    return;
  }
  if (item.type === "extra") {
    if (state.activeCosmetics.extras.includes(item.value)) {
      state.activeCosmetics.extras = state.activeCosmetics.extras.filter((e) => e !== item.value);
    } else {
      state.activeCosmetics.extras.push(item.value);
    }
  } else {
    state.activeCosmetics[item.type] = item.value;
  }
  saveState();
  renderAll();
}

function applyCosmetics() {
  const body = document.body;
  const removableClasses = [
    ...STORE_ITEMS.map((item) => item.value),
    "theme-sunrise", "theme-ocean", "scheme-neon", "scheme-earth", "extra-stars", "extra-aurora"
  ];
  body.classList.remove(...new Set(removableClasses));
  if (state.activeCosmetics.theme) {
    body.classList.add(state.activeCosmetics.theme);
  }
  if (state.activeCosmetics.scheme) {
    body.classList.add(state.activeCosmetics.scheme);
  }
  for (const extra of state.activeCosmetics.extras) {
    body.classList.add(extra);
  }
}

function renderAnalytics() {
  const currentSeconds = currentWeekSeconds();
  const displayedTotal = state.totalWeeks + 1;
  const displayedSuccess = state.successfulWeeks + (currentSeconds >= WEEKLY_GOAL_SECONDS ? 1 : 0);
  els.analyticsRatio.textContent = `${displayedSuccess} successful weeks out of ${displayedTotal} total weeks`;
  els.analyticsTotalSuccess.textContent = String(state.successfulWeeks);
  els.analyticsCurrentHours.textContent = `${(currentSeconds / 3600).toFixed(1)}h`;

  const points = [...state.weeklyHistory.slice(-7), {
    weekStart: state.weekStart,
    seconds: currentSeconds,
    success: currentSeconds >= WEEKLY_GOAL_SECONDS
  }];

  const ctx = els.studyChart.getContext("2d");
  const w = els.studyChart.width;
  const h = els.studyChart.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f8fbff";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#d4dbe8";
  ctx.beginPath();
  ctx.moveTo(42, 10);
  ctx.lineTo(42, h - 30);
  ctx.lineTo(w - 14, h - 30);
  ctx.stroke();

  const maxHours = Math.max(16, ...points.map((p) => p.seconds / 3600));
  const barSpace = (w - 70) / points.length;
  points.forEach((point, idx) => {
    const hours = point.seconds / 3600;
    const barHeight = ((h - 60) * hours) / maxHours;
    const x = 50 + idx * barSpace;
    const y = h - 30 - barHeight;
    ctx.fillStyle = point.success ? "#23a559" : "#4f7df0";
    ctx.fillRect(x, y, barSpace * 0.55, barHeight);
    ctx.fillStyle = "#56627a";
    ctx.font = "12px Manrope";
    ctx.fillText(hours.toFixed(1), x, y - 6);
  });

  renderWeeklySuccessHistory(currentSeconds);
}

function renderWeeklySuccessHistory(currentSeconds) {
  const items = [...state.weeklyHistory, {
    weekStart: state.weekStart || getWeekStart().toISOString(),
    seconds: currentSeconds,
    success: currentSeconds >= WEEKLY_GOAL_SECONDS,
    inProgress: true
  }].slice(-10).reverse();

  els.weeklySuccessHistory.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "No weekly history yet.";
    els.weeklySuccessHistory.appendChild(li);
    return;
  }

  for (const entry of items) {
    const weekStart = new Date(entry.weekStart);
    const weekEnd = addDays(weekStart, 6);
    const li = document.createElement("li");
    const status = entry.success ? "Success" : "Missed";
    const badge = entry.success ? "history-badge success" : "history-badge missed";
    const suffix = entry.inProgress ? " (current)" : "";
    li.className = "history-row";
    li.innerHTML = `
      <div>
        <strong>${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}${suffix}</strong>
        <small>${(entry.seconds / 3600).toFixed(1)}h studied</small>
      </div>
      <span class="${badge}">${status}</span>
    `;
    els.weeklySuccessHistory.appendChild(li);
  }
}

function renderSessions() {
  els.sessionList.innerHTML = "";
  if (!state.sessions.length) {
    const li = document.createElement("li");
    li.textContent = "No study sessions yet.";
    li.className = "muted";
    els.sessionList.appendChild(li);
    return;
  }
  for (const session of state.sessions.slice(0, 20)) {
    const li = document.createElement("li");
    const started = new Date(session.startedAt || session.endedAt);
    const dateText = started.toLocaleDateString();
    const startTimeText = started.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    li.textContent = `${dateText} | Start: ${startTimeText} | Duration: ${formatDuration(session.seconds)}`;
    els.sessionList.appendChild(li);
  }
}

async function onIcsSubmit(event) {
  event.preventDefault();
  const url = els.icsUrl.value.trim();
  if (!url) {
    return;
  }
  await syncCalendarFromUrl(url, { silent: false });
}

async function syncCalendarFromUrl(url, { silent }) {
  if (!silent) {
    els.icsStatus.textContent = "Syncing calendar...";
  }
  try {
    const text = await fetchIcsText(url);
    const events = parseIcsEvents(text);
    state.calendarUrl = url;
    state.calendarEvents = events;
    state.calendarLastSyncAt = new Date().toISOString();
    saveState();
    renderCalendar();
    renderCalendarMeta();
    if (!silent) {
      els.icsStatus.textContent = `Synced ${events.length} classes.`;
    }
  } catch (error) {
    if (!silent) {
      els.icsStatus.textContent = `Sync failed: ${error.message}`;
    } else if (state.calendarEvents.length) {
      renderCalendarMeta("Using last synced data.");
    }
  }
}

async function fetchIcsText(url) {
  try {
    const direct = await fetch(url);
    if (!direct.ok) {
      throw new Error(`HTTP ${direct.status}`);
    }
    return await direct.text();
  } catch (_) {
    const proxied = await fetch(`https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`);
    if (!proxied.ok) {
      throw new Error(`Unable to fetch ICS URL (CORS/network).`);
    }
    return await proxied.text();
  }
}

function parseIcsEvents(content) {
  const unfolded = content.replace(/\r?\n[ \t]/g, "");
  const blocks = unfolded.split("BEGIN:VEVENT").slice(1);
  const weekStart = getWeekStart();
  const horizonEnd = addDays(weekStart, 14);
  const events = [];

  for (const rawBlock of blocks) {
    const block = rawBlock.split("END:VEVENT")[0];
    const lines = block.split(/\r?\n/);
    const map = {};
    for (const line of lines) {
      const prop = parseIcsPropertyLine(line);
      if (!prop) {
        continue;
      }
      if (!map[prop.name]) {
        map[prop.name] = [];
      }
      map[prop.name].push(prop);
    }

    const title = map.SUMMARY?.[0]?.value || "Class";
    const startProp = map.DTSTART?.[0];
    const endProp = map.DTEND?.[0];
    const rruleRaw = map.RRULE?.[0]?.value || "";
    if (!startProp || !endProp) {
      continue;
    }
    const baseStart = parseIcsDateValue(startProp.value);
    const baseEnd = parseIcsDateValue(endProp.value);
    if (!baseStart || !baseEnd) {
      continue;
    }
    const durationMs = Math.max(0, baseEnd.getTime() - baseStart.getTime());
    const excluded = (map.EXDATE || [])
      .flatMap((p) => p.value.split(","))
      .map((v) => parseIcsDateValue(v))
      .filter(Boolean)
      .map((d) => d.getTime());

    const occurrences = expandOccurrences({
      baseStart,
      durationMs,
      rruleRaw,
      windowStart: weekStart,
      windowEnd: horizonEnd
    });

    for (const start of occurrences) {
      if (excluded.includes(start.getTime())) {
        continue;
      }
      const end = new Date(start.getTime() + durationMs);
      events.push({ title, start: start.toISOString(), end: end.toISOString() });
    }
  }

  return events.sort((a, b) => new Date(a.start) - new Date(b.start));
}

function parseIcsPropertyLine(line) {
  const idx = line.indexOf(":");
  if (idx < 0) {
    return null;
  }
  const left = line.slice(0, idx);
  const value = line.slice(idx + 1).trim();
  const [name, ...paramsList] = left.split(";");
  const params = {};
  for (const rawParam of paramsList) {
    const [k, v] = rawParam.split("=");
    if (k && v) {
      params[k.toUpperCase()] = v;
    }
  }
  return {
    name: name.toUpperCase(),
    params,
    value
  };
}

function parseIcsDateValue(value) {
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, y, mo, d] = dateOnly;
    return new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0, 0);
  }

  const withTime = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(value);
  if (!withTime) {
    return null;
  }
  const [, y, mo, d, h, mi, s = "00", z] = withTime;
  if (z) {
    return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)));
  }
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
}

function parseRRule(rruleRaw) {
  const out = {};
  if (!rruleRaw) {
    return out;
  }
  for (const pair of rruleRaw.split(";")) {
    const [k, v] = pair.split("=");
    if (k && v) {
      out[k.toUpperCase()] = v;
    }
  }
  return out;
}

function expandOccurrences({ baseStart, durationMs, rruleRaw, windowStart, windowEnd }) {
  const rule = parseRRule(rruleRaw);
  const freq = rule.FREQ || "";
  const interval = Math.max(1, Number(rule.INTERVAL) || 1);
  const until = rule.UNTIL ? parseIcsDateValue(rule.UNTIL) : null;
  const byDay = (rule.BYDAY || "")
    .split(",")
    .map((token) => token.match(/[A-Z]{2}$/)?.[0] || "")
    .filter(Boolean);
  const dayMap = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  const results = [];

  if (!freq) {
    if (baseStart >= windowStart && baseStart < windowEnd) {
      results.push(baseStart);
    }
    return results;
  }

  if (freq === "DAILY") {
    const cursor = new Date(baseStart);
    while (cursor < windowEnd) {
      if (cursor >= windowStart && (!until || cursor <= until)) {
        results.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + interval);
      if (until && cursor > until) {
        break;
      }
    }
    return results;
  }

  if (freq === "WEEKLY") {
    const weekdays = byDay.length ? byDay : [dayCodeFromDate(baseStart)];
    const firstWeekStart = getWeekStart(baseStart);
    const weekCursor = new Date(firstWeekStart);
    while (weekCursor < windowEnd) {
      for (const dayCode of weekdays) {
        const dayIndex = dayMap[dayCode];
        if (dayIndex === undefined) {
          continue;
        }
        const occurrence = addDays(weekCursor, dayIndex === 0 ? 6 : dayIndex - 1);
        occurrence.setHours(baseStart.getHours(), baseStart.getMinutes(), baseStart.getSeconds(), 0);
        if (occurrence < baseStart || occurrence < windowStart || occurrence >= windowEnd) {
          continue;
        }
        if (until && occurrence > until) {
          continue;
        }
        results.push(occurrence);
      }
      weekCursor.setDate(weekCursor.getDate() + 7 * interval);
      if (until && weekCursor > until) {
        break;
      }
    }
    return results;
  }

  if (baseStart >= windowStart && baseStart < windowEnd) {
    results.push(baseStart);
  }
  return results;
}

function dayCodeFromDate(date) {
  const lookup = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  return lookup[date.getDay()];
}

function renderCalendar() {
  renderCalendarMeta();
  renderTodayClasses();
  renderWeekGrid();
  renderCalendarNextClass();
}

function renderCalendarMeta(hint = "") {
  if (!state.calendarUrl) {
    els.calendarMeta.textContent = "Paste an ICS URL to sync classes.";
    return;
  }
  const syncText = state.calendarLastSyncAt
    ? `Last synced ${new Date(state.calendarLastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Not synced yet";
  const refreshText = `Auto-refresh every ${Math.round(CALENDAR_REFRESH_MS / 60000)} minutes`;
  els.calendarMeta.textContent = hint ? `${syncText} • ${refreshText} • ${hint}` : `${syncText} • ${refreshText}`;
}

function renderTodayClasses() {
  const today = new Date();
  els.todayClasses.innerHTML = "";
  const todayEvents = state.calendarEvents.filter((e) => isSameDay(new Date(e.start), today));
  if (!todayEvents.length) {
    const li = document.createElement("li");
    li.className = "calendar-empty";
    li.textContent = "No classes today.";
    els.todayClasses.appendChild(li);
    return;
  }
  for (const event of todayEvents) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const li = document.createElement("li");
    li.className = "calendar-item";
    li.innerHTML = `
      <div class="calendar-item-main">${event.title}</div>
      <small>${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
    `;
    els.todayClasses.appendChild(li);
  }
}

function renderWeekGrid() {
  const weekStart = getWeekStart();
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  els.weekGrid.innerHTML = "";

  for (let i = 0; i < 7; i += 1) {
    const dayDate = addDays(weekStart, i);
    const dayBox = document.createElement("div");
    dayBox.className = "day-col";
    const heading = document.createElement("h4");
    heading.innerHTML = `<span>${labels[i]}</span> <small>${dayDate.toLocaleDateString([], { month: "short", day: "numeric" })}</small>`;
    dayBox.appendChild(heading);

    const events = state.calendarEvents.filter((e) => isSameDay(new Date(e.start), dayDate));
    if (!events.length) {
      const p = document.createElement("p");
      p.className = "calendar-empty";
      p.textContent = "No classes";
      dayBox.appendChild(p);
    } else {
      for (const event of events) {
        const div = document.createElement("div");
        const start = new Date(event.start);
        div.className = "event-pill";
        div.innerHTML = `
          <strong>${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
          <span>${event.title}</span>
        `;
        dayBox.appendChild(div);
      }
    }
    els.weekGrid.appendChild(dayBox);
  }
}

function renderCalendarNextClass() {
  const now = new Date();
  const next = state.calendarEvents.find((e) => new Date(e.start) > now);
  if (!next) {
    els.nextClassTitle.textContent = "None";
    els.nextClassCountdown.textContent = "-";
    return;
  }
  const start = new Date(next.start);
  const delta = Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000));
  els.nextClassTitle.textContent = `${next.title} (${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;
  els.nextClassCountdown.textContent = `Starts in ${formatCountdown(delta)}`;
}

function saveSpotifyEmbed() {
  const input = els.spotifyLink.value.trim();
  if (!input) {
    els.spotifyStatus.textContent = "Paste a Spotify embed/share link.";
    return;
  }
  const embed = toSpotifyEmbedUrl(input);
  if (!embed) {
    els.spotifyStatus.textContent = "Unsupported Spotify link.";
    return;
  }
  state.spotifyEmbed = embed;
  els.spotifyStatus.textContent = "Spotify embed saved.";
  saveState();
  renderSpotifyEmbed();
}

function renderSpotifyEmbed() {
  els.spotifyEmbedWrap.innerHTML = "";
  if (!state.spotifyEmbed) {
    return;
  }
  const iframe = document.createElement("iframe");
  iframe.src = state.spotifyEmbed;
  iframe.width = "100%";
  iframe.height = "152";
  iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  iframe.loading = "lazy";
  els.spotifyEmbedWrap.appendChild(iframe);
}

function toSpotifyEmbedUrl(url) {
  const typeAllowList = new Set(["playlist", "album", "track", "show", "episode", "artist"]);
  const fromUri = /^spotify:(playlist|album|track|show|episode|artist):([A-Za-z0-9]+)$/.exec(url);
  if (fromUri) {
    return `https://open.spotify.com/embed/${fromUri[1]}/${fromUri[2]}`;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("spotify.com")) {
      return null;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed" && typeAllowList.has(parts[1]) && parts[2]) {
      return `https://open.spotify.com/embed/${parts[1]}/${parts[2]}`;
    }
    if (typeAllowList.has(parts[0]) && parts[1]) {
      return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`;
    }
    return null;
  } catch (_) {
    return null;
  }
}

async function onAudioUpload(event) {
  const files = [...event.target.files];
  if (!files.length) {
    return;
  }
  const encoded = await Promise.all(files.map(fileToDataTrack));
  state.uploadedTracks = state.uploadedTracks.concat(encoded);
  audioTracks = state.uploadedTracks.map((t) => ({ ...t, url: t.dataUrl }));
  saveState();
  if (currentTrackIndex === -1) {
    currentTrackIndex = 0;
    loadTrack(currentTrackIndex);
  }
}

function loadTrack(index) {
  const track = audioTracks[index];
  if (!track) {
    return;
  }
  els.audioPlayer.src = track.url;
  els.trackLabel.textContent = `Track: ${track.name}`;
}

function skipTrack(direction) {
  if (!audioTracks.length) {
    return;
  }
  currentTrackIndex = (currentTrackIndex + direction + audioTracks.length) % audioTracks.length;
  loadTrack(currentTrackIndex);
  els.audioPlayer.play();
}

function togglePlayPause() {
  if (!audioTracks.length && !els.audioPlayer.src) {
    return;
  }
  if (els.audioPlayer.paused) {
    els.audioPlayer.play();
  } else {
    els.audioPlayer.pause();
  }
}

function hydrateAudioTracks() {
  audioTracks = (state.uploadedTracks || []).map((t) => ({ ...t, url: t.dataUrl }));
  if (audioTracks.length) {
    currentTrackIndex = 0;
    loadTrack(0);
  }
}

function fileToDataTrack(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      dataUrl: String(reader.result || "")
    });
    reader.onerror = () => reject(new Error("Failed to read audio file."));
    reader.readAsDataURL(file);
  });
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatCountdown(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(DEFAULT_STATE);
    }
    return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
  } catch (_) {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
