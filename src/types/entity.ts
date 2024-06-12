export interface DBField {
  type: 'bool' | 'int' | 'float' | 'text' | 'blob'
  nullable?: boolean
  primary?: boolean
  unique?: boolean
  reference?: string | { table: string, key: string }
}

export interface DBDescribe<T extends Identifiable> {
  table: string
  fields: Record<keyof Omit<T, 'id'>, DBField>
  uniques?: (keyof T)[][]
}

export interface Identifiable {
  id: number
}
