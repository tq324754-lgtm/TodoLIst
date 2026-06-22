import request from './request'
import type { Collection, CollectionStatistics } from '@/types/collection'

const BASE_URL = '/api/collections'

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export function getCollections(userId: string) {
  return request.get<ApiResponse<Collection[]>>(BASE_URL, { params: { userId } })
}

export function getCollectionById(id: string) {
  return request.get<ApiResponse<Collection>>(`${BASE_URL}/${id}`)
}

export function createCollection(data: { name: string; userId: string }) {
  return request.post<ApiResponse<Collection>>(BASE_URL, data)
}

export function updateCollection(id: string, data: { name: string }) {
  return request.put<ApiResponse<Collection>>(`${BASE_URL}/${id}`, data)
}

export function deleteCollection(id: string) {
  return request.delete<ApiResponse<Record<string, never>>>(`${BASE_URL}/${id}`)
}

export function getCollectionStatistics(id: string) {
  return request.get<ApiResponse<CollectionStatistics>>(`${BASE_URL}/${id}/statistics`)
}

// 所有待办集统计（饼图）
export function getAllCollectionStats(userId?: string) {
  return request.get(`${BASE_URL}/all-statistics`, { 
    params: userId ? { userId } : {} 
  })
}
