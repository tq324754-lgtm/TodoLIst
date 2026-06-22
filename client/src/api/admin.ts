import request from './request'

// 获取管理员仪表盘数据
export function getAdminDashboard() {
  return request.get('/api/admin/dashboard')
}

// 获取用户列表（分页 + 搜索）
export function getUsers(params: { page?: number; pageSize?: number; search?: string }) {
  return request.get('/api/admin/users', { params })
}

// 创建用户
export function createUser(data: { username: string; phone: string; password: string; role?: string }) {
  return request.post('/api/admin/users', data)
}

// 编辑用户
export function updateUser(id: string, data: { username?: string; phone?: string; role?: string; status?: string }) {
  return request.put(`/api/admin/users/${id}`, data)
}

// 重置用户密码
export function resetUserPassword(id: string, newPassword: string) {
  return request.put(`/api/admin/users/${id}/password`, { newPassword })
}

// 切换用户角色
export function toggleUserRole(id: string) {
  return request.patch(`/api/admin/users/${id}/role`)
}

// 启用/禁用用户
export function toggleUserStatus(id: string) {
  return request.patch(`/api/admin/users/${id}/status`)
}

// 删除用户
export function deleteUser(id: string) {
  return request.delete(`/api/admin/users/${id}`)
}
