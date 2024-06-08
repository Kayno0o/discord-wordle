import { db, queryAll, queryOne, runQuery } from '..'
import type { EntityBody, Identifiable } from '../../types/entity'
import { type QueryOptions, buildSelectQuery, buildUpdateQuery } from '../builder'

export default class Controller<T extends Identifiable> {
  tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  findAllBy(options: QueryOptions<T>) {
    const [query, params] = buildSelectQuery<T>(this.tableName, options)
    return queryAll<T>(query, params)
  }

  findAll() {
    const [query, params] = buildSelectQuery<T>(this.tableName)
    return queryAll<T>(query, params)
  }

  findOneBy(options: QueryOptions<T>) {
    const [query, params] = buildSelectQuery<T>(this.tableName, options)
    return queryOne<T>(query, params)
  }

  findById(id: number): T | null {
    const [query, params] = buildSelectQuery<T>(this.tableName, { where: { id } })
    return queryOne<T>(query, params)
  }

  create(entity: EntityBody<T>) {
    const [query, params] = buildUpdateQuery<T>(this.tableName, entity)
    runQuery(query, params)
    const lastId = db.query<{ id: number }, any>('SELECT last_insert_rowid() as id').get()!
    return this.findById(lastId.id)!
  }

  update(id: number, entity: Partial<EntityBody<T>>) {
    const [query, params] = buildUpdateQuery<T>(this.tableName, entity, { where: { id } })
    runQuery(query, params)
    return this.findById(id)!
  }
}
