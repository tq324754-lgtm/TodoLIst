// @/types/todo.ts
export interface Todo {
  _id: string
  text: string
  done: boolean // 新增 done 字段
  completed?: boolean // 可选：保留原来的字段
  endTime?: string
  userId?: string
  collectionId?: string
}

export interface TodoState {
  todos: Todo[]
}
