import eventlet
eventlet.monkey_patch()

import sys, os, queue
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
load_dotenv()

from sensor_simulator.simulator import generate_event, get_sensors, SENSORS
from stream_processor.processor import process_event
from alert_engine.alerter import send_alert
from data_store.db import init_db, save_event, get_recent_events, get_stats

app = Flask(__name__)
app.config['SECRET_KEY'] = 'earthsense-2025'
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='eventlet')

init_db()
INTERVAL = float(os.getenv('EMIT_INTERVAL_SECONDS', 2))
event_queue = queue.Queue()

# ── Background Tasks ──────────────────────────────────────────────────────────

def sensor_task():
    sensors = get_sensors()
    i = 0
    print("[SENSOR] Sensor simulation starting...")
    while True:
        raw = generate_event(sensors[i % len(sensors)])
        event_queue.put(raw)
        i += 1
        socketio.sleep(INTERVAL / len(sensors))

def processor_task():
    print("[PROCESSOR] Stream processor starting...")
    while True:
        if not event_queue.empty():
            raw = event_queue.get()
            ev  = process_event(raw)
            save_event(ev)
            if ev['should_alert']:
                ev['alert_sent'] = send_alert(ev)
            socketio.emit('earthquake_event', ev)
            if ev['severity'] in ['WARNING','CRITICAL']:
                socketio.emit('alert_triggered', ev)
            socketio.emit('stats_update', get_stats())
            sev = ev['severity']
            icon = '🚨' if sev=='CRITICAL' else ('⚠️' if sev=='WARNING' else '✅')
            print(f"{icon} [{sev:8}] {ev['sensor_id']} M{ev['magnitude']:.2f} @ {ev['location']}")
        socketio.sleep(0.05)

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html', sensors=SENSORS)

@app.route('/api/events')
def api_events():
    return jsonify(get_recent_events(request.args.get('limit', 100, type=int)))

@app.route('/api/stats')
def api_stats():
    return jsonify(get_stats())

@app.route('/api/sensors')
def api_sensors():
    return jsonify(SENSORS)

@socketio.on('connect')
def on_connect():
    print("[DASHBOARD] Client connected")
    emit('stats_update', get_stats())
    for ev in get_recent_events(20):
        emit('earthquake_event', ev)

# ── Start ─────────────────────────────────────────────────────────────────────

socketio.start_background_task(sensor_task)
socketio.start_background_task(processor_task)

if __name__ == '__main__':
    port = int(os.getenv('DASHBOARD_PORT', 5000))
    print(f"""
╔══════════════════════════════════════════════╗
║  🌍  EarthSense — Seismic Monitoring         ║
║  Dashboard ▶  http://localhost:{port}           ║
╚══════════════════════════════════════════════╝
""")
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
