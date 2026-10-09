/**
 * token 与管理员信息的本地读写。
 *
 * 单独抽成模块（而不是放在 store 里）是为了打断循环依赖：
 * api/request.ts 需要读 token，而 store 需要调用 api/auth.ts，
 * 如果 token 读写放在 store，就会形成 request → store → api → request 的环。
 */

import type { AdminInfo } from '@/api/types'

const TOKEN_KEY = 'fengshui_admin_token'
const ADMIN_KEY = 'fengshui_admin_info'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getAdminInfo(): AdminInfo | null {
  const raw = localStorage.getItem(ADMIN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminInfo
  } catch {
    // 存储被手工改坏时不应让整个应用白屏
    localStorage.removeItem(ADMIN_KEY)
    return null
  }
}

export function setAdminInfo(admin: AdminInfo): void {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export function clearAuthStorage(): void {
  removeToken()
  localStorage.removeItem(ADMIN_KEY)
}
