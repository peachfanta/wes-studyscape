const STORAGE_KEY = "studyscape.v1";
const PLAYBACK_STATE_KEY = "studyscape.playback.v1";
const AUDIO_DB_NAME = "studyscape-audio";
const AUDIO_DB_VERSION = 1;
const AUDIO_STORE = "libraries";
const AUDIO_LIBRARY_KEY = "default";
const MUSIC_CHANNEL = "studyscape-music";
const MUSIC_HUB_HEARTBEAT_KEY = "studyscape.music.hub.heartbeat";
const WEEKLY_GOAL_SECONDS = 15 * 60 * 60;
const CALENDAR_REFRESH_MS = 5 * 60 * 1000;

const WORLD_STAGE_BANDS = [
  { min: 1, max: 3, name: "Empty Field" },
  { min: 4, max: 6, name: "Plants" },
  { min: 7, max: 10, name: "Trees" },
  { min: 11, max: 14, name: "Dense Trees" },
  { min: 15, max: 18, name: "Small Houses" },
  { min: 19, max: 22, name: "Expanded Village" },
  { min: 23, max: 25, name: "Small Town" },
  { min: 26, max: 28, name: "City" },
  { min: 29, max: 30, name: "Metropolis" }
];

const STORE_ITEMS = [
  { id: "theme-cyberpunk", type: "theme", name: "Cyberpunk Theme", price: 55, value: "theme-cyberpunk" },
  { id: "theme-volcanic", type: "theme", name: "Volcanic Theme", price: 52, value: "theme-volcanic" },
  { id: "theme-electric", type: "theme", name: "Electric Theme", price: 56, value: "theme-electric" },
  { id: "theme-jungle-pop", type: "theme", name: "Jungle Pop Theme", price: 50, value: "theme-jungle-pop" },
  { id: "theme-midnight", type: "theme", name: "Midnight Neon Theme", price: 54, value: "theme-midnight" },
  { id: "scheme-coral", type: "scheme", name: "Coral UI Colors", price: 30, value: "scheme-coral" },
  { id: "scheme-ice", type: "scheme", name: "Ice UI Colors", price: 30, value: "scheme-ice" },
  { id: "scheme-mono", type: "scheme", name: "Mono UI Colors", price: 25, value: "scheme-mono" },
  { id: "scheme-mint", type: "scheme", name: "Mint UI Colors", price: 28, value: "scheme-mint" },
  { id: "scheme-ember", type: "scheme", name: "Ember UI Colors", price: 28, value: "scheme-ember" },
  { id: "scheme-neon-lime", type: "scheme", name: "Neon Lime UI", price: 36, value: "scheme-neon-lime" },
  { id: "scheme-hot-pink", type: "scheme", name: "Hot Pink UI", price: 36, value: "scheme-hot-pink" },
  { id: "scheme-laser-blue", type: "scheme", name: "Laser Blue UI", price: 36, value: "scheme-laser-blue" },
  { id: "extra-particles", type: "extra", name: "Particles Effect", price: 35, value: "extra-particles" },
  { id: "extra-glow", type: "extra", name: "Glow Panels", price: 45, value: "extra-glow" },
  { id: "extra-aura", type: "extra", name: "Aura Background", price: 40, value: "extra-aura" },
  { id: "extra-grid", type: "extra", name: "Grid Backdrop", price: 32, value: "extra-grid" },
  { id: "extra-rainbow", type: "extra", name: "Rainbow Mist", price: 44, value: "extra-rainbow" },
  { id: "extra-cursor-glow", type: "extra", name: "Cursor Glow", price: 40, value: "extra-cursor-glow" },
  { id: "extra-neon-scan", type: "extra", name: "Neon Scanlines", price: 38, value: "extra-neon-scan" },
  { id: "extra-comet", type: "extra", name: "Comet Streaks", price: 46, value: "extra-comet" }
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
  customEvents: [],
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
let monthlyCursor = new Date();
let monthlySelectedDate = null;
let worldPreviewWeeks = null;
let previewCosmetics = null;
let worldShapesInitialized = false;
let pendingPlaybackResume = false;
let musicChannel = null;

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
  worldPreviewSlider: document.getElementById("world-preview-slider"),
  worldPreviewReset: document.getElementById("world-preview-reset"),
  worldPreviewText: document.getElementById("world-preview-text"),
  startTimerBtn: document.getElementById("start-timer-btn"),
  pauseTimerBtn: document.getElementById("pause-timer-btn"),
  taskForm: document.getElementById("task-form"),
  taskName: document.getElementById("task-name"),
  taskDuration: document.getElementById("task-duration"),
  taskBalance: document.getElementById("task-balance"),
  taskList: document.getElementById("task-list"),
  taskTemplate: document.getElementById("task-template"),
  storeGrid: document.getElementById("store-grid"),
  clearStorePreview: document.getElementById("clear-store-preview"),
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
  calendarEventForm: document.getElementById("calendar-event-form"),
  customTitle: document.getElementById("custom-title"),
  customStart: document.getElementById("custom-start"),
  customEnd: document.getElementById("custom-end"),
  customSac: document.getElementById("custom-sac"),
  monthLabel: document.getElementById("month-label"),
  monthGrid: document.getElementById("month-grid"),
  monthDayLabel: document.getElementById("month-day-label"),
  monthDayEvents: document.getElementById("month-day-events"),
  monthPrev: document.getElementById("month-prev"),
  monthNext: document.getElementById("month-next"),
  customEventList: document.getElementById("custom-event-list"),
  nextClassTitle: document.getElementById("next-class-title"),
  nextClassCountdown: document.getElementById("next-class-countdown"),
  audioUpload: document.getElementById("audio-upload"),
  audioPlayer: document.getElementById("audio-player"),
  trackLabel: document.getElementById("track-label"),
  trackSelect: document.getElementById("track-select"),
  playPauseBtn: document.getElementById("play-pause-btn"),
  spotifyLink: document.getElementById("spotify-link"),
  spotifyStatus: document.getElementById("spotify-status"),
  saveSpotifyBtn: document.getElementById("save-spotify-btn"),
  spotifyEmbedWrap: document.getElementById("spotify-embed-wrap"),
  openPersistentPlayer: document.getElementById("open-persistent-player")
};

