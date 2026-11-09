import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const dbPath = join(dataDir, 'appmodel.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// --- Schema ---
db.exec(`
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  cogs REAL NOT NULL DEFAULT 0,
  otc_enabled INTEGER NOT NULL DEFAULT 1,
  default_otc_price REAL NOT NULL DEFAULT 0,
  mrc_enabled INTEGER NOT NULL DEFAULT 1,
  default_daily_fee REAL NOT NULL DEFAULT 0,
  default_daily_incentive REAL NOT NULL DEFAULT 0,
  default_active_days INTEGER NOT NULL DEFAULT 22,
  default_active_rate REAL NOT NULL DEFAULT 50,
  default_setup_fee REAL NOT NULL DEFAULT 0,
  default_program_period INTEGER NOT NULL DEFAULT 12,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS simulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  scheme TEXT NOT NULL,
  total_unit INTEGER NOT NULL,
  program_period INTEGER NOT NULL,
  otc_price REAL,
  daily_fee REAL,
  daily_incentive REAL,
  setup_fee REAL DEFAULT 0,
  active_days INTEGER,
  active_rate REAL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`)

// --- Default settings ---
const upsertSetting = db.prepare(`
  INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO NOTHING
`)
upsertSetting.run('bep_threshold_months', '10')

// --- Migrations: add columns if missing ---
const cols = db.prepare("PRAGMA table_info(devices)").all()
if (!cols.some(c => c.name === 'cogs_mrc')) {
  db.exec('ALTER TABLE devices ADD COLUMN cogs_mrc REAL NOT NULL DEFAULT 0')
}
if (!cols.some(c => c.name === 'default_setup_fee')) {
  db.exec('ALTER TABLE devices ADD COLUMN default_setup_fee REAL NOT NULL DEFAULT 0')
}
// price_tiers: JSON array [{min_qty, price}] — harga grosir dalam USD
if (!cols.some(c => c.name === 'price_tiers')) {
  db.exec("ALTER TABLE devices ADD COLUMN price_tiers TEXT NOT NULL DEFAULT '[]'")
}

export default db
