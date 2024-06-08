import { Database } from 'bun:sqlite'

export const db = new Database('./assets/db.sqlite')

export function initDB() {
  db.run(`CREATE TABLE IF NOT EXISTS server (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL
);`)
}
