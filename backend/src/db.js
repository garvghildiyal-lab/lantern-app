const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'lantern.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS circles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    circle_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    circle_id INTEGER NOT NULL,
    sender_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    location_area TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by TEXT,
    acknowledged_at DATETIME,
    FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE
  );
`);

try {
  db.exec("ALTER TABLE signals ADD COLUMN location_area TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE members ADD COLUMN last_seen DATETIME;");
} catch (e) {}

module.exports = db;
