import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'earthquake_data.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''CREATE TABLE IF NOT EXISTS seismic_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id TEXT, sensor_name TEXT, location TEXT,
        latitude REAL, longitude REAL, magnitude REAL,
        depth REAL, severity TEXT, spike REAL,
        alert_sent INTEGER DEFAULT 0, timestamp TEXT
    )''')
    conn.commit(); conn.close()

def save_event(e):
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''INSERT INTO seismic_events
        (sensor_id,sensor_name,location,latitude,longitude,magnitude,depth,severity,spike,alert_sent,timestamp)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)''',
        (e['sensor_id'],e['sensor_name'],e['location'],e['lat'],e['lng'],
         e['magnitude'],e['depth'],e['severity'],e.get('spike',0),
         1 if e.get('alert_sent') else 0, e['timestamp']))
    conn.commit(); conn.close()

def get_recent_events(limit=100):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute('SELECT * FROM seismic_events ORDER BY id DESC LIMIT ?',(limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_stats():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    total   = cur.execute('SELECT COUNT(*) FROM seismic_events').fetchone()[0]
    critical= cur.execute("SELECT COUNT(*) FROM seismic_events WHERE severity='CRITICAL'").fetchone()[0]
    warning = cur.execute("SELECT COUNT(*) FROM seismic_events WHERE severity='WARNING'").fetchone()[0]
    normal  = cur.execute("SELECT COUNT(*) FROM seismic_events WHERE severity='NORMAL'").fetchone()[0]
    conn.close()
    return {'total':total,'critical':critical,'warning':warning,'normal':normal}
