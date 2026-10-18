import axios from 'axios'
import { getToken, removeToken } from '@/utils/auth'

const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '', timeout: 20000 })
http.interceptors.request.use(config => {
  const token = getToken()
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  if (config.method === 'get' && config.params) {
    const query = new URLSearchParams(config.params).toString()
    if (query) config.url += `${config.url.includes('?') ? '&' : '?'}${query}`
    config.params = undefined
  }
  return config
})
http.interceptors.response.use(response => {
  const body = response.data
  if (body?.code === 401) {
    removeToken()
    if (location.pathname !== '/login') location.href = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
    return Promise.reject(new Error(body.msg || '登录状态已过期'))
  }
  if (body && typeof body === 'object' && 'code' in body && body.code !== 200) {
    return Promise.reject(new Error(body.msg || '请求失败'))
  }
  return body && typeof body === 'object' && body.code === 200 ? body : body
}, error => {
  if (error.response?.status === 401) {
    removeToken()
    if (location.pathname !== '/login') location.href = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
  }
  const message = error.response?.data?.msg || error.response?.data?.error || error.message || '网络请求失败'
  return Promise.reject(new Error(message))
})

export default http
