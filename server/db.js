const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

function nativeBindingPath() {
  // Under Electron the Node-ABI binding won't load; use the vendored Electron prebuild.
  if (!process.versions.electron) return null;
  const p = path.join(__dirname, '..', 'vendor', 'better_sqlite3-electron.node');
  return fs.existsSync(p) ? p : null;
}

function openDb(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });
  const nativeBinding = nativeBindingPath();
  const db = new Database(path.join(dataDir, 'app.db'), nativeBinding ? { nativeBinding } : {});
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'link',      -- link | header | youtube | email
      title TEXT NOT NULL DEFAULT '',
      url TEXT DEFAULT '',
      thumbnail TEXT DEFAULT '',
      animate INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      start_at TEXT DEFAULT NULL,             -- ISO datetime, optional schedule
      end_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_id INTEGER NOT NULL,
      ts TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      block_id INTEGER,
      ts TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_clicks_block ON clicks(block_id);
    CREATE INDEX IF NOT EXISTS idx_clicks_ts ON clicks(ts);
    CREATE INDEX IF NOT EXISTS idx_views_ts ON views(ts);
  `);

  return db;
}

const DEFAULT_SETTINGS = {
  display_name: 'Your Name',
  bio: 'Welcome to my page',
  avatar: '',
  socials: '{}', // JSON: { instagram: "https://...", ... }
  theme: 'gradient', // gradient | glass | minimal | dark | neon | paper
  accent: '#8b5cf6',
  bg_type: 'theme', // theme | color | gradient | image
  bg_value: '',
  font: 'system', // key from font list
  custom_css: '',
  seo_title: '',
  seo_description: ''
};

function getSettings(db) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

function setSettings(db, obj) {
  const stmt = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const tx = db.transaction((entries) => {
    for (const [k, v] of entries) {
      if (k in DEFAULT_SETTINGS) stmt.run(k, String(v ?? ''));
    }
  });
  tx(Object.entries(obj));
}

module.exports = { openDb, getSettings, setSettings, DEFAULT_SETTINGS };
