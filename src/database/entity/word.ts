import Repository from '~/database/repository'
import type { DBDescribe, Identifiable } from '~/types/entity'

export interface DBWord extends Identifiable {
  word: string
  day: string
  length: number
  difficulty: string
}

export default <DBDescribe<DBWord>>{
  table: 'word',
  fields: {
    day: {
      type: 'text',
      nullable: false,
    },
    difficulty: {
      type: 'text',
      nullable: false,
    },
    word: {
      type: 'text',
      nullable: false,
    },
    length: {
      type: 'int',
      nullable: false,
    },
  },
  uniques: [['day', 'length']],
}

export const WordRepository = new Repository<DBWord>('word')
