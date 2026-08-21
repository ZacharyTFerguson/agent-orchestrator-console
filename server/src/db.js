import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Open (and create if needed) the SQLite database that persists agents,
 * chat messages, heartbeats and cron runs. Pass ":memory:" for tests.
 */
export function openDatabase(dbPath = process.env.DB_PATH || resolve(__dirname, "../../data/orchestrator.db")) {
  if (dbPath !== ":memory:") {
    mkdirSync(dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      emoji TEXT NOT NULL DEFAULT '🤖',
      heartbeat_seconds INTEGER NOT NULL DEFAULT 10,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      agent_id TEXT,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS heartbeats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'alive',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cron_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      task TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ok',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS oil_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT,
      overdue_count INTEGER NOT NULL DEFAULT 0,
      suspect_count INTEGER NOT NULL DEFAULT 0,
      backward_count INTEGER NOT NULL DEFAULT 0,
      report TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_heartbeats_agent ON heartbeats(agent_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_cron_runs_agent ON cron_runs(agent_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_oil_reports_created ON oil_reports(created_at);
  `);

  return db;
}