init();

function init() {
  ensureWeekState();
  monthlyCursor = new Date();
  monthlyCursor.setDate(1);
  monthlyCursor.setHours(0, 0, 0, 0);
  monthlySelectedDate = new Date();
  monthlySelectedDate.setHours(0, 0, 0, 0);
  if (Array.isArray(state.uploadedTracks) && state.uploadedTracks.length) {
    // Legacy localStorage payload is large and unstable; clear after migration attempt.
    state.uploadedTracks = [];
    try { saveState(); } catch (_) {}
  }
  bindEvents();
  initMusicChannel();
  renderAll();
  hydrateAudioTracks();
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
  els.calendarEventForm.addEventListener("submit", onCustomEventSubmit);
  els.monthPrev.addEventListener("click", () => shiftMonth(-1));
  els.monthNext.addEventListener("click", () => shiftMonth(1));
  els.audioUpload.addEventListener("change", onAudioUpload);
  els.trackSelect.addEventListener("change", onTrackSelected);
  els.playPauseBtn.addEventListener("click", togglePlayPause);
  els.openPersistentPlayer.addEventListener("click", openPersistentPlayer);
  els.audioPlayer.addEventListener("ended", () => { els.playPauseBtn.textContent = "Play"; });
  els.audioPlayer.addEventListener("play", () => { els.playPauseBtn.textContent = "Pause"; });
  els.audioPlayer.addEventListener("pause", () => { els.playPauseBtn.textContent = "Play"; });
  els.audioPlayer.addEventListener("timeupdate", persistPlaybackState);
  els.audioPlayer.addEventListener("play", persistPlaybackState);
  els.audioPlayer.addEventListener("pause", persistPlaybackState);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      persistPlaybackState();
    }
  });
  window.addEventListener("pagehide", persistPlaybackState);
  els.saveSpotifyBtn.addEventListener("click", saveSpotifyEmbed);
  els.worldPreviewSlider.addEventListener("input", onWorldPreviewInput);
  els.worldPreviewReset.addEventListener("click", resetWorldPreview);
  els.clearStorePreview.addEventListener("click", clearStorePreview);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("pointerdown", resumePendingPlayback);
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
  renderAudioLibrary();
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

function stageFromWeeks(successfulWeeks) {
  return Math.min(30, Math.max(1, Math.floor(successfulWeeks || 0)));
}

function stageNameForStage(stage) {
  const found = WORLD_STAGE_BANDS.find((band) => stage >= band.min && stage <= band.max);
  return found ? found.name : "World";
}

function makeShape(def) {
  const node = document.createElement("div");
  node.className = `shape shape-${def.type}`;
  node.dataset.unlock = String(def.unlock);
  node.style.left = `${def.x}px`;
  node.style.bottom = `${def.bottom}px`;
  node.style.width = `${def.w}px`;
  node.style.height = `${def.h}px`;
  node.style.background = def.color;
  node.style.zIndex = String(def.z ?? Math.max(1, Math.floor(def.bottom)));
  if (def.type === "circle") {
    node.style.borderRadius = "50%";
  }
  if (def.type === "triangle") {
    node.style.clipPath = "polygon(50% 0, 0 100%, 100% 100%)";
  }
  if (def.type === "polygon" && def.points) {
    node.style.clipPath = `polygon(${def.points})`;
  }
  return node;
}

function createSeededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function randRange(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}

function addHouse(shapes, unlock, x, baseY, w, h, bodyColor = "#9a6b52", roofColor = "#b14b3f") {
  shapes.push({ layer: "houses", unlock, type: "rectangle", x, bottom: baseY, w, h, color: bodyColor });
  shapes.push({
    layer: "houses",
    unlock,
    type: "triangle",
    x: x - 4,
    bottom: baseY + h - 2,
    w: w + 8,
    h: Math.max(20, Math.round(h * 0.4)),
    color: roofColor
  });
}

function addHouseDetailed(shapes, unlock, x, baseY, w, h, variant = 0) {
  const bodies = ["#a67b60", "#9c7058", "#b08569", "#8c9fb3", "#c19a76", "#8aa58a"];
  const roofs = ["#b14f43", "#9f453c", "#c15e4e", "#7a4c3a", "#5b6e85", "#c27f3c"];
  const windows = ["#d8edf7", "#d1e6f2", "#c9dfee"];
  const bodyColor = bodies[variant % bodies.length];
  const roofColor = roofs[variant % roofs.length];
  const windowColor = windows[variant % windows.length];
  addHouse(shapes, unlock, x, baseY, w, h, bodyColor, roofColor);

  const cols = Math.max(2, Math.min(4, Math.floor(w / 14)));
  const rows = Math.max(1, Math.min(3, Math.floor(h / 16)));
  const gapX = Math.floor((w - cols * 6) / (cols + 1));
  const gapY = Math.floor((h - rows * 6) / (rows + 1));
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      shapes.push({
        layer: "houses",
        unlock,
        type: variant % 2 === 0 ? "rectangle" : "circle",
        x: x + gapX + c * (6 + gapX),
        bottom: baseY + h - (r + 1) * (6 + gapY),
        w: 6,
        h: 6,
        color: windowColor
      });
    }
  }
  // Door detail
  shapes.push({
    layer: "houses",
    unlock,
    type: "rectangle",
    x: x + Math.floor(w * 0.4),
    bottom: baseY,
    w: Math.max(5, Math.floor(w * 0.2)),
    h: Math.max(10, Math.floor(h * 0.35)),
    color: "#6c4b34"
  });
}

