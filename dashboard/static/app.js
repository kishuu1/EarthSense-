// ════════════════════════════════════════════════════════════════
//  EarthSense — Live Dashboard Script
// ════════════════════════════════════════════════════════════════

// ── Seismic Canvas Background ─────────────────────────────────────
const canvas = document.getElementById('seismicCanvas');
const ctx    = canvas.getContext('2d');
let waveAmplitude = 18, waveTarget = 18;

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let t = 0;
function drawSeismic() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const lines = 8;
  for (let l = 0; l < lines; l++) {
    const y = (canvas.height / (lines + 1)) * (l + 1);
    ctx.beginPath();
    ctx.strokeStyle = `hsla(${220 + l * 12},80%,60%,${0.22 - l * 0.015})`;
    ctx.lineWidth   = 1;
    for (let x = 0; x <= canvas.width; x += 2) {
      const freq  = 0.010 + l * 0.003;
      const phase = l * 0.9 + t * (0.28 + l * 0.04);
      const noise = Math.sin(x * 0.04 + t) * 4 + Math.sin(x * 0.013 - t * 2) * 2.5;
      const yy    = y + Math.sin(x * freq + phase) * waveAmplitude + noise;
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  waveAmplitude += (waveTarget - waveAmplitude) * 0.04;
  t += 0.015;
  requestAnimationFrame(drawSeismic);
}
drawSeismic();

// ── Floating Particle Overlay ──────────────────────────────────────
const particleOverlay = document.getElementById('particleOverlay');
(function spawnParticles() {
  const p = document.createElement('div');
  p.className = 'particle';
  const size  = 2 + Math.random() * 4;
  const left  = Math.random() * 100;
  const delay = Math.random() * 8;
  const dur   = 12 + Math.random() * 16;
  p.style.cssText = `width:${size}px;height:${size}px;left:${left}%;bottom:-10px;animation-duration:${dur}s;animation-delay:${delay}s;opacity:0`;
  particleOverlay.appendChild(p);
  if (particleOverlay.children.length > 40) particleOverlay.firstChild.remove();
})();
setInterval(() => {
  const p = document.createElement('div');
  p.className = 'particle';
  const size = 2 + Math.random() * 5;
  p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;bottom:-10px;animation-duration:${12+Math.random()*16}s;animation-delay:0s`;
  particleOverlay.appendChild(p);
  if (particleOverlay.children.length > 40) particleOverlay.firstChild.remove();
}, 2000);

// ── Clock ──────────────────────────────────────────────────────────
function updateClock() {
  const n = new Date();
  document.getElementById('headerClock').textContent = n.toUTCString().slice(17, 25) + ' UTC';
}
updateClock();
setInterval(updateClock, 1000);

// ── Tab Switching ──────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
  document.getElementById('nav' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');

  if (name === 'analytics') refreshAnalytics();
  if (name === 'sensors')   refreshSensorCards();
  if (name === 'history')   renderHistory();
}

// ── Leaflet Map ────────────────────────────────────────────────────
const map = L.map('seismicMap', {
  center: [20, 10], zoom: 2, zoomControl: true, attributionControl: false
});
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd', maxZoom: 18
}).addTo(map);

const sensorMarkers = {};

function makePinIcon(sev = 'NORMAL') {
  return L.divIcon({
    html: `<div class="sensor-pin"><div class="pin-ring ${sev}"></div><div class="pin-dot ${sev}"></div></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8], className: ''
  });
}

(window.SENSORS || []).forEach(s => {
  const m = L.marker([s.lat, s.lng], { icon: makePinIcon('NORMAL') })
    .addTo(map)
    .bindPopup(`<b>${s.name}</b><br>${s.location}`);
  sensorMarkers[s.id] = m;
});

