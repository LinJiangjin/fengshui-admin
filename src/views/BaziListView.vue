<script setup lang="ts">
import { onActivated, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { AdminBaziProfileItem } from '@/api/types'
import { fetchBaziProfiles, removeBaziProfile } from '@/api/bazi'
import { formatDateTime } from '@/utils/format'

defineOptions({ name: 'BaziListView' })

const loading = ref(false)
const rows = ref<AdminBaziProfileItem[]>([])
const total = ref(0)

const query = reactive({
  page: 1,
  size: 20,
  keyword: '',
  /** 空串表示不限性别 */
  gender: '',
})

async function load() {
  loading.value = true
  try {
    const result = await fetchBaziProfiles({
      page: query.page,
      size: query.size,
      keyword: query.keyword.trim(),
      gender: query.gender,
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
  query.gender = ''
  query.page = 1
  load()
}

async function handleDelete(row: AdminBaziProfileItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.name || row.owner_phone || row.id}」的命理档案吗？\n\n` +
        `出生时刻：${formatBirth(row)}\n该操作不可恢复。`,
      '删除命理档案',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error',
      },
    )
  } catch {
    return
  }

  await removeBaziProfile(row.id)
  ElMessage.success('已删除')
  if (rows.value.length === 1 && query.page > 1) {
    query.page -= 1
  }
  load()
}

/** 出生时刻：库里存的是公历年月日时分，直接拼即可，不要当时间戳转时区 */
function formatBirth(row: AdminBaziProfileItem): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${row.year}-${pad(row.month)}-${pad(row.day)} ${pad(row.hour)}:${pad(row.minute)}`
}

/** 出生地：「广东 · 广州」，缺失时给占位符 */
function formatPlace(row: AdminBaziProfileItem): string {
  return [row.province, row.city].filter(Boolean).join(' · ') || '—'
}

onMounted(load)
onActivated(() => {
  if (rows.value.length) load()
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2 class="page-title">命理档案</h2>
        <p class="page-subtitle">共 {{ total }} 份用户录入的出生信息</p>
      </div>
      <el-button :icon="'Refresh'" @click="load">刷新</el-button>
    </div>

    <el-card shadow="never" class="table-card">
      <el-alert
        class="notice"
        type="info"
        :closable="false"
        show-icon
        title="档案来自用户在「命理档案」页录入的出生信息，东经度数用于真太阳时校正。"
      />

      <div class="filter-bar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索姓名 / 用户手机号 / 昵称"
          clearable
          style="width: 280px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="query.gender"
          placeholder="性别"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="男" value="男" />
          <el-option label="女" value="女" />
        </el-select>

        <el-button type="primary" :icon="'Search'" @click="handleSearch">查询</el-button>
        <el-button :icon="'RefreshLeft'" @click="handleReset">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" stripe>
        <el-table-column label="归属用户" min-width="160">
          <template #default="{ row }">
            <template v-if="row.owner_id">
              <div class="user-cell__meta">
                <span>{{ row.owner_nickname || '未设置昵称' }}</span>
                <span class="user-cell__phone">{{ row.owner_phone }}</span>
              </div>
            </template>
            <el-text v-else type="info">历史数据（无归属）</el-text>
          </template>
        </el-table-column>

        <el-table-column label="姓名" width="120">
          <template #default="{ row }">{{ row.name || '—' }}</template>
        </el-table-column>

        <el-table-column label="性别" width="80" align="center">
          <template #default="{ row }">{{ row.gender || '—' }}</template>
        </el-table-column>

        <el-table-column label="出生时刻" width="150">
          <template #default="{ row }">{{ formatBirth(row) }}</template>
        </el-table-column>

        <el-table-column label="出生地" min-width="140">
          <template #default="{ row }">{{ formatPlace(row) }}</template>
        </el-table-column>

        <el-table-column label="东经" width="100">
          <template #default="{ row }">
            {{ Number(row.longitude).toFixed(2) }}°
          </template>
        </el-table-column>

        <el-table-column label="四柱" min-width="150">
          <template #default="{ row }">
            <span v-if="row.pillars">{{ row.pillars }}</span>
            <el-text v-else type="info">—</el-text>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.updated_at) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="还没有用户录入命理档案" />
        </template>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          :current-page="query.page"
          :page-size="query.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="(page: number) => { query.page = page; load() }"
          @size-change="(size: number) => { query.size = size; query.page = 1; load() }"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.table-card {
  border-radius: 10px;
}

.notice {
  margin-bottom: 16px;
}
</style>
