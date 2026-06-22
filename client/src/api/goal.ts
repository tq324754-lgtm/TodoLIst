import request from './request'
import type { Goal, GoalForm } from '@/types/goal'

const BASE_URL = '/api/goals'

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export function getGoals(userId: string) {
  return request.get<ApiResponse<Goal[]>>(BASE_URL, { params: { userId } })
}

export function createGoal(data: GoalForm & { userId: string }) {
  return request.post<ApiResponse<Goal>>(BASE_URL, data)
}

export function updateGoal(id: string, data: GoalForm) {
  return request.put<ApiResponse<Goal>>(`${BASE_URL}/${id}`, data)
}

export function deleteGoal(id: string) {
  return request.delete<ApiResponse<Record<string, never>>>(`${BASE_URL}/${id}`)
}