function flashMarker(ev) {
  const m = sensorMarkers[ev.sensor_id];
  if (!m) return;
  m.setIcon(makePinIcon(ev.severity));
  const radius = Math.pow(10, ev.magnitude * 0.4) * 3000;
  const color  = ev.severity === 'CRITICAL' ? '#ff2244' : ev.severity === 'WARNING' ? '#ff8800' : '#00cc77';
  const ripple = L.circle([ev.lat, ev.lng], {
    radius, color, fillColor: color, fillOpacity: 0.08, weight: 1.5
  }).addTo(map);
  setTimeout(() => { map.removeLayer(ripple); }, 5000);
  setTimeout(() => { m.setIcon(makePinIcon('NORMAL')); }, 5000);
}

// ── Chart.js — Live Magnitude Stream ──────────────────────────────
const chartCtx = document.getElementById('magnitudeChart').getContext('2d');
const chartData = {
  labels: [],
  datasets: [{
    label: 'Magnitude', data: [], pointRadius: 4, pointHoverRadius: 7,
    borderWidth: 2, fill: true,
    borderColor: '#6644ff',
    backgroundColor: 'rgba(102,68,255,0.07)',
    pointBackgroundColor: [], pointBorderColor: [],
    tension: 0.4,
  }]
};

const magnitudeChart = new Chart(chartCtx, {
  type: 'line', data: chartData,
  options: {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 250 },
    scales: {
      x: { display: false },
      y: {
        min: 0, max: 9,
        ticks: { color: '#7070a0', font: { family: 'JetBrains Mono', size: 9 } },
        grid: { color: 'rgba(100,100,200,0.07)' },
        border: { display: false }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10,10,30,0.95)',
        titleColor: '#e0e0ff', bodyColor: '#a0a0c0',
        borderColor: 'rgba(100,100,200,0.3)', borderWidth: 1,
        callbacks: { label: c => `M ${c.raw.toFixed(2)}` }
      }
    },
    interaction: { mode: 'index', intersect: false }
  }
});

function getPointColor(mag) {
  if (mag >= 6.0) return '#ff2244';
  if (mag >= 4.5) return '#ff8800';
  return '#00cc77';
}

function addChartPoint(ev) {
  const MAX = 50;
  const c   = getPointColor(ev.magnitude);
  chartData.labels.push(ev.timestamp.slice(11, 19));
  chartData.datasets[0].data.push(ev.magnitude);
  chartData.datasets[0].pointBackgroundColor.push(c);
  chartData.datasets[0].pointBorderColor.push(c);
  if (chartData.labels.length > MAX) {
    chartData.labels.shift();
    chartData.datasets[0].data.shift();
    chartData.datasets[0].pointBackgroundColor.shift();
    chartData.datasets[0].pointBorderColor.shift();
  }
  chartData.datasets[0].borderColor = (context) => {
    const { ctx: c2, chartArea } = context.chart;
    if (!chartArea) return '#6644ff';
    const g = c2.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
    g.addColorStop(0, '#6644ff'); g.addColorStop(0.5, '#00cc77'); g.addColorStop(1, '#ff2244');
    return g;
  };
  magnitudeChart.update('none');
}

// ── Donut Chart (analytics) ────────────────────────────────────────
const donutCtx = document.getElementById('donutChart').getContext('2d');
const donutChart = new Chart(donutCtx, {
  type: 'doughnut',
  data: {
    labels: ['Critical', 'Warning', 'Normal'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#ff2244','#ff8800','#00cc77'],
      borderColor: 'rgba(7,7,26,0.8)', borderWidth: 3, hoverOffset: 8 }]
  },
  options: {
    cutout: '68%', responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#7070a0', font: { family: 'Space Grotesk', size: 10 }, padding: 10 }
      },
      tooltip: {
        backgroundColor: 'rgba(10,10,30,0.95)', titleColor: '#e0e0ff',
        bodyColor: '#a0a0c0', borderColor: 'rgba(100,100,200,0.3)', borderWidth: 1
      }
    }
  }
});

