<script setup lang="ts">
import { onActivated, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

import type {
  AdminSchemeColor,
  AdminSchemeItem,
  AdminSchemeRoom,
  ElementNoteItem,
  SchemeInput,
} from '@/api/types'
import {
  createScheme,
  fetchElementNotes,
  fetchSchemes,
  removeScheme,
  saveElementNote,
  updateScheme,
  updateSchemeStatus,
} from '@/api/schemes'
import { formatDateTime } from '@/utils/format'

defineOptions({ name: 'SchemeListView' })

/** 五行枚举与后端 schemas.ELEMENT_PATTERN 保持一致 */
const ELEMENTS = ['木', '火', '土', '金', '水']

/** 风格标签只是输入建议，运营可以自由输入新风格（会直接成为 App 端的新 chip） */
const TAG_PRESETS = ['新中式', '日式侘寂', '现代原木', '现代简约']

const activeTab = ref<'schemes' | 'notes'>('schemes')

// ------------------------------------------------------------ 方案列表
const loading = ref(false)
const rows = ref<AdminSchemeItem[]>([])
const total = ref(0)

const query = reactive({
  page: 1,
  size: 20,
  keyword: '',
  element: '',
  published: '',
})

async function load() {
  loading.value = true
  try {
    const result = await fetchSchemes({
      page: query.page,
      size: query.size,
      keyword: query.keyword.trim(),
      element: query.element,
      published: query.published,
    })
    rows.value = result.items
    total.value = result.page_meta.total
  } catch {
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  load()
}

function handleReset() {
  query.keyword = ''
  query.element = ''
  query.published = ''
  query.page = 1
  load()
}

// ------------------------------------------------------------ 表单
type SchemeForm = SchemeInput

function emptyForm(): SchemeForm {
  return {
    title: '',
    subtitle: '',
    tag: '',
    element: '木',
    area: 90,
    from_color: '#E4DCCB',
    to_color: '#C0A97E',
    summary: '',
    highlights: [''],
    colors: [{ name: '', hex: '#F5F1E8' }],
    rooms: [{ name: '', hex: '#F5F1E8', note: '' }],
    published: true,
    sort_order: 10,
  }
}

const formVisible = ref(false)
const saving = ref(false)
const editingId = ref('')
const formRef = ref<FormInstance>()
const form = reactive<SchemeForm>(emptyForm())

const rules: FormRules = {
  title: [{ required: true, message: '请输入方案标题', trigger: 'blur' }],
  tag: [{ required: true, message: '请输入或选择风格标签', trigger: 'change' }],
  element: [{ required: true, message: '请选择五行', trigger: 'change' }],
  from_color: [
    { required: true, pattern: /^#[0-9A-Fa-f]{6}$/, message: '请选择渐变起始色', trigger: 'change' },
  ],
  to_color: [
    { required: true, pattern: /^#[0-9A-Fa-f]{6}$/, message: '请选择渐变结束色', trigger: 'change' },
  ],
}

function fillForm(source: SchemeForm) {
  Object.assign(form, {
    title: source.title,
    subtitle: source.subtitle,
    tag: source.tag,
    element: source.element,
    area: source.area,
    from_color: source.from_color,
    to_color: source.to_color,
    summary: source.summary,
    // 复制数组，否则在抽屉里增删会直接改到表格里的那一行
    highlights: [...source.highlights],
    colors: source.colors.map((c) => ({ ...c })),
    rooms: source.rooms.map((r) => ({ ...r })),
    published: source.published,
    sort_order: source.sort_order,
  })
}

function openCreate() {
  editingId.value = ''
  fillForm(emptyForm())
  formVisible.value = true
}

function openEdit(row: AdminSchemeItem) {
  editingId.value = row.id
  fillForm(row)
  formVisible.value = true
}

/** 副标题是「五行属木 · 96㎡」这种固定句式，给个一键填充省得手打 */
function autoSubtitle() {
  form.subtitle = `五行属${form.element} · ${form.area}㎡`
}

function addHighlight() {
  form.highlights.push('')
}

function addColor() {
  form.colors.push({ name: '', hex: '#F5F1E8' })
}

function addRoom() {
  form.rooms.push({ name: '', hex: '#F5F1E8', note: '' })
}

/**
 * 提交前的本地体检。
 *
 * 后端的校验会拦下这些情况，但报错长成「colors.0.name: String should have at
 * least 1 character」这种，运营看不懂；这里先给一句人话。
 */
function firstProblem(): string {
  const blankColor = form.colors.findIndex((c: AdminSchemeColor) => !c.name.trim())
  if (blankColor >= 0) return `主色板第 ${blankColor + 1} 个颜色还没填名称`
  const blankRoom = form.rooms.findIndex((r: AdminSchemeRoom) => !r.name.trim())
  if (blankRoom >= 0) return `分区配色第 ${blankRoom + 1} 项还没填房间名`
  return ''
}

function toPayload(): SchemeInput {
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    tag: form.tag.trim(),
    element: form.element,
    area: form.area,
    from_color: form.from_color,
    to_color: form.to_color,
    summary: form.summary.trim(),
    highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
    colors: form.colors.map((c) => ({ name: c.name.trim(), hex: c.hex })),
    rooms: form.rooms.map((r) => ({ name: r.name.trim(), hex: r.hex, note: r.note.trim() })),
    published: form.published,
    sort_order: form.sort_order,
  }
}

async function handleSubmit() {
  const instance = formRef.value
  if (!instance) return
  const valid = await instance.validate().catch(() => false)
  if (!valid) return

  const problem = firstProblem()
  if (problem) {
    ElMessage.warning(problem)
    return
  }

  saving.value = true
  try {
    const payload = toPayload()
    if (editingId.value) {
      await updateScheme(editingId.value, payload)
      ElMessage.success('方案已保存')
    } else {
      await createScheme(payload)
      ElMessage.success('方案已创建')
    }
    formVisible.value = false
    await load()
  } catch {
    // 失败提示由请求拦截器统一弹出，这里只保证 saving 归位
  } finally {
    saving.value = false
  }
}

async function handleTogglePublished(row: AdminSchemeItem) {
  const next = !row.published
  try {
    await updateSchemeStatus(row.id, next)
  } catch {
    return
  }
  row.published = next
  ElMessage.success(next ? '已上架，App 端可见' : '已下架，App 端不可见')
  // 正在按状态筛选时，这一行已不符合条件，刷新列表
  if (query.published) load()
}

async function handleDelete(row: AdminSchemeItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除方案「${row.title}」吗？\n\n该操作不可恢复。` +
        '若只是暂时不想展示，建议改用「下架」。',
      '删除方案',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'error' },
    )
  } catch {
    return
  }

  try {
    await removeScheme(row.id)
  } catch {
    return
  }
  ElMessage.success('已删除')
  if (rows.value.length === 1 && query.page > 1) {
    query.page -= 1
  }
  load()
}

// ------------------------------------------------------------ 五行解读
const notes = ref<ElementNoteItem[]>([])
const notesLoading = ref(false)
const savingNote = ref('')

async function loadNotes() {
  notesLoading.value = true
  try {
    notes.value = await fetchElementNotes()
  } catch {
    notes.value = []
  } finally {
    notesLoading.value = false
  }
}

async function handleSaveNote(row: ElementNoteItem) {
  savingNote.value = row.element
  try {
    await saveElementNote(row.element, { fit: row.fit, avoid: row.avoid })
    ElMessage.success(`「${row.element}」的解读已保存`)
  } catch {
    // 同上，错误提示交给拦截器
  } finally {
    savingNote.value = ''
  }
}

onMounted(() => {
  load()
  loadNotes()
})

onActivated(() => {
  if (rows.value.length) load()
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2 class="page-title">方案库</h2>
        <p class="page-subtitle">
          装修方案与五行解读属于运营内容，改完即时生效，App 端无需发版
        </p>
      </div>
      <el-button v-if="activeTab === 'schemes'" type="primary" :icon="'Plus'" @click="openCreate">
        新建方案
      </el-button>
      <el-button v-else :icon="'Refresh'" @click="loadNotes">刷新</el-button>
    </div>

    <el-tabs v-model="activeTab" class="tabs">
      <!-- ------------------------------------------------ 方案管理 -->
      <el-tab-pane label="方案管理" name="schemes">
        <el-card shadow="never" class="table-card">
          <el-alert
            class="notice"
            type="info"
            :closable="false"
            show-icon
            title="方案下架后 App 端立即不可见，数据保留可随时恢复；删除不可恢复。"
          />

          <div class="filter-bar">
            <el-input
              v-model="query.keyword"
              placeholder="搜索标题 / 副标题 / 风格 / 方案 id"
              clearable
              style="width: 280px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-select v-model="query.element" placeholder="全部五行" style="width: 130px">
              <el-option label="全部五行" value="" />
              <el-option v-for="e in ELEMENTS" :key="e" :label="`属${e}`" :value="e" />
            </el-select>

            <el-select v-model="query.published" placeholder="全部状态" style="width: 140px">
              <el-option label="全部状态" value="" />
              <el-option label="已上架" value="published" />
              <el-option label="已下架" value="draft" />
            </el-select>

            <el-button type="primary" :icon="'Search'" @click="handleSearch">查询</el-button>
            <el-button :icon="'RefreshLeft'" @click="handleReset">重置</el-button>
          </div>

          <el-table v-loading="loading" :data="rows" stripe>
            <el-table-column label="预览" width="96">
              <template #default="{ row }">
                <div
                  class="swatch"
                  :style="{ background: `linear-gradient(135deg, ${row.from_color}, ${row.to_color})` }"
                />
              </template>
            </el-table-column>

            <el-table-column label="方案" min-width="230">
              <template #default="{ row }">
                <div class="cell-title">{{ row.title }}</div>
                <div class="cell-sub">{{ row.subtitle || '—' }}</div>
              </template>
            </el-table-column>

            <el-table-column label="风格" width="120">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.tag }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="五行" width="80" align="center">
              <template #default="{ row }">属{{ row.element }}</template>
            </el-table-column>

            <el-table-column label="面积" width="100">
              <template #default="{ row }">{{ row.area ? `${row.area} ㎡` : '—' }}</template>
            </el-table-column>

            <el-table-column label="排序" prop="sort_order" width="80" align="center" />

            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.published"
                  inline-prompt
                  active-text="上架"
                  inactive-text="下架"
                  @change="handleTogglePublished(row)"
                />
              </template>
            </el-table-column>

            <el-table-column label="更新时间" width="160">
              <template #default="{ row }">{{ formatDateTime(row.updated_at) }}</template>
            </el-table-column>

            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openEdit(row)">
                  编辑
                </el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>

            <template #empty>
              <el-empty description="还没有方案，点右上角「新建方案」开始" />
            </template>
          </el-table>

          <div class="pagination-bar">
            <el-pagination
              :current-page="query.page"
              :page-size="query.size"
              :total="total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              background
              @current-change="(page: number) => { query.page = page; load() }"
              @size-change="(size: number) => { query.size = size; query.page = 1; load() }"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ------------------------------------------------ 五行解读 -->
      <el-tab-pane label="五行解读" name="notes">
        <el-card shadow="never" class="table-card">
          <el-alert
            class="notice"
            type="info"
            :closable="false"
            show-icon
            title="方案详情页的「宜 / 忌」按方案所属五行复用这里的内容：改一条，同五行的所有方案同步生效。"
          />

          <el-table v-loading="notesLoading" :data="notes" stripe>
            <el-table-column label="五行" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" effect="dark">属{{ row.element }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="宜" min-width="280">
              <template #default="{ row }">
                <el-input
                  v-model="row.fit"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 4 }"
                  maxlength="200"
                  show-word-limit
                  placeholder="如：木主生发，宜原木、棉麻、绿植着色"
                />
              </template>
            </el-table-column>

            <el-table-column label="忌" min-width="280">
              <template #default="{ row }">
                <el-input
                  v-model="row.avoid"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 4 }"
                  maxlength="200"
                  show-word-limit
                  placeholder="如：忌大面积金属镜面与冷白光"
                />
              </template>
            </el-table-column>

            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  :loading="savingNote === row.element"
                  @click="handleSaveNote(row)"
                >
                  保存
                </el-button>
              </template>
            </el-table-column>

            <template #empty>
              <el-empty description="没有解读数据" />
            </template>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- ------------------------------------------------ 编辑抽屉 -->
    <el-drawer
      v-model="formVisible"
      :title="editingId ? '编辑方案' : '新建方案'"
      size="640px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="92px"
        label-position="right"
      >
        <el-form-item label="方案标题" prop="title">
          <el-input v-model="form.title" maxlength="60" show-word-limit placeholder="如「新中式 · 水墨禅意」" />
        </el-form-item>

        <el-form-item label="风格标签" prop="tag">
          <el-select
            v-model="form.tag"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入新风格（会同步成 App 端筛选项）"
            style="width: 100%"
          >
            <el-option v-for="t in TAG_PRESETS" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>

        <el-form-item label="副标题">
          <div class="subtitle-row">
            <el-input v-model="form.subtitle" maxlength="80" placeholder="如「五行属木 · 96㎡」" />
            <el-button link type="primary" @click="autoSubtitle">自动填充</el-button>
          </div>
        </el-form-item>

        <el-form-item label="五行" prop="element">
          <el-radio-group v-model="form.element">
            <el-radio-button v-for="e in ELEMENTS" :key="e" :value="e">{{ e }}</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="面积">
          <el-input-number v-model="form.area" :min="0" :max="1000" :step="5" />
          <span class="hint">㎡，仅用于 App 端的面积区间筛选</span>
        </el-form-item>

        <el-form-item label="渐变起始色" prop="from_color">
          <el-color-picker v-model="form.from_color" color-format="hex" />
          <el-input v-model="form.from_color" style="width: 130px" maxlength="7" />
        </el-form-item>

        <el-form-item label="渐变结束色" prop="to_color">
          <el-color-picker v-model="form.to_color" color-format="hex" />
          <el-input v-model="form.to_color" style="width: 130px" maxlength="7" />
          <div
            class="swatch swatch--inline"
            :style="{ background: `linear-gradient(135deg, ${form.from_color}, ${form.to_color})` }"
          />
          <span class="hint">App 端方案卡片按这两个色出渐变</span>
        </el-form-item>

        <el-form-item label="方案简介">
          <el-input
            v-model="form.summary"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            maxlength="300"
            show-word-limit
            placeholder="两三句话说清设计思路与适配户型"
          />
        </el-form-item>

        <el-form-item label="方案亮点">
          <div class="list-editor">
            <div v-for="(_, index) in form.highlights" :key="index" class="list-editor__row">
              <el-input
                v-model="form.highlights[index]"
                maxlength="140"
                placeholder="一句话，如「客厅通铺浅色原木地板，视觉上拉长进深」"
              />
              <el-button
                link
                type="danger"
                :icon="'Delete'"
                @click="form.highlights.splice(index, 1)"
              />
            </div>
            <el-button link type="primary" :icon="'Plus'" @click="addHighlight">
              添加亮点
            </el-button>
            <p class="hint">最多 12 条；留空的条目保存时会自动丢弃</p>
          </div>
        </el-form-item>

        <el-form-item label="主色板">
          <div class="list-editor">
            <div v-for="(color, index) in form.colors" :key="index" class="list-editor__row">
              <el-color-picker v-model="color.hex" color-format="hex" />
              <el-input
                v-model="color.name"
                style="width: 200px"
                maxlength="20"
                placeholder="颜色名称，如「宣纸白」"
              />
              <el-input v-model="color.hex" style="width: 120px" maxlength="7" />
              <el-button link type="danger" :icon="'Delete'" @click="form.colors.splice(index, 1)" />
            </div>
            <el-button link type="primary" :icon="'Plus'" @click="addColor">添加颜色</el-button>
          </div>
        </el-form-item>

        <el-form-item label="分区配色">
          <div class="list-editor">
            <div v-for="(room, index) in form.rooms" :key="index" class="list-editor__row">
              <el-color-picker v-model="room.hex" color-format="hex" />
              <el-input
                v-model="room.name"
                style="width: 110px"
                maxlength="20"
                placeholder="房间"
              />
              <el-input v-model="room.note" maxlength="120" placeholder="这个房间怎么用色" />
              <el-button link type="danger" :icon="'Delete'" @click="form.rooms.splice(index, 1)" />
            </div>
            <el-button link type="primary" :icon="'Plus'" @click="addRoom">添加房间</el-button>
          </div>
        </el-form-item>

        <el-form-item label="展示顺序">
          <el-input-number v-model="form.sort_order" :min="0" :max="9999" />
          <span class="hint">数字越小越靠前</span>
        </el-form-item>

        <el-form-item label="上架">
          <el-switch v-model="form.published" inline-prompt active-text="上架" inactive-text="下架" />
          <span class="hint">下架后 App 端不可见，但数据保留</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          {{ editingId ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.tabs {
  margin-top: -8px;
}

.table-card {
  border-radius: 10px;
}

.notice {
  margin-bottom: 16px;
}

.swatch {
  width: 56px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.swatch--inline {
  width: 44px;
  height: 28px;
}

.cell-title {
  font-weight: 500;
}

.cell-sub {
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.subtitle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.gradient-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.list-editor {
  width: 100%;
}

.list-editor__row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.hint {
  margin: 0 0 0 8px;
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.list-editor .hint {
  margin-left: 0;
}
</style>
