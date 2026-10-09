/** 展示层格式化工具。 */

/**
 * 把后端返回的时间字符串转成本地时间显示。
 *
 * 后端统一以 UTC 存储：PostgreSQL 返回带时区的 ISO 串，SQLite 返回不带时区的串。
 * 不带时区时必须显式补 Z 按 UTC 解释，否则浏览器会当成本地时间，整体偏移几小时。
 */
function toDate(value: string): Date {
  const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)
  return new Date(hasTimezone ? value : `${value}Z`)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return '—'

  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

export function formatDate(value: string | null | undefined): string {
  const full = formatDateTime(value)
  return full === '—' ? full : full.slice(0, 10)
}

/** 手机号脱敏：138****8000 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone || '—'
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

/** 头像占位：没有头像时显示昵称首字 */
export function nameInitial(name: string): string {
  return (name || '?').trim().charAt(0) || '?'
}
