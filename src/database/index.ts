import fs from 'node:fs'
import path from 'node:path'
import { Database, type SQLQueryBindings } from 'bun:sqlite'
import chalk from 'chalk'
import { notEmpty } from '@kaynooo/js-utils'
import { loadFiles, loadImport } from '~/utils/loader'
import type { DBDescribe, DBField, Identifiable } from '~/types/entity'

export const db = new Database('./assets/db.sqlite')

export function describeToTable<T extends Identifiable>(describe: DBDescribe<T>): string {
  const lines: string[] = [`CREATE TABLE IF NOT EXISTS ${describe.table} (`, `  id INTEGER PRIMARY KEY AUTOINCREMENT,`]

  for (const [fieldName, field] of Object.entries<DBField>(describe.fields)) {
    let line = `  ${fieldName} ${field.type.toUpperCase()}`
    if (!field.nullable) {
      line += ' NOT NULL'
    }
    if (field.unique) {
      line += ' UNIQUE'
    }
    lines.push(`${line},`)
  }

  for (const [fieldName, field] of Object.entries<DBField>(describe.fields)) {
    if (field.reference) {
      const ref = typeof field.reference === 'string'
        ? { table: field.reference, key: 'id' }
        : field.reference
      lines.push(`  FOREIGN KEY (${fieldName}) REFERENCES ${ref.table}(${ref.key}),`)
    }
  }

  if (describe.uniques) {
    for (const uniqueGroup of describe.uniques) {
      const uniqueFields = Array.isArray(uniqueGroup) ? uniqueGroup.join(', ') : uniqueGroup
      lines.push(`  UNIQUE(${uniqueFields}),`)
    }
  }

  // Remove the last comma
  lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1)
  lines.push(');')

  return lines.join('\n')
}

export async function initDB() {
  const files = loadFiles('src/database/entity').filter(name => name !== 'index.ts')
  const imports = (await Promise.all(files.map(name => loadImport<DBDescribe<any>>(name)))).filter(notEmpty)
  console.log(chalk.cyan('[load]'), imports.length, 'database entities')
  db.run(imports.map(describeToTable).join('\n'))
  fs.writeFileSync(
    path.resolve(process.cwd(), 'src/database/database.json'),
    JSON.stringify(Object.fromEntries(imports.map(i => [i.table, i])), undefined, 2),
  )
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
