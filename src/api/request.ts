/**
 * axios 实例 + 统一响应处理。
 *
 * 后端所有响应都是 {code, status, data} 信封，成功时 code=0。
 * 这里把信封拆掉，业务代码直接拿到 data；
 * 失败统一弹 Element Plus 的 message，401 自动清凭证并跳登录。
 */

import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

import type { ApiEnvelope } from '@/api/types'
import { clearAuthStorage, getToken } from '@/utils/token'

const http = axios.create({
  // 开发期为空字符串：走 vite proxy，浏览器视角同源
  baseURL: import.meta.env.VITE_API_BASE || '',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function redirectToLogin(): void {
  clearAuthStorage()
  const current = window.location.pathname + window.location.search
  if (!current.startsWith('/login')) {
    window.location.href = `/login?redirect=${encodeURIComponent(current)}`
  }
}

function pickMessage(body: ApiEnvelope<unknown> | undefined, fallback: string): string {
  if (!body) return fallback
  if (typeof body.message === 'string' && body.message) return body.message
  if (typeof body.detail === 'string' && body.detail) return body.detail
  return fallback
}

http.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope<unknown>>) => {
    const body = response.data
    // 只要带了 code 字段就按信封处理，避免后端返回 200 但业务失败被当成功
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) {
        return body.data
      }
      const message = pickMessage(body, '请求失败')
      ElMessage.error(message)
      return Promise.reject(new Error(message))
    }
    return body
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status
    const body = error.response?.data
    const fallback = error.code === 'ECONNABORTED' ? '请求超时' : '网络异常，请检查后端是否已启动'
    const message = pickMessage(body, fallback)

    if (status === 401) {
      ElMessage.error(message || '登录已过期，请重新登录')
      redirectToLogin()
    } else if (status === 403) {
      ElMessage.error(message || '没有操作权限')
    } else {
      ElMessage.error(message)
    }
    return Promise.reject(error)
  },
)

/**
 * 由于拦截器已经把信封拆掉，这里的返回类型是 Promise<T> 而不是 AxiosResponse。
 * 用一层包装把类型对齐，业务代码无需再 as any。
 */
export function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return http.get(url, config) as unknown as Promise<T>
}

export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return http.post(url, data, config) as unknown as Promise<T>
}

export function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return http.patch(url, data, config) as unknown as Promise<T>
}

export function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return http.delete(url, config) as unknown as Promise<T>
}

export default http
