/**
 * NivenX Assistant - Database Layer (Node.js built-in SQLite)
 * Uses the built-in `node:sqlite` module (Node.js 22.5+).
 * Schema is designed for easy migration to PostgreSQL later.
 */

import { DatabaseSync } from 'node:sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = join(DATA_DIR, 'nivenx.db');

let db;

/**
 * Initialize the database and create tables if they don't exist.
 */
export function initDatabase() {
  db = new DatabaseSync(DB_PATH);

  // Enable WAL mode for better performance
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  createTables();
  console.log('[Database] Initialized at', DB_PATH);
  return db;
}

/**
 * Get the database instance.
 */
export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

/**
 * Create all required tables.
 */
function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      user_tag TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_label TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      price REAL,
      notes TEXT,
      coupon_code TEXT,
      discount_amount REAL DEFAULT 0,
      ticket_channel_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT UNIQUE NOT NULL,
      channel_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      user_tag TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      category TEXT NOT NULL,
      subject TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      order_id TEXT,
      transcript TEXT,
      closed_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      closed_at TEXT,
      last_activity TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid',
      due_date TEXT,
      paid_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(order_id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_tag TEXT NOT NULL,
      order_id TEXT,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(order_id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      max_uses INTEGER DEFAULT 1,
      uses INTEGER DEFAULT 0,
      expires_at TEXT,
      created_by TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_tag TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS counters (
      name TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO counters (name, value) VALUES ('orders', 0);
    INSERT OR IGNORE INTO counters (name, value) VALUES ('tickets', 0);
    INSERT OR IGNORE INTO counters (name, value) VALUES ('invoices', 0);
  `);
}
