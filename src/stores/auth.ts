/**
 * 登录态管理。
 *
 * 刻意不使用 pinia：这里只有 token + 一个管理员对象，
 * 一个 reactive 对象足够，还能少一个需要跟随大版本升级的依赖。
 */

import { computed, reactive } from 'vue'

import { adminLogin, fetchAdminMe } from '@/api/auth'
import type { AdminInfo } from '@/api/types'
import {
  clearAuthStorage,
  getAdminInfo,
  getToken,
  setAdminInfo,
  setToken,
} from '@/utils/token'

export const authState = reactive({
  token: getToken(),
  admin: getAdminInfo() as AdminInfo | null,
})

export const isLoggedIn = computed(() => Boolean(authState.token))

/** 管理员显示名，优先 display_name，回退到 username */
export const displayName = computed(
  () => authState.admin?.display_name || authState.admin?.username || '管理员',
)

export function setAuth(token: string, admin: AdminInfo): void {
  authState.token = token
  authState.admin = admin
  setToken(token)
  setAdminInfo(admin)
}

export function clearAuth(): void {
  authState.token = ''
  authState.admin = null
  clearAuthStorage()
}

/** 登录并写入本地存储 */
export async function login(username: string, password: string): Promise<AdminInfo> {
  const result = await adminLogin(username, password)
  setAuth(result.token, result.admin)
  return result.admin
}

/** 用后端返回的最新资料刷新本地缓存（token 失效时由拦截器接管跳转） */
export async function refreshProfile(): Promise<AdminInfo> {
  const admin = await fetchAdminMe()
  authState.admin = admin
  setAdminInfo(admin)
  return admin
}
