import { Database, type SQLQueryBindings } from 'bun:sqlite'
import chalk from 'chalk'

export const db = new Database('./assets/db.sqlite')

export function initDB() {
  db.run(`
CREATE TABLE IF NOT EXISTS server (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS word (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,
  length INTEGER NOT NULL,
  word TEXT NOT NULL,
  UNIQUE(day, length)
);

CREATE TABLE IF NOT EXISTS user_try (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  guess TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES app_user(id),
  FOREIGN KEY (word_id) REFERENCES word(id)
);
`)
}

function log(type: string, query: string, params: SQLQueryBindings[]) {
  if (process.env.DEBUG_DB === 'true') {
    console.log(chalk.yellow(`[SQL:${type}]`), query, '|', params.join(', '))
  }
}

function error(type: string, error: Error) {
  console.log(chalk.red(`[SQL:${type}:error]`), error.message)
}

export function queryOne<T>(query: string, params: SQLQueryBindings[] = []): T | null {
  query = query.trim()
  log('one', query, params)

  try {
    return db.prepare<T, any>(query).get(params)
  }
  catch (e: any) {
    error('one', e)
    return null
  }
}

export function queryAll<T>(query: string, params: SQLQueryBindings[] = []): T[] {
  query = query.trim()
  log('all', query, params)

  try {
    return db.prepare<T, any>(query).all(params)
  }
  catch (e: any) {
    error('all', e)
    return [] as T[]
  }
}

export function runQuery(query: string, params: SQLQueryBindings[] = []): void {
  query = query.trim()
  log('run', query, params)

  try {
    db.run(query, params)
  }
  catch (e: any) {
    error('run', e)
  }
}
