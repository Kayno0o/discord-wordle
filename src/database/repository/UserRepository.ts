import type { DBUser } from '../../types/entity'
import Repository from './repository'

export const UserRepository = new Repository<DBUser>('app_user')
