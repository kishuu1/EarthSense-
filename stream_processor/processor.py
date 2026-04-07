import os
from dotenv import load_dotenv
load_dotenv()

WARN_THRESH  = float(os.getenv('MAGNITUDE_WARNING_THRESHOLD',  4.5))
CRIT_THRESH  = float(os.getenv('MAGNITUDE_CRITICAL_THRESHOLD', 6.0))
_last = {}

def classify(mag):
    if   mag >= CRIT_THRESH: return 'CRITICAL'
    elif mag >= WARN_THRESH:  return 'WARNING'
    return 'NORMAL'

def process_event(raw):
    mag = raw['magnitude']; sid = raw['sensor_id']
    spike = round(mag - _last.get(sid, mag), 2)
    _last[sid] = mag
    severity = classify(mag)
    if spike > 2.0 and severity == 'NORMAL':
        severity = 'WARNING'
    return {**raw, 'severity': severity, 'spike': spike,
            'should_alert': severity in ['WARNING','CRITICAL'], 'alert_sent': False}
