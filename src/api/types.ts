/** 后端接口的类型定义。与 server/app/schemas.py 一一对应。 */

/** 统一响应信封：{code, status, data} */
export interface ApiEnvelope<T> {
  code: number
  status: string
  data: T
  /** 业务错误时后端会带 message，兼容字段 detail 也保留 */
  message?: string
  detail?: unknown
}

export interface PageMeta {
  total: number
  page: number
  size: number
  pages: number
}

export interface PageResult<T> {
  page_meta: PageMeta
  items: T[]
}

export type UserStatus = 'active' | 'banned'

export interface UserInfo {
  id: string
  phone: string
  nickname: string
  avatar: string
  status: UserStatus
  ban_reason: string
  remark: string
  login_count: number
  last_login_at: string | null
  created_at: string | null
}

/** 后台列表项：用户资料 + 名下房屋数 */
export interface AdminUserItem extends UserInfo {
  house_count: number
}

export interface AdminInfo {
  id: string
  username: string
  display_name: string
  status: string
  last_login_at: string | null
}

export interface AdminLoginResult {
  token: string
  token_type: string
  expires_in: number
  admin: AdminInfo
}

export interface AdminHouseItem {
  id: string
  owner_id: string | null
  owner_phone: string
  owner_nickname: string
  name: string
  layout: string
  area: number
  degree: number | null
  year: number
  room_count: number
  created_at: string | null
  updated_at: string | null
}

export interface TrendPoint {
  date: string
  new_users: number
}

export interface StatsInfo {
  total_users: number
  new_today: number
  new_7d: number
  active_7d: number
  banned_users: number
  total_houses: number
  measured_houses: number
  trend: TrendPoint[]
}

export interface UserDetailResult {
  user: UserInfo
  houses: AdminHouseItem[]
}

/** 后台命理档案列表项：用户录入的出生信息 + 归属用户 */
export interface AdminBaziProfileItem {
  id: string
  owner_id: string | null
  owner_phone: string
  owner_nickname: string
  /** 姓名（可选，用户没填就是空） */
  name: string
  /** 男 / 女 */
  gender: string
  year: number
  month: number
  day: number
  hour: number
  minute: number
  /** 出生地省份 / 城市，仅作展示 */
  province: string
  city: string
  /** 出生地东经度数，排盘真太阳时校正用 */
  longitude: number
  /** 四柱摘要，如「辛未 丁酉 癸未 丙辰」 */
  pillars: string
  created_at: string | null
  updated_at: string | null
}
