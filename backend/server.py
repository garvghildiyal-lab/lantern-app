import os
import sys
import json
import random
import string
import sqlite3
import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

PORT = int(os.environ.get("PORT", 8080))
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "lantern.db")
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS circles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            invite_code TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            circle_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            circle_id INTEGER NOT NULL,
            sender_name TEXT NOT NULL,
            status TEXT CHECK(status IN ('active', 'acknowledged')) DEFAULT 'active',
            acknowledged_by TEXT,
            acknowledged_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    conn.close()

init_db()

class LanternRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        path_str = parsed.path

        if path_str == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ok")
            return

        if path_str.startswith("/api/circles/") and path_str.endswith("/signals"):
            circle_id = path_str.split("/")[3]
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM signals WHERE circle_id = ? ORDER BY id DESC LIMIT 50", (circle_id,))
            signals = [dict(row) for row in cursor.fetchall()]
            conn.close()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(signals).encode('utf-8'))
            return

        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path_str = parsed.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        try:
            data = json.loads(body)
        except Exception:
            data = {}

        if path_str == "/api/circles":
            name = data.get("name", "").strip()
            owner_name = data.get("owner_name", "").strip()
            if not name or not owner_name:
                self.send_json_error(400, "Both name and owner_name are required")
                return

            invite_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("INSERT INTO circles (name, owner_name, invite_code) VALUES (?, ?, ?)", (name, owner_name, invite_code))
            circle_id = cursor.lastrowid
            cursor.execute("INSERT INTO members (circle_id, name) VALUES (?, ?)", (circle_id, owner_name))
            conn.commit()

            cursor.execute("SELECT * FROM circles WHERE id = ?", (circle_id,))
            circle = dict(cursor.fetchone())
            conn.close()

            self.send_json(201, circle)
            return

        if path_str == "/api/circles/join":
            invite_code = data.get("invite_code", "").strip().upper()
            name = data.get("name", "").strip()
            if not invite_code or not name:
                self.send_json_error(400, "Both invite_code and name are required")
                return

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM circles WHERE invite_code = ?", (invite_code,))
            circle_row = cursor.fetchone()
            if not circle_row:
                conn.close()
                self.send_json_error(404, "Invalid invite code")
                return

            circle = dict(circle_row)
            cursor.execute("INSERT INTO members (circle_id, name) VALUES (?, ?)", (circle["id"], name))
            conn.commit()
            conn.close()

            self.send_json(200, {"message": "Joined circle successfully", "circle": circle})
            return

        if path_str == "/api/signals":
            circle_id = data.get("circle_id")
            sender_name = data.get("sender_name", "").strip()
            if not circle_id or not sender_name:
                self.send_json_error(400, "circle_id and sender_name are required")
                return

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("INSERT INTO signals (circle_id, sender_name, status) VALUES (?, ?, 'active')", (circle_id, sender_name))
            signal_id = cursor.lastrowid
            conn.commit()

            cursor.execute("SELECT * FROM signals WHERE id = ?", (signal_id,))
            signal = dict(cursor.fetchone())
            conn.close()

            self.send_json(201, signal)
            return

        if path_str.startswith("/api/signals/") and path_str.endswith("/acknowledge"):
            signal_id = path_str.split("/")[3]
            acknowledged_by = data.get("acknowledged_by", "").strip()
            if not acknowledged_by:
                self.send_json_error(400, "acknowledged_by is required")
                return

            now = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("UPDATE signals SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ? WHERE id = ?", (acknowledged_by, now, signal_id))
            conn.commit()

            cursor.execute("SELECT * FROM signals WHERE id = ?", (signal_id,))
            updated_signal = dict(cursor.fetchone())
            conn.close()

            self.send_json(200, updated_signal)
            return

        self.send_json_error(404, "Not Found")

    def send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def send_json_error(self, status, message):
        self.send_json(status, {"error": message})

if __name__ == "__main__":
    print(f"Lantern Python HTTP & API Server running on port {PORT}")
    server = HTTPServer(("0.0.0.0", PORT), LanternRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()
