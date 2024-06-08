export type EntityBody<T extends Identifiable> = Omit<T, 'id'>

export interface Identifiable {
  id: number
}

export interface DBWord extends Identifiable {
  word: string
  day: string
  length: number
}

export interface DBUserTry extends Identifiable {
  user_id: number
  word_id: number
  guess: string
}

export interface DBUser extends Identifiable {
  discord_id: string
}
