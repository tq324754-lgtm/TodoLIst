import axios from 'axios'
import type { Todo } from '@/types/todo'
import request from './request'

const BASE_URL = 'http://localhost:3000'

//获取
export function getTodos() {
  return axios.get<Todo[]>(`${BASE_URL}/todos`)
}

//添加
export function addTodoApi(text: string) {
  return axios.post<Todo>(`${BASE_URL}/todos`, {
    text,
    done: false,
  })
}

//删除
export function deleteTodoApi(id: number) {
  return axios.delete(`${BASE_URL}/todos/${id}`)
}

//修改 状态文本
export function updateTodoApi(id: number, data: Partial<Todo>) {
  return axios.put(`${BASE_URL}/todos/${id}`, data)
}