function addBuildingDetailed(shapes, unlock, layer, x, baseY, w, h, variant = 0) {
  const bodyPalette = ["#7f6d60", "#746254", "#8b796a", "#6e5d51", "#6f7f95", "#7b6f90", "#8d7a62"];
  const body = bodyPalette[variant % bodyPalette.length];
  shapes.push({ layer, unlock, type: "rectangle", x, bottom: baseY, w, h, color: body });

  if (variant % 3 === 0) {
    shapes.push({
      layer,
      unlock,
      type: "triangle",
      x: x + Math.floor(w * 0.22),
      bottom: baseY + h - 2,
      w: Math.floor(w * 0.56),
      h: Math.max(12, Math.floor(h * 0.18)),
      color: "#6b5849"
    });
  }

  const cols = Math.max(2, Math.min(5, Math.floor(w / 12)));
  const rows = Math.max(3, Math.min(9, Math.floor(h / 18)));
  const winW = 4;
  const winH = 5;
  const gapX = Math.max(3, Math.floor((w - cols * winW) / (cols + 1)));
  const gapY = Math.max(4, Math.floor((h - rows * winH) / (rows + 1)));
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      shapes.push({
        layer,
        unlock,
        type: "rectangle",
        x: x + gapX + c * (winW + gapX),
        bottom: baseY + h - (r + 1) * (winH + gapY),
        w: winW,
        h: winH,
        color: (r + c + variant) % 5 === 0 ? "#f4de8e" : "#c2d7e6"
      });
    }
  }
}

function addTreeVariant(shapes, unlock, x, baseY, size, variant = 0) {
  const trunkW = Math.max(3, Math.floor(size * 0.18));
  const trunkH = Math.max(10, Math.floor(size * 0.42));
  const canopyW = Math.max(14, Math.floor(size * 0.9));
  const canopyH = Math.max(18, Math.floor(size * 1.2));
  const green = ["#3f8e4a", "#468f4f", "#3b7f45", "#4a9655"][variant % 4];

  shapes.push({
    layer: "trees",
    unlock,
    type: "rectangle",
    x: x + Math.floor((canopyW - trunkW) / 2),
    bottom: baseY,
    w: trunkW,
    h: trunkH,
    color: "#6f4f3a"
  });

  const canopyBottom = baseY + trunkH - 2;
  if (variant % 4 === 0) {
    shapes.push({ layer: "trees", unlock, type: "triangle", x, bottom: canopyBottom, w: canopyW, h: canopyH, color: green });
  } else if (variant % 4 === 1) {
    shapes.push({ layer: "trees", unlock, type: "circle", x: x + 2, bottom: canopyBottom + 2, w: canopyW - 4, h: canopyW - 4, color: green });
    shapes.push({ layer: "trees", unlock, type: "circle", x: x - 5, bottom: canopyBottom + 10, w: Math.floor(canopyW * 0.55), h: Math.floor(canopyW * 0.55), color: "#4f9d5a" });
  } else if (variant % 4 === 2) {
    shapes.push({ layer: "trees", unlock, type: "polygon", x, bottom: canopyBottom, w: canopyW, h: canopyH, color: green, points: "50% 0, 0 35%, 18% 62%, 0 100%, 100% 100%, 82% 62%, 100% 35%" });
  } else {
    shapes.push({ layer: "trees", unlock, type: "triangle", x: x + 5, bottom: canopyBottom, w: canopyW - 10, h: Math.floor(canopyH * 0.72), color: "#3f8a4a" });
    shapes.push({ layer: "trees", unlock, type: "triangle", x, bottom: canopyBottom + Math.floor(canopyH * 0.38), w: canopyW, h: Math.floor(canopyH * 0.72), color: green });
  }
}

