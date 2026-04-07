import random
from datetime import datetime, timezone

SENSORS = [
    {"id":"JP-01","name":"Tokyo Seismic",    "lat":35.6762, "lng":139.6503,"location":"Tokyo, Japan"},
    {"id":"ID-01","name":"Java Monitor",     "lat":-7.6145, "lng":110.7122,"location":"Java, Indonesia"},
    {"id":"CL-01","name":"Santiago Watch",   "lat":-33.4489,"lng":-70.6693,"location":"Santiago, Chile"},
    {"id":"TR-01","name":"Ankara Guard",     "lat":39.9334, "lng":32.8597, "location":"Ankara, Turkey"},
    {"id":"CA-01","name":"San Andreas Net",  "lat":37.3382, "lng":-121.8863,"location":"California, USA"},
    {"id":"NP-01","name":"Kathmandu Eye",    "lat":27.7172, "lng":85.3240, "location":"Kathmandu, Nepal"},
    {"id":"GR-01","name":"Athens Alert",     "lat":37.9838, "lng":23.7275, "location":"Athens, Greece"},
    {"id":"MX-01","name":"Mexico City Web",  "lat":19.4326, "lng":-99.1332,"location":"Mexico City, Mexico"},
]

def generate_event(sensor):
    r = random.random()
    if   r < 0.01:  mag = random.uniform(6.0, 8.5);  depth = random.uniform(5, 30)
    elif r < 0.05:  mag = random.uniform(4.5, 6.0);  depth = random.uniform(10, 60)
    elif r < 0.20:  mag = random.uniform(2.5, 4.5);  depth = random.uniform(15, 80)
    else:           mag = random.uniform(0.5, 2.5);  depth = random.uniform(5, 150)
    return {
        "sensor_id":   sensor["id"],
        "sensor_name": sensor["name"],
        "location":    sensor["location"],
        "lat":  round(sensor["lat"] + random.uniform(-0.3, 0.3), 4),
        "lng":  round(sensor["lng"] + random.uniform(-0.3, 0.3), 4),
        "magnitude": round(mag, 2),
        "depth":     round(depth, 1),
        "timestamp": datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    }

def get_sensors():
    return SENSORS
