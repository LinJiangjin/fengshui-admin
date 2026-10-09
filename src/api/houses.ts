import { del, get } from '@/api/request'
import type { AdminHouseItem, PageResult } from '@/api/types'

export interface HouseQuery {
  page?: number
  size?: number
  keyword?: string
}

/** 房屋数据分页列表，带归属用户信息 */
export function fetchHouses(params: HouseQuery) {
  return get<PageResult<AdminHouseItem>>('/api/v1/admin/houses', { params })
}

/** 删除房屋（违规内容清理） */
export function removeHouse(houseId: string) {
  return del<{ id: string; deleted: boolean }>(
    `/api/v1/admin/houses/${encodeURIComponent(houseId)}`,
  )
}
