import Database from 'better-sqlite3';

// Migraciones por PRAGMA user_version. Solo se agregan al final.
const MIGRATIONS = [
  `CREATE TABLE users (
     id INTEGER PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     birth_date TEXT NOT NULL,
     sex TEXT NOT NULL CHECK (sex IN ('hombre','mujer')),
     height_cm REAL NOT NULL,
     fcmax_override INTEGER,
     plan TEXT NOT NULL,
     plan_since TEXT NOT NULL,
     grasa_level TEXT NOT NULL,
     grasa_since TEXT NOT NULL,
     theme TEXT NOT NULL DEFAULT 'tablero',
     plan_dismissed_at TEXT,
     grasa_dismissed_at TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE TABLE sessions (
     id INTEGER PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     date TEXT NOT NULL,
     minutes REAL NOT NULL,
     km REAL NOT NULL,
     hr_avg INTEGER NOT NULL,
     hr_max INTEGER,
     rpe INTEGER,
     note TEXT,
     kind TEXT NOT NULL DEFAULT 'libre' CHECK (kind IN ('libre','grasa')),
     grasa_level TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE INDEX sessions_user_date ON sessions(user_id, date);
   CREATE TABLE weights (
     id INTEGER PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     date TEXT NOT NULL,
     kg REAL NOT NULL,
     UNIQUE (user_id, date)
   );`,
];

export type DB = Database.Database;

export function openDb(file: string): DB {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  const version = db.pragma('user_version', { simple: true }) as number;
  for (let v = version; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
  return db;
}
