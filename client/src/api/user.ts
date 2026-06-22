import request from './request'

// 用户注册
export function registerApi(username: string, phone: string, password: string) {
  return request.post('/api/user/register', {
    username,
    phone,
    password
  })
}

// 用户登录
export function loginApi(username: string, password: string) {
  return request.post('/api/user/login', {
    username,
    password
  })
}