function buildWorldShapePlan() {
  const shapes = [];
  const rand = createSeededRandom(20260302);

  // Base environment
  shapes.push({ layer: "mountains", unlock: 1, type: "polygon", x: 40, bottom: 105, w: 230, h: 125, color: "#8ea4bc", points: "0 100%, 30% 52%, 55% 62%, 78% 40%, 100% 100%" });
  shapes.push({ layer: "mountains", unlock: 1, type: "polygon", x: 250, bottom: 105, w: 260, h: 140, color: "#7f96ae", points: "0 100%, 22% 60%, 44% 36%, 68% 58%, 100% 100%" });
  shapes.push({ layer: "mountains", unlock: 1, type: "polygon", x: 520, bottom: 105, w: 240, h: 120, color: "#8ca2ba", points: "0 100%, 24% 58%, 48% 48%, 72% 63%, 100% 100%" });

  // 23+: roads and asphalt markings for urban phases
  shapes.push({ layer: "roads", unlock: 23, type: "polygon", x: 0, bottom: 0, w: 800, h: 170, color: "#4f545b", points: "0 100%, 0 55%, 28% 48%, 58% 52%, 100% 46%, 100% 100%" });
  shapes.push({ layer: "roads", unlock: 24, type: "polygon", x: 0, bottom: 0, w: 800, h: 150, color: "#464b52", points: "0 100%, 0 64%, 34% 58%, 68% 62%, 100% 56%, 100% 100%" });
  for (let i = 0; i < 11; i += 1) {
    shapes.push({
      layer: "roads",
      unlock: 25,
      type: "rectangle",
      x: 40 + i * 70,
      bottom: 52 + (i % 2 ? 6 : 0),
      w: 34,
      h: 6,
      color: "#f2e6b6"
    });
  }
  for (let i = 0; i < 9; i += 1) {
    shapes.push({
      layer: "roads",
      unlock: 27,
      type: "rectangle",
      x: 70 + i * 80,
      bottom: 28 + (i % 2 ? 4 : 0),
      w: 42,
      h: 5,
      color: "#e9edf2"
    });
  }

  // 4-6: many small plants scattered across the grass
  const plantCount = 52;
  for (let idx = 0; idx < plantCount; idx += 1) {
    const x = randRange(rand, 6, 786);
    const bottom = randRange(rand, 28, 84);
    shapes.push({
      layer: "plants",
      unlock: 4 + Math.floor(idx / 6),
      type: idx % 3 === 0 ? "circle" : "rectangle",
      x,
      bottom,
      w: idx % 3 === 0 ? 8 : 7,
      h: idx % 3 === 0 ? 8 : 10,
      color: ["#4da45a", "#58b067", "#479a55"][idx % 3]
    });
  }

  // Extra ground details: bushes, mushrooms, rocks
  for (let i = 0; i < 16; i += 1) {
    const x = randRange(rand, 6, 786);
    const bottom = randRange(rand, 24, 82);
    shapes.push({
      layer: "plants",
      unlock: 5 + Math.floor(i / 6),
      type: "circle",
      x,
      bottom,
      w: randRange(rand, 10, 18),
      h: randRange(rand, 10, 18),
      color: ["#3f8f4d", "#4a9d57", "#56a962"][i % 3]
    });
  }
  for (let i = 0; i < 12; i += 1) {
    const x = randRange(rand, 6, 786);
    const bottom = randRange(rand, 24, 80);
    const capW = randRange(rand, 8, 12);
    const capH = randRange(rand, 5, 8);
    shapes.push({
      layer: "plants",
      unlock: 6 + Math.floor(i / 6),
      type: "rectangle",
      x: x + Math.floor(capW * 0.35),
      bottom,
      w: Math.max(2, Math.floor(capW * 0.3)),
      h: randRange(rand, 4, 7),
      color: "#f2dfc7"
    });
    shapes.push({
      layer: "plants",
      unlock: 6 + Math.floor(i / 6),
      type: "circle",
      x,
      bottom: bottom + randRange(rand, 3, 5),
      w: capW,
      h: capH,
      color: ["#c84e42", "#b74339", "#d45d49"][i % 3]
    });
  }
  for (let i = 0; i < 12; i += 1) {
    shapes.push({
      layer: "plants",
      unlock: 6 + Math.floor(i / 6),
      type: "polygon",
      x: randRange(rand, 6, 786),
      bottom: randRange(rand, 24, 80),
      w: randRange(rand, 10, 18),
      h: randRange(rand, 7, 12),
      color: ["#88939e", "#79848e", "#939da8"][i % 3],
      points: "12% 100%, 0 56%, 18% 16%, 52% 0, 84% 18%, 100% 62%, 86% 100%"
    });
  }

  // 7-14: more trees with varied archetypes and depth
  for (let idx = 0; idx < 42; idx += 1) {
    const unlock = 7 + Math.floor(idx / 6);
    const x = randRange(rand, 8, 774);
    const bottom = randRange(rand, 36, 90);
    const size = randRange(rand, 28, 56);
    addTreeVariant(shapes, unlock, x, bottom, size, idx);
  }

  // 15-22: smaller houses with detail, more count and variants
  const houseCount = 34;
  for (let idx = 0; idx < houseCount; idx += 1) {
    const unlock = 15 + Math.floor(idx / 5);
    const x = randRange(rand, 8, 774);
    const w = randRange(rand, 20, 34);
    const h = randRange(rand, 18, 30);
    const bottom = randRange(rand, 34, 86);
    addHouseDetailed(shapes, unlock, x, bottom, w, h, idx);
  }

  // 23-25: town - more medium buildings, detailed windows
  for (let idx = 0; idx < 22; idx += 1) {
    const unlock = 23 + Math.floor(idx / 8);
    const x = randRange(rand, 6, 776);
    const w = randRange(rand, 22, 38);
    const h = randRange(rand, 44, 84);
    const bottom = randRange(rand, 40, 92);
    addBuildingDetailed(shapes, unlock, "town", x, bottom, w, h, idx);
  }

  // 26-28: city - denser skyline, parks
  for (let idx = 0; idx < 18; idx += 1) {
    const unlock = 26 + Math.floor(idx / 6);
    const x = randRange(rand, 6, 776);
    const w = randRange(rand, 24, 40);
    const h = randRange(rand, 72, 132);
    const bottom = randRange(rand, 42, 94);
    addBuildingDetailed(shapes, unlock, "city", x, bottom, w, h, idx + 3);
  }
  for (let p = 0; p < 6; p += 1) {
    shapes.push({
      layer: "plants",
      unlock: 28,
      type: "rectangle",
      x: randRange(rand, 6, 776),
      bottom: randRange(rand, 24, 82),
      w: randRange(rand, 18, 34),
      h: randRange(rand, 8, 14),
      color: p % 2 ? "#4ea15a" : "#4a9b56"
    });
  }

  // 29-30: metropolis - many small-tall detailed towers + spires
  for (let idx = 0; idx < 40; idx += 1) {
    const unlock = idx < 20 ? 29 : 30;
    const x = randRange(rand, 6, 778);
    const w = randRange(rand, 18, 34);
    const h = randRange(rand, 110, 210);
    const bottom = randRange(rand, 46, 98);
    addBuildingDetailed(shapes, unlock, "skyline", x, bottom, w, h, idx + 8);
    if (idx % 6 === 0) {
      shapes.push({
        layer: "skyline",
        unlock,
        type: "triangle",
        x: x + Math.floor(w * 0.28),
        bottom: bottom + h - 1,
        w: Math.max(8, Math.floor(w * 0.44)),
        h: randRange(rand, 14, 26),
        color: "#6b594d"
      });
    }
  }

  return shapes;
}

