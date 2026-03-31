import { defineStore } from 'pinia'
import { ref, watch} from 'vue'

export type Todo = {
  id: number
  text: string
  done: boolean
}

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])

  //监听 todos 改变，写入 localStorage
  watch(
    todos,
    (newVal) => {
      localStorage.setItem("todos", JSON.stringify(newVal))
    },
    { deep: true }
  )

  //初始化
  const init = () => {
    const saved = localStorage.getItem('todos')
    if (saved) {
      todos.value = JSON.parse(saved)
    }
  }

  // 添加任务
  const addTodo = (todo: Todo) => {
    todos.value.push(todo)
  }

  // 删除任务
  const removeTodo = (id: number) => {
    todos.value = todos.value.filter(todo => todo.id !== id)
  }

  // 清空已完成任务
  const clearDone = () => {
    todos.value = todos.value.filter(t => !t.done)
  }

  return {
    todos,
    init,
    addTodo,
    removeTodo,
    clearDone
  }
})
