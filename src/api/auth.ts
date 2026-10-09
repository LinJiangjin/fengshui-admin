import { get, post } from '@/api/request'
import type { AdminInfo, AdminLoginResult } from '@/api/types'

/** 管理员账号密码登录 */
export function adminLogin(username: string, password: string) {
  return post<AdminLoginResult>('/api/v1/admin/login', { username, password })
}

/** 校验当前 token 是否仍然有效，同时拿到最新资料 */
export function fetchAdminMe() {
  return get<AdminInfo>('/api/v1/admin/me')
}
