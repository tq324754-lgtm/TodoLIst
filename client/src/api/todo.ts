import type { Todo } from '@/types/todo'
import request from './request'

const BASE_URL = '/api'

//获取
export function getTodos() {
  return request.get<Todo[]>(`${BASE_URL}/todos`)
}

//添加
export function addTodoApi(text: string) {
  return request.post<Todo>(`${BASE_URL}/todos`, {
    text,
    done: false,
  })
}

//删除
export function deleteTodoApi(id: number) {
  return request.delete(`${BASE_URL}/todos/${id}`)
}

//修改 状态文本
export function updateTodoApi(id: number, data: Partial<Todo>) {
  return request.put(`${BASE_URL}/todos/${id}`, data)
}

// 今日统计
export function getTodayStats(userId?: string) {
  return request.get(`${BASE_URL}/todos/today-stats`, {
    params: userId ? { userId } : {}
  })
}

export function getWeeklyStats(userId?: string) {
  return request.get(`${BASE_URL}/todos/weekly-stats`, {
    params: userId ? { userId } : {}
  })
}
