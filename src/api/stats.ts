import { get } from '@/api/request'
import type { StatsInfo } from '@/api/types'

/** 看板统计（总用户 / 新增 / 活跃 / 房屋 / 近 14 天趋势） */
export function fetchStats() {
  return get<StatsInfo>('/api/v1/admin/stats')
}