// ── Bar Chart (analytics) ──────────────────────────────────────────
const barCtx = document.getElementById('barChart').getContext('2d');
const barChart = new Chart(barCtx, {
  type: 'bar',
  data: {
    labels: (window.SENSORS || []).map(s => s.id),
    datasets: [{
      label: 'Events',
      data: (window.SENSORS || []).map(() => 0),
      backgroundColor: (window.SENSORS || []).map((_, i) => `hsla(${220 + i * 22},70%,60%,0.6)`),
      borderRadius: 6, borderSkipped: false
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 400 },
    scales: {
      x: { ticks: { color: '#7070a0', font: { family: 'JetBrains Mono', size: 9 } }, grid: { display: false } },
      y: { ticks: { color: '#7070a0', font: { family: 'JetBrains Mono', size: 9 } },
           grid: { color: 'rgba(100,100,200,0.07)' }, border: { display: false } }
    },
    plugins: { legend: { display: false },
      tooltip: { backgroundColor: 'rgba(10,10,30,0.95)', titleColor: '#e0e0ff', bodyColor: '#a0a0c0', borderColor: 'rgba(100,100,200,0.3)', borderWidth: 1 }
    }
  }
});

const sensorEventCounts = {};
(window.SENSORS || []).forEach(s => { sensorEventCounts[s.id] = 0; });

function updateBarChart(ev) {
  const idx = (window.SENSORS || []).findIndex(s => s.id === ev.sensor_id);
  if (idx < 0) return;
  sensorEventCounts[ev.sensor_id] = (sensorEventCounts[ev.sensor_id] || 0) + 1;
  barChart.data.datasets[0].data[idx] = sensorEventCounts[ev.sensor_id];
  barChart.update('none');
}

// ── Gauge Canvas ───────────────────────────────────────────────────
const gaugeCanvas = document.getElementById('gaugeCanvas');
const gaugeCtx    = gaugeCanvas.getContext('2d');
let   magnitudeHistory = [];

function drawGauge(value) {
  const w = gaugeCanvas.width, h = gaugeCanvas.height;
  gaugeCtx.clearRect(0, 0, w, h);
  const cx   = w / 2, cy = h - 10;
  const r    = 80;
  const startA = Math.PI, endA = 2 * Math.PI;
  const pct  = Math.min(value / 9, 1);
  const valA = startA + pct * Math.PI;

  // Track
  gaugeCtx.beginPath();
  gaugeCtx.arc(cx, cy, r, startA, endA);
  gaugeCtx.strokeStyle = 'rgba(100,100,200,0.15)';
  gaugeCtx.lineWidth   = 12;
  gaugeCtx.lineCap     = 'round';
  gaugeCtx.stroke();

  // Fill gradient
  const grad = gaugeCtx.createLinearGradient(cx - r, 0, cx + r, 0);
  grad.addColorStop(0,   '#00cc77');
  grad.addColorStop(0.5, '#ff8800');
  grad.addColorStop(1,   '#ff2244');
  gaugeCtx.beginPath();
  gaugeCtx.arc(cx, cy, r, startA, valA);
  gaugeCtx.strokeStyle = grad;
  gaugeCtx.lineWidth   = 12;
  gaugeCtx.stroke();

  // Needle
  const needleA = startA + pct * Math.PI;
  gaugeCtx.save();
  gaugeCtx.translate(cx, cy);
  gaugeCtx.rotate(needleA);
  gaugeCtx.beginPath();
  gaugeCtx.moveTo(-6, 0);
  gaugeCtx.lineTo(r - 16, 0);
  gaugeCtx.strokeStyle = '#ffffff';
  gaugeCtx.lineWidth   = 2;
  gaugeCtx.lineCap     = 'round';
  gaugeCtx.stroke();
  gaugeCtx.restore();

  // Labels
  ['0','3','6','9'].forEach((label, i) => {
    const a = Math.PI + (i / 3) * Math.PI;
    const lx = cx + (r + 14) * Math.cos(a);
    const ly = cy + (r + 14) * Math.sin(a);
    gaugeCtx.fillStyle = '#7070a0';
    gaugeCtx.font      = '9px JetBrains Mono';
    gaugeCtx.textAlign = 'center';
    gaugeCtx.fillText(label, lx, ly + 3);
  });

  document.getElementById('gaugeValue').textContent = isNaN(value) ? '—' : value.toFixed(2);
}
drawGauge(0);

function refreshGauge() {
  if (!magnitudeHistory.length) return;
  const avg = magnitudeHistory.reduce((a, b) => a + b, 0) / magnitudeHistory.length;
  drawGauge(avg);
}

// ── Heatmap ────────────────────────────────────────────────────────
const heatmapData = [];

function magToHeatColor(mag) {
  if (mag >= 6) return '#ff2244';
  if (mag >= 4.5) return '#ff8800';
  if (mag >= 2.5) return '#ffcc00';
  return '#00cc77';
}

function updateHeatmap(ev) {
  heatmapData.push(ev.magnitude);
  if (heatmapData.length > 50) heatmapData.shift();
  renderHeatmap();
}

function renderHeatmap() {
  const grid = document.getElementById('heatmapGrid');
  grid.innerHTML = '';
  heatmapData.forEach((mag, i) => {
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    const intensity = Math.min(mag / 9, 1);
    cell.style.background  = magToHeatColor(mag);
    cell.style.opacity     = 0.3 + intensity * 0.7;
    cell.title = `M ${mag.toFixed(1)}`;
    grid.appendChild(cell);
  });
}

function refreshAnalytics() {
  donutChart.update();
  barChart.update();
  refreshGauge();
  renderHeatmap();
}

// ── Sensor Status Grid ─────────────────────────────────────────────
const sensorState = {};
(window.SENSORS || []).forEach(s => {
  sensorState[s.id] = { ...s, magnitude: 0, severity: 'NORMAL', lastTime: '—' };
});

function refreshSensorCards() {
  const grid = document.getElementById('sensorGrid');
  grid.innerHTML = '';
  Object.values(sensorState).forEach(s => {
    const pct   = Math.min((s.magnitude || 0) / 9 * 100, 100);
    const color = getPointColor(s.magnitude || 0);
    const card  = document.createElement('div');
    card.className = `sensor-card ${s.severity}`;
    card.innerHTML = `
      <div class="sensor-pulse-ring ${s.severity}"></div>
      <div class="sensor-card-header">
        <span class="sensor-id">${s.id}</span>
        <span class="sensor-sev ${s.severity}">${s.severity}</span>
      </div>
      <div class="sensor-location">📍 ${s.location || s.name}</div>
      <div class="sensor-mag ${s.severity}">${s.magnitude ? s.magnitude.toFixed(1) : '—'}</div>
      <div class="sensor-mini-bar">
        <div class="sensor-mini-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="sensor-last-time">LAST: ${s.lastTime}</div>`;
    card.onclick = () => {
      switchTab('dashboard');
      if (s.lat && s.lng) map.flyTo([s.lat, s.lng], 5, { duration: 1.2 });
    };
    grid.appendChild(card);
  });
}
refreshSensorCards();

function updateSensorState(ev) {
  if (!sensorState[ev.sensor_id]) return;
  sensorState[ev.sensor_id].magnitude = ev.magnitude;
  sensorState[ev.sensor_id].severity  = ev.severity;
  sensorState[ev.sensor_id].lastTime  = ev.timestamp.slice(11, 19) + ' UTC';
}

// ── History Log ────────────────────────────────────────────────────
const historyLog = [];

function addToHistory(ev) {
  historyLog.unshift(ev);
  if (historyLog.length > 500) historyLog.pop();
}

let currentFilter = 'ALL';
function filterHistory() {
  currentFilter = document.getElementById('historySeverity').value;
  const search  = (document.getElementById('historySearch')?.value || '').toLowerCase();
  renderHistory(currentFilter, search);
}

document.getElementById('historySearch').addEventListener('input', () => filterHistory());

function renderHistory(sev = 'ALL', search = '') {
  const body = document.getElementById('historyBody');
  body.innerHTML = '';
  const filtered = historyLog.filter(ev =>
    (sev === 'ALL' || ev.severity === sev) &&
    (!search || ev.location.toLowerCase().includes(search) || ev.sensor_id.toLowerCase().includes(search))
  ).slice(0, 200);

  filtered.forEach(ev => {
    const tr = document.createElement('tr');
    const magColor = getPointColor(ev.magnitude);
    tr.innerHTML = `
      <td>${ev.timestamp.slice(11, 19)} UTC</td>
      <td>${ev.sensor_id}</td>
      <td>${ev.location}</td>
      <td style="color:${magColor};font-weight:700">M ${ev.magnitude.toFixed(2)}</td>
      <td>${ev.depth} km</td>
      <td><span class="sev-badge ${ev.severity}">${ev.severity}</span></td>`;
    tr.style.cursor = 'pointer';
    tr.onclick = () => {
      switchTab('dashboard');
      if (ev.lat && ev.lng) map.flyTo([ev.lat, ev.lng], 5, { duration: 1.2 });
    };
    body.appendChild(tr);
  });

  if (!filtered.length) {
    body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px;letter-spacing:2px">NO RECORDS FOUND</td></tr>`;
  }
}

function exportCSV() {
  const rows = ['TIME UTC,SENSOR,LOCATION,MAGNITUDE,DEPTH,SEVERITY'];
  historyLog.forEach(ev => {
    rows.push(`${ev.timestamp.slice(11,19)} UTC,${ev.sensor_id},${ev.location},${ev.magnitude.toFixed(2)},${ev.depth},${ev.severity}`);
  });
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `earthsense_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}
window.exportCSV = exportCSV;

// ── Risk Meter ─────────────────────────────────────────────────────
function updateRiskMeter(stats) {
  const total = stats.total || 1;
  const risk  = Math.min(100, ((stats.critical * 4 + stats.warning * 2) / total) * 100 + stats.critical * 3);
  const bar   = document.getElementById('riskBar');
  const label = document.getElementById('riskLabel');
  bar.style.width = Math.min(100, risk) + '%';
  if (risk < 20) {
    label.textContent = 'LOW';     label.style.color = 'var(--normal)';
  } else if (risk < 50) {
    label.textContent = 'MEDIUM';  label.style.color = 'var(--warning)';
  } else if (risk < 75) {
    label.textContent = 'HIGH';    label.style.color = '#ff6622';
  } else {
    label.textContent = 'EXTREME'; label.style.color = 'var(--critical)';
  }
}

// ── Event Feed ─────────────────────────────────────────────────────
let feedCount = 0, feedFilterCurrent = 'ALL';
const MAX_FEED = 40;
const feedEl      = document.getElementById('eventFeed');
const feedCountEl = document.getElementById('feedCount');

function severityIcon(sev) {
  return sev === 'CRITICAL' ? '🚨' : sev === 'WARNING' ? '⚠️' : '✅';
}

function setFilter(btn, filter) {
  feedFilterCurrent = filter;
  document.querySelectorAll('.feed-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.event-card').forEach(card => {
    card.classList.toggle('hidden', filter !== 'ALL' && !card.classList.contains(filter));
  });
}
window.setFilter = setFilter;

function addFeedCard(ev, prepend = true) {
  feedCount++;
  feedCountEl.textContent = feedCount + ' events';

  const card = document.createElement('div');
  card.className = `event-card ${ev.severity}${feedFilterCurrent !== 'ALL' && feedFilterCurrent !== ev.severity ? ' hidden' : ''}`;
  card.innerHTML = `
    <div class="event-badge ${ev.severity}">${severityIcon(ev.severity)}</div>
    <div class="event-info">
      <div class="event-location">${ev.location}</div>
      <div class="event-meta">${ev.sensor_id} · ${ev.depth} km depth · ${ev.timestamp.slice(11, 19)} UTC</div>
    </div>
    <div class="event-mag ${ev.severity}">${ev.magnitude.toFixed(1)}</div>`;
  card.onclick = () => map.flyTo([ev.lat, ev.lng], 5, { duration: 1.2 });

  if (prepend) {
    // Remove placeholder
    const placeholder = feedEl.querySelector('[style*="AWAITING"]');
    if (placeholder) placeholder.remove();
    feedEl.prepend(card);
    if (feedEl.children.length > MAX_FEED) feedEl.lastElementChild.remove();
  } else {
    feedEl.append(card);
  }
}

// ── Stats Counters ─────────────────────────────────────────────────
const counters = { total: 0, critical: 0, warning: 0, normal: 0 };

function animateTo(el, target) {
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const step  = Math.ceil(Math.abs(target - current) / 8);
  const inc   = target > current ? step : -step;
  let   val   = current;
  const timer = setInterval(() => {
    val += inc;
    if ((inc > 0 && val >= target) || (inc < 0 && val <= target)) { val = target; clearInterval(timer); }
    el.textContent = val;
  }, 30);
}

function updateStats(stats) {
  animateTo(document.getElementById('totalCount'),    stats.total);
  animateTo(document.getElementById('criticalCount'), stats.critical);
  animateTo(document.getElementById('warningCount'),  stats.warning);
  animateTo(document.getElementById('normalCount'),   stats.normal);
  // Flash cards
  if (stats.critical > counters.critical) {
    document.getElementById('card-critical').classList.add('pulse-crit');
    setTimeout(() => document.getElementById('card-critical').classList.remove('pulse-crit'), 700);
  }
  if (stats.warning > counters.warning) {
    document.getElementById('card-warning').classList.add('pulse-warn');
    setTimeout(() => document.getElementById('card-warning').classList.remove('pulse-warn'), 700);
  }
  Object.assign(counters, stats);

  // Update donut
  donutChart.data.datasets[0].data = [stats.critical, stats.warning, stats.normal];
  donutChart.update('none');

  updateRiskMeter(stats);
}

// ── Ticker ─────────────────────────────────────────────────────────
const tickerInner = document.getElementById('tickerInner');
const tickerItems = [];

function addTickerItem(ev) {
  const icon = severityIcon(ev.severity);
  const span = document.createElement('span');
  span.className   = `ticker-item ${ev.severity}`;
  span.textContent = `${icon} M${ev.magnitude.toFixed(1)} ${ev.location} [${ev.sensor_id}] ${ev.timestamp.slice(11, 19)}UTC`;
  tickerItems.push(span.outerHTML);
  if (tickerItems.length > 40) tickerItems.shift();
  tickerInner.innerHTML = tickerItems.join('') + '&nbsp;&nbsp;&nbsp;&nbsp;' + tickerItems.join('');
}

// ══════════════ TOAST NOTIFICATIONS ══════════════════════════════
const toastContainer = document.getElementById('toastContainer');
let   alertCount     = 0;

function showToast(ev) {
  if (ev.severity === 'NORMAL') return; // only for warnings/criticals

  alertCount++;
  document.getElementById('drawerBadge').textContent = alertCount;
  addToDrawer(ev);

  const toastDuration = 8000;
  const toast = document.createElement('div');
  toast.className = `toast ${ev.severity}`;
  toast.innerHTML = `
    <button class="toast-close" onclick="removeToast(this.parentElement)">✕</button>
    <div class="toast-body">
      <div class="toast-icon">${ev.severity === 'CRITICAL' ? '🚨' : '⚠️'}</div>
      <div class="toast-info">
        <div class="toast-mag">M ${ev.magnitude.toFixed(1)}</div>
        <div class="toast-title">${ev.severity === 'CRITICAL' ? '🔴 CRITICAL EARTHQUAKE' : '🟠 SEISMIC WARNING'}</div>
        <div class="toast-detail">
          <strong>${ev.location}</strong><br>
          ${ev.sensor_id} · ${ev.depth} km · ${ev.timestamp.slice(11, 19)} UTC
        </div>
      </div>
    </div>
    <div class="toast-progress" style="width:100%"></div>`;

  toast.onclick = (e) => {
    if (e.target.classList.contains('toast-close')) return;
    map.flyTo([ev.lat, ev.lng], 5, { duration: 1.2 });
    switchTab('dashboard');
  };

  toastContainer.prepend(toast);

  // Animate progress bar
  const bar = toast.querySelector('.toast-progress');
  requestAnimationFrame(() => {
    bar.style.transition = `width ${toastDuration}ms linear`;
    bar.style.width = '0%';
  });

  // Critical extras
  if (ev.severity === 'CRITICAL') {
    document.body.classList.remove('quake-shake');
    void document.body.offsetWidth;
    document.body.classList.add('quake-shake');
    waveTarget = 80;
    setTimeout(() => { waveTarget = 18; }, 3000);
  }

  // Auto remove
  const removalTimer = setTimeout(() => removeToast(toast), toastDuration);
  toast._removalTimer = removalTimer;

  // Max 4 toasts visible
  while (toastContainer.children.length > 4) {
    const oldest = toastContainer.lastChild;
    if (oldest && oldest._removalTimer) clearTimeout(oldest._removalTimer);
    toastContainer.removeChild(oldest);
  }
}

function removeToast(toast) {
  if (!toast || !toast.parentElement) return;
  if (toast._removalTimer) clearTimeout(toast._removalTimer);
  toast.classList.add('removing');
  setTimeout(() => toast.remove(), 300);
}
window.removeToast = removeToast;

// ── Side Drawer ────────────────────────────────────────────────────
let drawerOpen = false;

function toggleDrawer() {
  drawerOpen = !drawerOpen;
  document.getElementById('sideDrawer').classList.toggle('open', drawerOpen);
  if (drawerOpen) {
    alertCount = 0;
    document.getElementById('drawerBadge').textContent = '0';
  }
}
window.toggleDrawer = toggleDrawer;

function addToDrawer(ev) {
  const body = document.getElementById('drawerAlerts');
  const item = document.createElement('div');
  item.className = `drawer-toast-mini ${ev.severity}`;
  item.innerHTML = `
    <div class="mini-mag">${ev.severity === 'CRITICAL' ? '🚨' : '⚠️'} M ${ev.magnitude.toFixed(1)}</div>
    <div class="mini-loc">${ev.location} · ${ev.sensor_id}</div>
    <div class="mini-loc">${ev.timestamp.slice(11, 19)} UTC</div>`;
  item.onclick = () => {
    switchTab('dashboard');
    map.flyTo([ev.lat, ev.lng], 5, { duration: 1.2 });
  };
  body.prepend(item);
  if (body.children.length > 50) body.lastChild.remove();
}

// ── Socket.IO ──────────────────────────────────────────────────────
const socket = io();

socket.on('connect', () => {
  console.log('[WS] Connected to EarthSense');
  const cs = document.getElementById('connectionStatus');
  cs.classList.add('online');
  cs.querySelector('.conn-label').textContent = 'ONLINE';
});

socket.on('disconnect', () => {
  console.warn('[WS] Disconnected');
  const cs = document.getElementById('connectionStatus');
  cs.classList.remove('online');
  cs.querySelector('.conn-label').textContent = 'OFFLINE';
});

socket.on('earthquake_event', ev => {
  addFeedCard(ev, true);
  addChartPoint(ev);
  flashMarker(ev);
  addTickerItem(ev);
  addToHistory(ev);
  updateSensorState(ev);
  updateBarChart(ev);
  updateHeatmap(ev);
  magnitudeHistory.push(ev.magnitude);
  if (magnitudeHistory.length > 100) magnitudeHistory.shift();
  refreshGauge();

  const lastMagEl = document.getElementById('lastMagnitude');
  lastMagEl.textContent = ev.magnitude.toFixed(1);
  lastMagEl.style.color = getPointColor(ev.magnitude);

  // Auto-update open tabs
  if (document.getElementById('tabSensors').classList.contains('active'))   refreshSensorCards();
  if (document.getElementById('tabHistory').classList.contains('active'))    renderHistory(currentFilter, document.getElementById('historySearch').value);
});

socket.on('alert_triggered', ev => {
  showToast(ev);
});

socket.on('stats_update', stats => {
  updateStats(stats);
});
