import { defineStore } from 'pinia'
import type { Todo } from '@/types/todo'
import { getTodos, addTodoApi, deleteTodoApi, updateTodoApi } from '@/api/todo'
import { useUserStore } from './user'

interface TodoState {
  todos: Todo[]
}

export const useTodoStore = defineStore('todo', {
  state: (): TodoState => ({
    todos: []
  }),
  actions: {
    // 本地操作方法
    initTodos(todos: Todo[]) {
      this.todos = todos
    },
    addTodoLocal(todo: Todo) {
      this.todos.push(todo)
    },
    removeTodoLocal(id: number) {
      this.todos = this.todos.filter(t => t.id !== id)
    },
    toggleTodoLocal(todo: Todo) {
      const target = this.todos.find(t => t.id === todo.id)
      if (target) {
        target.done = !target.done
      }
    },
    updateTodoTextAndDoneLocal(id: number, text: string, done: boolean, endTime: number) {
      const target = this.todos.find(t => t.id === id)
      if (target) {
        target.text = text
        target.done = done
        target.endTime = endTime
      }
    },

    // 云端API方法
    async fetchTodos() {
      try {
        const userStore = useUserStore()
        if (userStore.isLoggedIn) {
          const response = await getTodos()
          this.initTodos(response.data)
        } else {
          // 未登录，使用本地存储
          const localTodos = localStorage.getItem('todos')
          if (localTodos) {
            this.initTodos(JSON.parse(localTodos))
          }
        }
      } catch (error) {
        console.error('获取待办事项失败:', error)
      }
    },

    async addTodo(text: string) {
      try {
        const userStore = useUserStore()
        if (userStore.isLoggedIn) {
          const response = await addTodoApi(text)
          this.addTodoLocal(response.data)
          return response.data
        } else {
          // 未登录，使用本地存储
          const newTodo = {
            id: Date.now(),
            text,
            done: false,
            endTime: 0
          }
          this.addTodoLocal(newTodo)
          // 保存到本地存储
          localStorage.setItem('todos', JSON.stringify(this.todos))
          return newTodo
        }
      } catch (error) {
        console.error('添加待办事项失败:', error)
        throw error
      }
    },

    async deleteTodo(id: number) {
      try {
        const userStore = useUserStore()
        if (userStore.isLoggedIn) {
          await deleteTodoApi(id)
          this.removeTodoLocal(id)
        } else {
          // 未登录，使用本地存储
          this.removeTodoLocal(id)
          // 保存到本地存储
          localStorage.setItem('todos', JSON.stringify(this.todos))
        }
      } catch (error) {
        console.error('删除待办事项失败:', error)
        throw error
      }
    },

    async updateTodo(id: number, data: Partial<Todo>) {
      try {
        const userStore = useUserStore()
        if (userStore.isLoggedIn) {
          const response = await updateTodoApi(id, data)
          if (response.data) {
            const index = this.todos.findIndex(t => t.id === id)
            if (index !== -1) {
              this.todos[index] = response.data
            }
          }
          return response.data
        } else {
          // 未登录，使用本地存储
          const index = this.todos.findIndex(t => t.id === id)
          if (index !== -1) {
              if (data.text !== undefined) this.todos[index]!.text = data.text
            if (data.done !== undefined) this.todos[index]!.done = data.done
            if (data.endTime !== undefined) this.todos[index]!.endTime = data.endTime
            // 保存到本地存储
            localStorage.setItem('todos', JSON.stringify(this.todos))
          }
          return this.todos[index]
        }
      } catch (error) {
        console.error('更新待办事项失败:', error)
        throw error
      }
    }
  },
  persist: true // 添加持久化功能
})
