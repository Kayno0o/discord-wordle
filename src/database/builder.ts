import type { SQLQueryBindings } from 'bun:sqlite'
import type { PartialRecord } from '@kaynooo/js-utils'
import type { EntityBody, Identifiable } from '../types/entity'

export interface QueryOptions<T extends object> {
  where?: PartialRecord<keyof T, string | number>
  notNull?: PartialRecord<keyof T, boolean>
}

export function buildWhere<T extends object>(options: QueryOptions<T>): [string, SQLQueryBindings[]] {
  const where: string[] = []
  const params: SQLQueryBindings[] = []

  if (options.where) {
    where.push(...Object.keys(options.where).map(key => `${key} = ?`))
    params.push(...Object.values(options.where) as SQLQueryBindings[])
  }

  if (options.notNull) {
    where.push(...Object.entries(options.notNull).map(([key, value]) => value ? `${key} IS NOT NULL` : `${key} IS NULL`))
  }

  if (where.length)
    return [` WHERE ${where.join(' AND ')} `, params]

  return ['', []]
}

export function buildSelectQuery<T extends object>(tableName: string, options?: QueryOptions<T>): [string, SQLQueryBindings[]] {
  let query = `SELECT * FROM ${tableName}`
  const params: SQLQueryBindings[] = []

  if (options) {
    const [whereQuery, whereParams] = buildWhere<T>(options)
    params.push(...whereParams)
    query += whereQuery
  }

  return [query, params]
}

export function buildUpdateQuery<T extends Identifiable>(tableName: string, entity: Partial<EntityBody<T>>, options?: QueryOptions<T>): [string, SQLQueryBindings[]] {
  const params: SQLQueryBindings[] = []

  const entries = Object.entries(entity).filter(([key]) => key !== 'id')
  if (!entries.length)
    return ['', []]

  let query: string
  params.push(...entries.map(([, value]) => value) as SQLQueryBindings[])

  if (options) {
    query = `UPDATE ${tableName} SET ${entries.map(([key]) => `${key} = ?`).join(', ')}`

    const [whereQuery, whereParams] = buildWhere<T>(options)
    params.push(...whereParams)
    query += whereQuery
  }
  else {
    query = `INSERT INTO ${tableName} (${entries.map(([key]) => key).join(', ')}) VALUES (${entries.map(() => `?`).join(', ')})`
  }

  return [query, params]
}
