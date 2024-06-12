import type { DBDescribe, Identifiable } from '~/types/entity'
import Repository from '~/database/repository'

export interface DBUser extends Identifiable {
  discord_id: string
}

export default <DBDescribe<DBUser>>{
  table: 'app_user',
  fields: {
    discord_id: {
      type: 'text',
      nullable: false,
      unique: true,
    },
  },
}

export const UserRepository = new Repository<DBUser>('app_user')
