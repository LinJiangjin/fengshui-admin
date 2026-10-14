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

/**
 * 用户状态。
 * deleted：用户自助注销后的匿名化空壳（手机号已抹除），
 * 默认不出现在列表里，需显式筛选 status=deleted 才可见。
 */
export type UserStatus = 'active' | 'banned' | 'deleted'

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

/**
 * 方案库（运营内容）。
 *
 * 色值字段在库里叫 from_color / to_color（`from` 是 Python 关键字，不能作列名），
 * 下发到 App 的 /api/v1/library 时会被映射成 from / to；
 * 后台接口一律用这里的库内列名。
 */
export interface AdminSchemeColor {
  name: string
  hex: string
}

export interface AdminSchemeRoom {
  name: string
  hex: string
  note: string
}

/** 新建 / 更新方案的入参 */
export interface SchemeInput {
  title: string
  subtitle: string
  /** 风格标签，如「新中式」 */
  tag: string
  /** 五行：木 火 土 金 水 */
  element: string
  area: number
  from_color: string
  to_color: string
  summary: string
  highlights: string[]
  colors: AdminSchemeColor[]
  rooms: AdminSchemeRoom[]
  /** 是否上架；下架后 App 端不可见 */
  published: boolean
  /** 展示顺序，越小越靠前 */
  sort_order: number
}

export interface AdminSchemeItem extends SchemeInput {
  id: string
  created_at: string | null
  updated_at: string | null
}

/** 五行宜忌解读；方案详情页的「宜 / 忌」按方案所属五行取这里 */
export interface ElementNoteItem {
  element: string
  fit: string
  avoid: string
  sort_order: number
}
