import smtplib, os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()

FROM    = os.getenv('ALERT_EMAIL_FROM','')
PASSWD  = os.getenv('ALERT_EMAIL_PASSWORD','')
TO      = os.getenv('ALERT_EMAIL_TO','')
_limits = {}

def _can_send(sid):
    now = datetime.now()
    if sid in _limits and now - _limits[sid] < timedelta(minutes=5):
        return False
    _limits[sid] = now
    return True

def _html(e):
    c = '#ff2244' if e['severity']=='CRITICAL' else '#ff8800'
    ico = '🚨' if e['severity']=='CRITICAL' else '⚠️'
    ml  = f"https://maps.google.com/?q={e['lat']},{e['lng']}"
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:'Segoe UI',Arial,sans-serif;background:#030308;color:#e8e8ff}}
.wrap{{max-width:600px;margin:0 auto;padding:20px}}
.hdr{{background:linear-gradient(135deg,{c},#ff8c00);padding:40px;border-radius:16px 16px 0 0;text-align:center}}
.hdr h1{{font-size:28px;font-weight:900;color:#fff;letter-spacing:3px}}
.hdr p{{font-size:12px;color:rgba(255,255,255,.8);margin-top:6px;letter-spacing:4px}}
.body{{background:#0d0d24;padding:30px;border:1px solid rgba(255,255,255,.08)}}
.mag{{text-align:center;padding:28px;background:rgba(255,34,68,.1);border-radius:12px;margin:20px 0;border:1px solid {c}}}
.mag-val{{font-size:80px;font-weight:900;color:{c};line-height:1}}
.mag-lbl{{font-size:11px;color:#8888aa;letter-spacing:4px;margin-top:6px}}
.grid{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:20px 0}}
.box{{background:rgba(255,255,255,.05);padding:18px 12px;border-radius:10px;text-align:center;border:1px solid rgba(255,255,255,.06)}}
.bv{{font-size:20px;font-weight:700;color:{c}}}
.bl{{font-size:10px;color:#8888aa;letter-spacing:2px;margin-top:4px}}
.loc{{background:rgba(255,255,255,.03);padding:18px;border-radius:10px;border-left:4px solid {c};margin:20px 0}}
.loc h3{{font-size:10px;color:#8888aa;letter-spacing:3px;margin-bottom:8px}}
.loc p{{font-size:18px;font-weight:600}}
.loc a{{color:{c};text-decoration:none;font-size:13px}}
.cta{{text-align:center;margin:25px 0}}
.cta a{{background:linear-gradient(135deg,{c},#ff8c00);color:#fff;padding:14px 36px;text-decoration:none;border-radius:50px;font-weight:700;font-size:14px;letter-spacing:1px}}
.ftr{{background:#07071a;padding:16px;text-align:center;border-radius:0 0 16px 16px;border-top:1px solid rgba(255,255,255,.05)}}
.ftr p{{font-size:10px;color:#444466;margin-top:4px}}
</style></head><body><div class="wrap">
<div class="hdr"><h1>{ico} SEISMIC ALERT</h1><p>{e['severity']} • EARTHSENSE MONITORING SYSTEM</p></div>
<div class="body">
<div class="mag"><div class="mag-val">{e['magnitude']:.1f}</div><div class="mag-lbl">RICHTER SCALE MAGNITUDE</div></div>
<div class="grid">
<div class="box"><div class="bv">{e['depth']:.1f} km</div><div class="bl">DEPTH</div></div>
<div class="box"><div class="bv">{e['sensor_id']}</div><div class="bl">SENSOR</div></div>
<div class="box"><div class="bv">{e['timestamp'][11:19]}</div><div class="bl">TIME UTC</div></div>
</div>
<div class="loc"><h3>📍 EPICENTER LOCATION</h3><p>{e['location']}</p><br><a href="{ml}">View on Google Maps →</a></div>
<div class="cta"><a href="http://localhost:5000">🖥️ Open Live Dashboard</a></div>
</div>
<div class="ftr"><p>EarthSense Seismic Monitoring — Auto-generated alert</p><p>{e['timestamp']} UTC • Rate-limited: 1 alert / sensor / 5 min</p></div>
</div></body></html>"""

def send_alert(e):
    if not FROM or not PASSWD or not TO:
        print(f"[ALERTER] Email not configured — skipping {e['sensor_id']}"); return False
    if not _can_send(e['sensor_id']):
        print(f"[ALERTER] Rate-limited — {e['sensor_id']}"); return False
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"{'🚨' if e['severity']=='CRITICAL' else '⚠️'} {e['severity']} — M{e['magnitude']:.1f} at {e['location']}"
        msg['From']    = f"EarthSense Alerts <{FROM}>"
        msg['To']      = TO
        msg.attach(MIMEText(_html(e), 'html'))
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as s:
            s.login(FROM, PASSWD)
            s.sendmail(FROM, TO, msg.as_string())
        print(f"[ALERTER] ✅ Email sent — {e['sensor_id']} M{e['magnitude']:.1f}"); return True
    except Exception as ex:
        print(f"[ALERTER] ❌ Failed: {ex}"); return False
