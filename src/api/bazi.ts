import { del, get } from '@/api/request'
import type { AdminBaziProfileItem, PageResult } from '@/api/types'

export interface BaziProfileQuery {
  page?: number
  size?: number
  /** 姓名 / 用户手机号 / 昵称 */
  keyword?: string
  /** 性别筛选：'男' / '女'，留空表示全部 */
  gender?: string
}

/** 命理档案分页列表，带归属用户信息 */
export function fetchBaziProfiles(params: BaziProfileQuery) {
  return get<PageResult<AdminBaziProfileItem>>('/api/v1/admin/bazi-profiles', {
    params,
  })
}

/** 删除命理档案（违规内容清理） */
export function removeBaziProfile(profileId: string) {
  return del<{ id: string; deleted: boolean }>(
    `/api/v1/admin/bazi-profiles/${encodeURIComponent(profileId)}`,
  )
}
