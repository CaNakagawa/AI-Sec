PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS labs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL DEFAULT 'vulnerable' CHECK (mode IN ('vulnerable', 'protected')),
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  owner TEXT NOT NULL CHECK (owner IN ('alex','sam')),
  body TEXT NOT NULL,
  is_seed INTEGER NOT NULL DEFAULT 0 CHECK (is_seed IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_notes_lab_owner ON notes (lab_id, owner);
CREATE INDEX IF NOT EXISTS idx_labs_created ON labs (created_at);
