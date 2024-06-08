import type { DBWord } from '../../types/entity'
import Repository from './repository'

export const WordRepository = new Repository<DBWord>('word')
