PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  avatar_path TEXT,
  banner_path TEXT,
  bio TEXT,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Таблица для логов действий (опционально)
CREATE TABLE IF NOT EXISTS actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER,
  action TEXT,
  meta TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);
