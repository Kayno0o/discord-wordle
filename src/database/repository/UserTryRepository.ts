import type { DBUserTry } from '../../types/entity'
import Repository from './repository'

export const UserTryRepository = new Repository<DBUserTry>('user_try')
