import Repository from '~/database/repository'
import type { DBDescribe, Identifiable } from '~/types/entity'

export type WordDifficulty = 'easy' | 'normal' | 'hard'

export interface DBWord extends Identifiable {
  word: string
  day: string
  length: number
  difficulty: WordDifficulty
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
  uniques: [['day', 'length', 'difficulty']],
}

export const WordRepository = new Repository<DBWord>('word')