function initWorldShapes() {
  if (worldShapesInitialized || !els.worldScene) {
    return;
  }
  const plan = buildWorldShapePlan();
  for (const def of plan) {
    const layer = els.worldScene.querySelector(`[data-layer="${def.layer}"]`);
    if (!layer) {
      continue;
    }
    layer.appendChild(makeShape(def));
  }
  worldShapesInitialized = true;
}

function updateWorld(successfulWeeks) {
  if (!els.worldScene) {
    return;
  }
  initWorldShapes();
  const stage = stageFromWeeks(successfulWeeks);
  const stageName = stageNameForStage(stage);
  els.worldStageLabel.textContent = `Stage ${stage}: ${stageName}`;
  els.worldProgressBar.style.width = `${(stage / 30) * 100}%`;
  els.worldProgressText.textContent = `${stage} / 30 weeks`;
  els.worldScene.classList.toggle("urban-ground", stage >= 23);
  const plantLayer = els.worldScene.querySelector('[data-layer="plants"]');
  if (plantLayer) {
    plantLayer.classList.toggle("hidden-in-urban", stage >= 23);
  }
  els.worldScene.querySelectorAll(".shape").forEach((shape) => {
    const unlock = Number(shape.dataset.unlock || "1");
    shape.classList.toggle("unlocked", stage >= unlock);
  });
}

window.updateWorld = updateWorld;

function renderWorld() {
  const sourceWeeks = worldPreviewWeeks ?? state.successfulWeeks;
  const stage = stageFromWeeks(sourceWeeks);
  updateWorld(sourceWeeks);
  if (els.worldPreviewSlider) {
    els.worldPreviewSlider.value = String(stage);
  }
  if (els.worldPreviewText) {
    const stageName = stageNameForStage(stage);
    els.worldPreviewText.textContent = worldPreviewWeeks === null
      ? `Live stage from successful weeks: ${stage} (${stageName})`
      : `Previewing stage ${stage} (${stageName})`;
  }
}

function onWorldPreviewInput(event) {
  worldPreviewWeeks = Number(event.target.value);
  renderWorld();
}

