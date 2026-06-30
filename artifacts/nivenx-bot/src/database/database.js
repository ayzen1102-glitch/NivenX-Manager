/**
 * NivenX Assistant - Database Layer (Node.js built-in SQLite)
 * Uses the built-in `node:sqlite` module (Node.js 22.5+).
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

export function initDatabase() {
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA synchronous = NORMAL;');
  createTables();
  runMigrations();
  console.log('[Database] Initialized at', DB_PATH);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

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
      assigned_to TEXT,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'unpaid',
      priority TEXT DEFAULT 'normal',
      deadline TEXT,
      rating INTEGER,
      review_requested INTEGER DEFAULT 0,
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
      assigned_to TEXT,
      priority TEXT DEFAULT 'normal',
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

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      method TEXT NOT NULL,
      amount REAL NOT NULL,
      reference TEXT,
      proof_url TEXT,
      status TEXT DEFAULT 'pending',
      verified_by TEXT,
      verified_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
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
      min_order_amount REAL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      points INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      bio TEXT,
      referral_code TEXT UNIQUE,
      referred_by TEXT,
      referral_count INTEGER DEFAULT 0,
      blacklisted INTEGER DEFAULT 0,
      blacklist_reason TEXT,
      notification_dms INTEGER DEFAULT 1,
      last_active TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS points_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      sent INTEGER DEFAULT 0,
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

    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id TEXT UNIQUE NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      votes TEXT DEFAULT '{}',
      voter_ids TEXT DEFAULT '[]',
      created_by TEXT NOT NULL,
      ends_at TEXT,
      ended INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS giveaways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      message_id TEXT,
      prize TEXT NOT NULL,
      host_id TEXT NOT NULL,
      entries TEXT DEFAULT '[]',
      winner_id TEXT,
      ends_at TEXT NOT NULL,
      ended INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      url TEXT,
      image_url TEXT,
      added_by TEXT NOT NULL,
      visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_tag TEXT NOT NULL,
      service TEXT NOT NULL,
      requirements TEXT NOT NULL,
      estimated_price REAL,
      status TEXT DEFAULT 'pending',
      responded_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auto_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trigger TEXT UNIQUE NOT NULL,
      response TEXT NOT NULL,
      created_by TEXT NOT NULL,
      uses INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_tag TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      response TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id TEXT NOT NULL,
      staff_tag TEXT NOT NULL,
      orders_handled INTEGER DEFAULT 0,
      tickets_closed INTEGER DEFAULT 0,
      invoices_created INTEGER DEFAULT 0,
      avg_response_time REAL DEFAULT 0,
      rating REAL DEFAULT 0,
      period TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id TEXT UNIQUE NOT NULL,
      min_price REAL,
      max_price REAL,
      base_price REAL,
      currency TEXT DEFAULT 'USD',
      updated_by TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO counters (name, value) VALUES ('orders', 0);
    INSERT OR IGNORE INTO counters (name, value) VALUES ('tickets', 0);
    INSERT OR IGNORE INTO counters (name, value) VALUES ('invoices', 0);
    INSERT OR IGNORE INTO counters (name, value) VALUES ('quotes', 0);
    INSERT OR IGNORE INTO counters (name, value) VALUES ('polls', 0);
    INSERT OR IGNORE INTO counters (name, value) VALUES ('giveaways', 0);
  `);
}

function runMigrations() {
  const addColumnIfMissing = (table, column, definition) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch {}
  };

  addColumnIfMissing('orders', 'assigned_to', 'TEXT');
  addColumnIfMissing('orders', 'payment_method', 'TEXT');
  addColumnIfMissing('orders', 'payment_status', "TEXT DEFAULT 'unpaid'");
  addColumnIfMissing('orders', 'priority', "TEXT DEFAULT 'normal'");
  addColumnIfMissing('orders', 'deadline', 'TEXT');
  addColumnIfMissing('orders', 'rating', 'INTEGER');
  addColumnIfMissing('orders', 'review_requested', 'INTEGER DEFAULT 0');
  addColumnIfMissing('tickets', 'assigned_to', 'TEXT');
  addColumnIfMissing('tickets', 'priority', "TEXT DEFAULT 'normal'");
  addColumnIfMissing('coupons', 'min_order_amount', 'REAL DEFAULT 0');
  addColumnIfMissing('coupons', 'description', 'TEXT');
}
