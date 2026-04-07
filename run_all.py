import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from dashboard.app import socketio, app

if __name__ == '__main__':
    port = int(os.getenv('DASHBOARD_PORT', 5000))
    print(f"""
╔══════════════════════════════════════════════════╗
║  🌍  EarthSense — Seismic Alert System          ║
║  Open your browser at: http://localhost:{port}     ║
║  Press Ctrl+C to stop                           ║
╚══════════════════════════════════════════════════╝
""")
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
