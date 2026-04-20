import { defineStore } from 'pinia'
import type { Todo } from '@/types/todo'
import { getTodos, addTodoApi, deleteTodoApi, updateTodoApi } from '@/api/todo'
import { ElMessage } from 'element-plus'

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: [] as Todo[],
    list: [] as Array<{ id: string; title: string; completed: boolean}>
  }),

  actions: {
    //初始化
    async fetchTodos() {
      const res = await getTodos()
      this.todos = res.data
    },

    //添加
    async addTodo(text: string) {
      const res = await addTodoApi(text)
      this.todos.push(res.data)
    },

    //删除
    async removeTodo(id: number) {
      await deleteTodoApi(id)
      this.todos = this.todos.filter((t) => t.id !== id)
    },

    //编辑
    async updateTodo(todo: Todo, text: string) {
      await updateTodoApi(todo.id, { text })
      todo.text = text
    },

    //切换完成状态
    async toggleTodo(todo: Todo) {
      await updateTodoApi(todo.id, { done: !todo.done })
      todo.done = !todo.done
    },
    //修改
    async updateTodoTextAndDone(id: number, text: string, done: boolean) {
      await updateTodoApi(id, { text, done })
      const todo = this.todos.find(t => t.id === id)
      if (todo) {
        todo.text = text
        todo.done = done
      }
    }
  },

  //持久化
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'todo-store',
        storage: localStorage,
      },
    ],
  },
})
