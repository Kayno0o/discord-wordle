import Repository from '~/database/repository'
import type { DBDescribe, Identifiable } from '~/types/entity'

export interface DBServer extends Identifiable {
  guild_id: string
}

export default <DBDescribe<DBServer>>{
  table: 'server',
  fields: {
    guild_id: {
      type: 'text',
      nullable: false,
    },
  },
}

export const ServerRepository = new Repository<DBServer>('word')
