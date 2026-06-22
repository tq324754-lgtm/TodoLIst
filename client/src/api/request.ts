import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const request = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  withCredentials: false, // 不发送cookies
  headers: {
    'Content-Type': 'application/json',
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response
      if (status === 401) {
        // 未授权，可能需要重新登录
        ElMessage.error('请先登录')
      } else {
        ElMessage.error(data.message || `请求失败: ${status}`)
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      ElMessage.error('服务器无响应，请检查服务器是否启动')
    } else {
      // 请求设置出错
      ElMessage.error(error.message || '请求失败')
    }
    return Promise.reject(error)
  }
)

export default request
