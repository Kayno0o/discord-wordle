import type { DBDescribe, Identifiable } from '~/types/entity'
import Repository from '~/database/repository'

export interface DBUserTry extends Identifiable {
  user_id: number
  word_id: number
  guess: string
}

export default <DBDescribe<DBUserTry>>{
  table: 'user_try',
  fields: {
    user_id: {
      type: 'text',
      nullable: false,
      reference: 'app_user',
    },
    word_id: {
      type: 'text',
      nullable: false,
      reference: 'word',
    },
    guess: {
      type: 'text',
      nullable: false,
    },
  },
}

export const UserTryRepository = new Repository<DBUserTry>('user_try')
