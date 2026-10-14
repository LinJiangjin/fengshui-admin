import { del, get, patch, post, put } from '@/api/request'
import type { AdminSchemeItem, ElementNoteItem, PageResult, SchemeInput } from '@/api/types'

export interface SchemeQuery {
  page?: number
  size?: number
  keyword?: string
  /** 五行：木 火 土 金 水，空表示全部 */
  element?: string
  /** published / draft，空表示全部 */
  published?: string
}

/** 方案分页列表。后台能看到已下架的方案，App 端看不到。 */
export function fetchSchemes(params: SchemeQuery) {
  return get<PageResult<AdminSchemeItem>>('/api/v1/admin/schemes', { params })
}

/** 方案详情（编辑表单回填用） */
export function fetchScheme(schemeId: string) {
  return get<AdminSchemeItem>(`/api/v1/admin/schemes/${encodeURIComponent(schemeId)}`)
}

export function createScheme(data: SchemeInput) {
  return post<AdminSchemeItem>('/api/v1/admin/schemes', data)
}

/** 全量更新：后台表单本来就把整条方案一次提交 */
export function updateScheme(schemeId: string, data: SchemeInput) {
  return put<AdminSchemeItem>(`/api/v1/admin/schemes/${encodeURIComponent(schemeId)}`, data)
}

/** 上架 / 下架 */
export function updateSchemeStatus(schemeId: string, published: boolean) {
  return patch<AdminSchemeItem>(
    `/api/v1/admin/schemes/${encodeURIComponent(schemeId)}/status`,
    { published },
  )
}

export function removeScheme(schemeId: string) {
  return del<{ id: string; deleted: boolean }>(
    `/api/v1/admin/schemes/${encodeURIComponent(schemeId)}`,
  )
}

/** 五行宜忌解读列表 */
export function fetchElementNotes() {
  return get<ElementNoteItem[]>('/api/v1/admin/element-notes')
}

/** 更新某行五行的解读（后端是 upsert，缺行会自动建） */
export function saveElementNote(element: string, data: { fit: string; avoid: string }) {
  return put<ElementNoteItem>(
    `/api/v1/admin/element-notes/${encodeURIComponent(element)}`,
    data,
  )
}
