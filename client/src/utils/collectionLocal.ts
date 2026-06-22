import type { Collection, CollectionStatistics, CollectionTodo } from '@/types/collection'

export const COLLECTIONS_KEY = 'collections_local_list'
export const COLLECTION_TODOS_KEY = 'collection_todos_local_list'

export function loadLocalCollections(): Collection[] {
  const raw = localStorage.getItem(COLLECTIONS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Collection[]
  } catch {
    return []
  }
}

export function saveLocalCollections(list: Collection[]) {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(list))
}

export function loadLocalTodos(): CollectionTodo[] {
  const raw = localStorage.getItem(COLLECTION_TODOS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as CollectionTodo[]
  } catch {
    return []
  }
}

export function saveLocalTodos(list: CollectionTodo[]) {
  localStorage.setItem(COLLECTION_TODOS_KEY, JSON.stringify(list))
}

export function attachTodoCounts(collections: Collection[], todos: CollectionTodo[]): Collection[] {
  return collections.map(col => ({
    ...col,
    todoCount: todos.filter(t => t.collectionId === col._id).length
  }))
}

export function getLocalStatistics(collectionId: string, collectionName: string): CollectionStatistics {
  const todos = loadLocalTodos().filter(t => t.collectionId === collectionId)
  const total = todos.length
  const completed = todos.filter(t => t.done).length
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { name: collectionName, total, completed, rate }
}

export function deleteLocalTodosByCollection(collectionId: string) {
  const todos = loadLocalTodos().filter(t => t.collectionId !== collectionId)
  saveLocalTodos(todos)
}
