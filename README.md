# 🌍 EarthSense — Real-Time Seismic Alert System

A cloud-native, real-time earthquake monitoring and alert dashboard powered by Flask, Socket.IO, and simulated sensor streaming.

![EarthSense Live Dashboard](screenshot.png)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Global Sensor Map** | Leaflet map with 8 live sensor markers and ripple animations |
| 📈 **Live Magnitude Stream** | Chart.js line chart updating in real-time |
| ⚡ **Live Event Feed** | Filterable feed (ALL / Critical / Warning) |
| 🔔 **Toast Notifications** | Non-blocking corner alerts — never blocks your view |
| 📊 **Analytics Tab** | Donut chart, bar chart, magnitude heatmap, gauge |
| 📡 **Sensor Status Grid** | Live status card for each of the 8 sensors |
| 🗂️ **History Tab** | Searchable, filterable event log + CSV export |
| ⚡ **Risk Level Meter** | Live risk score (LOW → EXTREME) |
| 🔔 **Alert Drawer** | Side panel logging all warnings & criticals |
| 🌊 **Seismic Wave BG** | Animated canvas background that reacts to events |
| 🎫 **Seismic Ticker** | Scrolling bottom news-ticker of all events |

---

## 🚀 Quick Start (Local)

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/earthsense.git
cd earthsense

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run
python run_all.py
```

Open **http://localhost:5000** in your browser.

---

## 🏗️ Architecture

```
cloud project/
├── dashboard/
│   ├── app.py              ← Flask + Socket.IO server
│   ├── templates/
│   │   └── index.html      ← Main UI (Jinja2)
│   └── static/
│       ├── app.js          ← All live chart / map / toast logic
│       └── style.css       ← Full dark UI styles
├── sensor_simulator/
│   └── simulator.py        ← Simulates 8 global seismic sensors
├── stream_processor/
│   └── processor.py        ← Classifies events (NORMAL/WARNING/CRITICAL)
├── alert_engine/
│   └── alerter.py          ← Alert dispatch logic
├── data_store/
│   └── db.py               ← SQLite event storage
├── run_all.py              ← Entry point
└── requirements.txt
```

---

## ⚙️ Environment Variables

Create a `.env` file (see `.env.example`):

```env
EMIT_INTERVAL_SECONDS=2
MAGNITUDE_WARNING_THRESHOLD=4.5
MAGNITUDE_CRITICAL_THRESHOLD=6.0
DASHBOARD_PORT=5000
```

---

## 🛠️ Tech Stack

- **Backend**: Python, Flask, Flask-SocketIO, Eventlet
- **Frontend**: Vanilla JS, Chart.js, Leaflet.js, Socket.IO client
- **Database**: SQLite
- **Deployment**: Render.com (WebSocket-compatible)

---

## 📡 Live Deployment

Deployed on **Render** → supports Flask + Socket.IO WebSockets natively.

> ⚠️ **Note**: Netlify/Vercel do NOT support Python Flask apps with persistent WebSocket connections. Use **Render.com** (free tier available).

---

## 📸 Screenshots

### Dashboard
![Dashboard](screenshot.png)

---

## 📄 License

MIT — feel free to fork and build on top of it!
