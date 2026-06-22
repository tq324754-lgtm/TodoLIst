export interface Collection {
  _id: string
  name: string
  userId?: string
  createdAt?: string
  updatedAt?: string
  todoCount?: number
}

export interface CollectionStatistics {
  name: string
  total: number
  completed: number
  rate: number
}

export interface CollectionTodo {
  _id: string
  text: string
  done: boolean
  collectionId: string
  userId?: string
  createdAt?: string
}
