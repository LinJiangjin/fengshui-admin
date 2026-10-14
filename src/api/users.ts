import { del, get, patch } from '@/api/request'
import type { AdminUserItem, PageResult, UserDetailResult, UserInfo, UserStatus } from '@/api/types'

export interface UserQuery {
  page?: number
  size?: number
  keyword?: string
  /** 空字符串表示全部 */
  status?: UserStatus | ''
}

/** 用户分页列表（支持手机号 / 昵称 / id 模糊搜索） */
export function fetchUsers(params: UserQuery) {
  return get<PageResult<AdminUserItem>>('/api/v1/admin/users', { params })
}

/** 用户详情：资料 + 名下房屋 */
export function fetchUserDetail(userId: string) {
  return get<UserDetailResult>(`/api/v1/admin/users/${encodeURIComponent(userId)}`)
}

/**
 * 封禁 / 解封。
 * 只接受 active / banned：deleted 是用户自助注销后的状态，后台不可设置。
 */
export function updateUserStatus(
  userId: string,
  status: 'active' | 'banned',
  reason = '',
) {
  return patch<UserInfo>(`/api/v1/admin/users/${encodeURIComponent(userId)}/status`, {
    status,
    reason,
  })
}

/** 更新运营备注 */
export function updateUserRemark(userId: string, remark: string) {
  return patch<UserInfo>(`/api/v1/admin/users/${encodeURIComponent(userId)}/remark`, { remark })
}

export interface DeleteUserResult {
  id: string
  deleted: boolean
  detached_houses: number
  deleted_houses: number
}

/**
 * 删除用户。
 * withHouses=false（默认）保留其房屋数据，只解除归属；true 则一并删除。
 */
export function removeUser(userId: string, withHouses = false) {
  return del<DeleteUserResult>(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
    params: { with_houses: withHouses },
  })
}