function resetWorldPreview() {
  worldPreviewWeeks = null;
  renderWorld();
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
  els.clearStorePreview.textContent = previewCosmetics ? "Clear Preview (On)" : "Clear Preview";
  els.storeGrid.innerHTML = "";
  for (const item of STORE_ITEMS) {
    const card = document.createElement("article");
    const owned = state.purchased.includes(item.id);
    const active = isCosmeticActive(item, getEffectiveCosmetics());
    const buyApplyBtn = document.createElement("button");
    const previewBtn = document.createElement("button");
    const actions = document.createElement("div");

    card.className = "store-item";
    card.innerHTML = `<h4>${item.name}</h4><p>$${item.price}</p><small>${item.type}</small>`;
    if (!owned) {
      buyApplyBtn.textContent = "Buy";
      buyApplyBtn.disabled = state.balance < item.price;
      buyApplyBtn.addEventListener("click", () => buyStoreItem(item.id));
    } else {
      buyApplyBtn.textContent = active ? "Active" : "Apply";
      buyApplyBtn.className = active ? "success" : "";
      buyApplyBtn.addEventListener("click", () => applyStoreItem(item.id));
    }
    previewBtn.textContent = "Preview";
    previewBtn.className = "ghost";
    previewBtn.addEventListener("click", () => previewStoreItem(item.id));
    actions.className = "store-actions";
    actions.appendChild(buyApplyBtn);
    actions.appendChild(previewBtn);
    card.appendChild(actions);
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
  previewCosmetics = null;
  applyStoreItem(itemId);
  saveState();
  renderAll();
}

function isCosmeticActive(item, cosmetics = state.activeCosmetics) {
  if (item.type === "extra") {
    return cosmetics.extras.includes(item.value);
  }
  return cosmetics[item.type] === item.value;
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
  previewCosmetics = null;
  saveState();
  renderAll();
}

function previewStoreItem(itemId) {
  const item = STORE_ITEMS.find((s) => s.id === itemId);
  if (!item) {
    return;
  }
  previewCosmetics = structuredClone(state.activeCosmetics);
  if (item.type === "extra") {
    if (!previewCosmetics.extras.includes(item.value)) {
      previewCosmetics.extras.push(item.value);
    }
  } else {
    previewCosmetics[item.type] = item.value;
  }
  applyCosmetics();
  renderStore();
}

function clearStorePreview() {
  previewCosmetics = null;
  applyCosmetics();
  renderStore();
}

function getEffectiveCosmetics() {
  return previewCosmetics || state.activeCosmetics;
}

function applyCosmetics() {
  const body = document.body;
  const removableClasses = [
    ...STORE_ITEMS.map((item) => item.value),
    "theme-sunrise", "theme-ocean", "scheme-neon", "scheme-earth", "extra-stars", "extra-aurora"
  ];
  body.classList.remove(...new Set(removableClasses));
  const active = getEffectiveCosmetics();
  if (active.theme) {
    body.classList.add(active.theme);
  }
  if (active.scheme) {
    body.classList.add(active.scheme);
  }
  for (const extra of active.extras) {
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
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const windowEnd = new Date(now.getFullYear(), now.getMonth() + 3, 1, 0, 0, 0, 0);
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
      windowStart,
      windowEnd
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
  renderMonthGrid();
  renderSelectedDateEvents();
  renderCustomEventList();
  renderCalendarNextClass();
}

function getAllCalendarEvents() {
  const custom = (state.customEvents || []).map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    source: "custom"
  }));
  const synced = (state.calendarEvents || []).map((e) => ({
    ...e,
    source: "ics"
  }));
  return [...synced, ...custom].sort((a, b) => new Date(a.start) - new Date(b.start));
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
  const todayEvents = getAllCalendarEvents().filter((e) => isSameDay(new Date(e.start), today));
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
      <div class="calendar-item-main">${event.title}${event.sac ? " • SAC" : ""}${event.source === "custom" ? " (My Event)" : ""}</div>
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

    const events = getAllCalendarEvents().filter((e) => isSameDay(new Date(e.start), dayDate));
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
          <span>${event.title}${event.sac ? " • SAC" : ""}${event.source === "custom" ? " • Mine" : ""}</span>
        `;
        dayBox.appendChild(div);
      }
    }
    els.weekGrid.appendChild(dayBox);
  }
}

function renderCalendarNextClass() {
  const now = new Date();
  const next = getAllCalendarEvents().find((e) => new Date(e.start) > now);
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

function onCustomEventSubmit(event) {
  event.preventDefault();
  const title = els.customTitle.value.trim();
  const startRaw = els.customStart.value;
  const endRaw = els.customEnd.value;
  if (!title || !startRaw) {
    return;
  }
  const startDate = new Date(startRaw);
  let endDate = endRaw ? new Date(endRaw) : new Date(startDate.getTime() + 60 * 60 * 1000);
  if (endDate <= startDate) {
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  }
  state.customEvents.unshift({
    id: crypto.randomUUID(),
    title,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    sac: Boolean(els.customSac.checked)
  });
  if (state.customEvents.length > 300) {
    state.customEvents = state.customEvents.slice(0, 300);
  }
  saveState();
  els.customTitle.value = "";
  els.customStart.value = "";
  els.customEnd.value = "";
  els.customSac.checked = false;
  renderCalendar();
}

function deleteCustomEvent(eventId) {
  state.customEvents = (state.customEvents || []).filter((e) => e.id !== eventId);
  saveState();
  renderCalendar();
}

function shiftMonth(delta) {
  monthlyCursor = new Date(monthlyCursor.getFullYear(), monthlyCursor.getMonth() + delta, 1);
  if (
    monthlySelectedDate.getFullYear() !== monthlyCursor.getFullYear()
    || monthlySelectedDate.getMonth() !== monthlyCursor.getMonth()
  ) {
    monthlySelectedDate = new Date(monthlyCursor.getFullYear(), monthlyCursor.getMonth(), 1);
  }
  renderMonthGrid();
  renderSelectedDateEvents();
}

function renderMonthGrid() {
  const year = monthlyCursor.getFullYear();
  const month = monthlyCursor.getMonth();
  const first = new Date(year, month, 1);
  const firstDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const allEvents = getAllCalendarEvents();

  els.monthLabel.textContent = first.toLocaleDateString([], { month: "long", year: "numeric" });
  els.monthGrid.innerHTML = "";

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (const label of labels) {
    const head = document.createElement("div");
    head.className = "month-head";
    head.textContent = label;
    els.monthGrid.appendChild(head);
  }

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  for (let cell = 0; cell < totalCells; cell += 1) {
    const dayNum = cell - firstDay + 1;
    const box = document.createElement("div");
    box.className = "month-cell";
    if (dayNum < 1 || dayNum > daysInMonth) {
      box.classList.add("out");
      els.monthGrid.appendChild(box);
      continue;
    }
    const date = new Date(year, month, dayNum);
    const dayEvents = allEvents.filter((e) => isSameDay(new Date(e.start), date));
    const num = document.createElement("strong");
    num.textContent = String(dayNum);
    box.appendChild(num);
    box.classList.add("clickable");
    box.addEventListener("click", () => {
      monthlySelectedDate = new Date(year, month, dayNum);
      renderMonthGrid();
      renderSelectedDateEvents();
    });
    if (monthlySelectedDate && isSameDay(date, monthlySelectedDate)) {
      box.classList.add("selected");
    }
    if (dayEvents.length) {
      const chip = document.createElement("small");
      chip.className = dayEvents.some((e) => e.source === "custom") ? "mine" : "";
      chip.textContent = `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}`;
      box.appendChild(chip);
      if (dayEvents.some((e) => e.sac)) {
        const sac = document.createElement("span");
        sac.className = "sac-icon";
        sac.textContent = "●";
        box.appendChild(sac);
      }
    }
    els.monthGrid.appendChild(box);
  }
}

function renderSelectedDateEvents() {
  if (!monthlySelectedDate) {
    return;
  }
  const date = monthlySelectedDate;
  const dayEvents = getAllCalendarEvents().filter((e) => isSameDay(new Date(e.start), date));
  els.monthDayLabel.textContent = `Events for ${date.toLocaleDateString()}`;
  els.monthDayEvents.innerHTML = "";
  if (!dayEvents.length) {
    const li = document.createElement("li");
    li.className = "calendar-empty";
    li.textContent = "No events on this date.";
    els.monthDayEvents.appendChild(li);
    return;
  }
  for (const event of dayEvents) {
    const li = document.createElement("li");
    const start = new Date(event.start);
    const end = new Date(event.end);
    li.innerHTML = `<strong>${event.title}${event.sac ? " • SAC" : ""}${event.source === "custom" ? " (My Event)" : ""}</strong><small>${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>`;
    els.monthDayEvents.appendChild(li);
  }
}

function renderCustomEventList() {
  els.customEventList.innerHTML = "";
  const customEvents = (state.customEvents || []).slice().sort((a, b) => new Date(a.start) - new Date(b.start));
  if (!customEvents.length) {
    const li = document.createElement("li");
    li.className = "calendar-empty";
    li.textContent = "No custom events.";
    els.customEventList.appendChild(li);
    return;
  }
  for (const item of customEvents.slice(0, 20)) {
    const li = document.createElement("li");
    const start = new Date(item.start);
    const end = new Date(item.end);
    const del = document.createElement("button");
    li.className = "history-row";
    li.innerHTML = `<div><strong>${item.title}${item.sac ? " • SAC" : ""}</strong><small>${start.toLocaleString()} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>`;
    del.textContent = "Remove";
    del.className = "text-btn";
    del.addEventListener("click", () => deleteCustomEvent(item.id));
    li.appendChild(del);
    els.customEventList.appendChild(li);
  }
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
  const storedTracks = await Promise.all(files.map(fileToStoredTrack));
  audioTracks = audioTracks.concat(storedTracks.map(attachPlayableUrl));
  renderAudioLibrary();
  if (currentTrackIndex === -1) {
    currentTrackIndex = 0;
    loadTrack(currentTrackIndex);
  }
  await persistAudioLibrary();
}

function loadTrack(index) {
  const track = audioTracks[index];
  if (!track) {
    return;
  }
  currentTrackIndex = index;
  if (track.type && els.audioPlayer.canPlayType(track.type) === "") {
    els.trackLabel.textContent = `This browser may not support ${track.type}.`;
  }
  els.audioPlayer.src = track.url;
  els.audioPlayer.load();
  els.trackLabel.textContent = `Track: ${track.name}`;
  if (els.trackSelect) {
    els.trackSelect.value = String(index);
  }
  persistPlaybackState();
}

function togglePlayPause() {
  if (!audioTracks.length) {
    return;
  }
  if (isHubActive()) {
    sendMusicMessage({ type: "TOGGLE" });
    return;
  }
  onTrackSelected();
  if (!els.audioPlayer.src) {
    loadTrack(currentTrackIndex >= 0 ? currentTrackIndex : 0);
  }
  if (els.audioPlayer.paused) {
    els.audioPlayer.play().catch((error) => {
      if (error?.name === "NotAllowedError") {
        els.trackLabel.textContent = "Playback was blocked by browser policy. Click Play again.";
      } else if (error?.name === "NotSupportedError") {
        els.trackLabel.textContent = "This audio format is not supported in this browser.";
      } else {
        els.trackLabel.textContent = `Playback error: ${error?.message || "unknown error"}`;
      }
    });
  } else {
    els.audioPlayer.pause();
  }
}

async function hydrateAudioTracks() {
  audioTracks.forEach(releaseTrackUrl);
  const stored = await loadAudioLibraryFromDb();
  if (stored.length) {
    audioTracks = stored.map(attachPlayableUrl);
  } else {
    // One-time migration for older localStorage music data.
    const legacy = (state.uploadedTracks || []).map(attachPlayableUrl);
    if (legacy.length) {
      audioTracks = legacy;
      await saveAudioLibraryToDb(audioTracks.map(toPersistedTrack));
      state.uploadedTracks = [];
      try { saveState(); } catch (_) {}
    }
  }
  renderAudioLibrary();
  if (audioTracks.length) {
    currentTrackIndex = 0;
    loadTrack(0);
    restorePlaybackState();
  }
}

function removeTrack(index) {
  if (index < 0 || index >= audioTracks.length) {
    return;
  }
  const [removed] = audioTracks.splice(index, 1);
  releaseTrackUrl(removed);
  if (!audioTracks.length) {
    currentTrackIndex = -1;
    els.audioPlayer.pause();
    els.audioPlayer.src = "";
    els.trackLabel.textContent = "No track loaded.";
  } else {
    currentTrackIndex = Math.min(currentTrackIndex, audioTracks.length - 1);
    loadTrack(currentTrackIndex);
  }
  persistAudioLibrary();
  renderAudioLibrary();
}

function renderAudioLibrary() {
  els.trackSelect.innerHTML = "";
  if (!audioTracks.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No uploaded tracks";
    els.trackSelect.appendChild(opt);
    els.trackSelect.disabled = true;
    els.playPauseBtn.disabled = true;
    return;
  }
  els.trackSelect.disabled = false;
  els.playPauseBtn.disabled = false;

  audioTracks.forEach((track, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = track.name;
    els.trackSelect.appendChild(opt);
  });
  if (currentTrackIndex >= 0 && currentTrackIndex < audioTracks.length) {
    els.trackSelect.value = String(currentTrackIndex);
  } else {
    currentTrackIndex = 0;
    els.trackSelect.value = "0";
    loadTrack(0);
  }
  if (isHubActive()) {
    sendMusicMessage({ type: "STATE_REQUEST" });
  }
}

function persistPlaybackState() {
  try {
    const payload = {
      index: currentTrackIndex,
      currentTime: Number.isFinite(els.audioPlayer.currentTime) ? els.audioPlayer.currentTime : 0,
      wasPlaying: !els.audioPlayer.paused
    };
    localStorage.setItem(PLAYBACK_STATE_KEY, JSON.stringify(payload));
  } catch (_) {
    // Ignore transient storage failures.
  }
}

function restorePlaybackState() {
  if (!audioTracks.length) {
    return;
  }
  try {
    const raw = localStorage.getItem(PLAYBACK_STATE_KEY);
    if (!raw) {
      return;
    }
    const saved = JSON.parse(raw);
    const idx = Number(saved.index);
    if (!Number.isFinite(idx) || idx < 0 || idx >= audioTracks.length) {
      return;
    }
    loadTrack(idx);
    const targetTime = Math.max(0, Number(saved.currentTime) || 0);
    els.audioPlayer.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(targetTime)) {
        els.audioPlayer.currentTime = Math.min(targetTime, Number.isFinite(els.audioPlayer.duration) ? els.audioPlayer.duration || targetTime : targetTime);
      }
      if (saved.wasPlaying) {
        els.audioPlayer.play().catch(() => {
          pendingPlaybackResume = true;
          els.trackLabel.textContent = "Tap anywhere to resume playback.";
        });
      }
    }, { once: true });
  } catch (_) {
    // Ignore malformed playback state.
  }
}

function resumePendingPlayback() {
  if (!pendingPlaybackResume) {
    return;
  }
  if (currentTrackIndex < 0 || !audioTracks.length) {
    return;
  }
  els.audioPlayer.play().then(() => {
    pendingPlaybackResume = false;
    els.trackLabel.textContent = `Track: ${audioTracks[currentTrackIndex].name}`;
  }).catch(() => {
    // keep pending until browser allows playback
  });
}

function onTrackSelected() {
  const idx = Number(els.trackSelect.value);
  if (Number.isFinite(idx) && idx >= 0 && idx < audioTracks.length) {
    if (isHubActive()) {
      sendMusicMessage({ type: "SELECT", index: idx });
      currentTrackIndex = idx;
      els.trackLabel.textContent = `Track: ${audioTracks[idx].name}`;
      return;
    }
    loadTrack(idx);
  }
}

function onMouseMove(event) {
  document.body.style.setProperty("--cursor-x", `${event.clientX}px`);
  document.body.style.setProperty("--cursor-y", `${event.clientY}px`);
}

function initMusicChannel() {
  if (!("BroadcastChannel" in window)) {
    return;
  }
  musicChannel = new BroadcastChannel(MUSIC_CHANNEL);
  musicChannel.onmessage = (event) => {
    const msg = event.data || {};
    if (msg.type === "STATE_UPDATE") {
      if (Number.isFinite(msg.index) && msg.index >= 0 && msg.index < audioTracks.length) {
        currentTrackIndex = msg.index;
        els.trackSelect.value = String(msg.index);
      }
      if (typeof msg.label === "string" && msg.label) {
        els.trackLabel.textContent = msg.label;
      } else if (currentTrackIndex >= 0 && audioTracks[currentTrackIndex]) {
        els.trackLabel.textContent = `Track: ${audioTracks[currentTrackIndex].name}`;
      }
      els.playPauseBtn.textContent = msg.playing ? "Pause" : "Play";
    }
  };
}

function sendMusicMessage(payload) {
  if (musicChannel) {
    musicChannel.postMessage(payload);
  }
}

function isHubActive() {
  const ts = Number(localStorage.getItem(MUSIC_HUB_HEARTBEAT_KEY) || 0);
  return Number.isFinite(ts) && Date.now() - ts < 4000;
}

function openPersistentPlayer() {
  const w = window.open("music-hub.html", "StudyScapeMusicHub", "width=430,height=320");
  if (!w) {
    els.trackLabel.textContent = "Popup blocked. Allow popups to open persistent player.";
    return;
  }
  const tracks = audioTracks.map(toPersistedTrack);
  setTimeout(() => {
    sendMusicMessage({ type: "LIBRARY_SYNC", tracks });
    if (currentTrackIndex >= 0) {
      sendMusicMessage({ type: "SELECT", index: currentTrackIndex });
      if (!els.audioPlayer.paused || pendingPlaybackResume) {
        sendMusicMessage({ type: "PLAY" });
      }
    }
    sendMusicMessage({ type: "STATE_REQUEST" });
  }, 300);
}

async function persistAudioLibrary() {
  const payload = audioTracks.map(toPersistedTrack);
  try {
    await saveAudioLibraryToDb(payload);
    if (isHubActive()) {
      sendMusicMessage({ type: "LIBRARY_SYNC", tracks: payload });
    }
  } catch (_) {
    els.trackLabel.textContent = "Could not persist audio library. Files may be session-only.";
  }
}

function toPersistedTrack(track) {
  if (track.blob instanceof Blob) {
    return { name: track.name, type: track.type || track.blob.type || "", blob: track.blob };
  }
  return { name: track.name, type: track.type || "", dataUrl: track.dataUrl || track.url || "" };
}

function attachPlayableUrl(track) {
  if (track.blob instanceof Blob) {
    return { ...track, url: URL.createObjectURL(track.blob), _urlObject: true };
  }
  return { ...track, url: track.dataUrl || track.url || "" };
}

function releaseTrackUrl(track) {
  if (track?._urlObject && track.url) {
    URL.revokeObjectURL(track.url);
  }
}

function openAudioDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(AUDIO_DB_NAME, AUDIO_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Audio DB open failed"));
  });
}

async function saveAudioLibraryToDb(tracks) {
  const db = await openAudioDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, "readwrite");
    tx.objectStore(AUDIO_STORE).put({ id: AUDIO_LIBRARY_KEY, tracks });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Audio DB write failed"));
  });
  db.close();
}

async function loadAudioLibraryFromDb() {
  try {
    const db = await openAudioDb();
    const tracks = await new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, "readonly");
      const req = tx.objectStore(AUDIO_STORE).get(AUDIO_LIBRARY_KEY);
      req.onsuccess = () => resolve(req.result?.tracks || []);
      req.onerror = () => reject(req.error || new Error("Audio DB read failed"));
    });
    db.close();
    return Array.isArray(tracks) ? tracks : [];
  } catch (_) {
    return [];
  }
}

function fileToStoredTrack(file) {
  return Promise.resolve({
    name: file.name,
    type: file.type || "",
    blob: file
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
