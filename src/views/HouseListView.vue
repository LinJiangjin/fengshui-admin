<script setup lang="ts">
import { onActivated, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { AdminHouseItem } from '@/api/types'
import { fetchHouses, removeHouse } from '@/api/houses'
import { formatDateTime } from '@/utils/format'

defineOptions({ name: 'HouseListView' })

const loading = ref(false)
const rows = ref<AdminHouseItem[]>([])
const total = ref(0)

const query = reactive({
  page: 1,
  size: 20,
  keyword: '',
})

async function load() {
  loading.value = true
  try {
    const result = await fetchHouses({
      page: query.page,
      size: query.size,
      keyword: query.keyword.trim(),
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
  query.page = 1
  load()
}

async function handleDelete(row: AdminHouseItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除房屋「${row.name || row.id}」吗？\n\n归属用户：${
        row.owner_phone || '无归属'
      }\n该操作不可恢复。`,
      '删除房屋',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error',
      },
    )
  } catch {
    return
  }

  await removeHouse(row.id)
  ElMessage.success('已删除')
  if (rows.value.length === 1 && query.page > 1) {
    query.page -= 1
  }
  load()
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
        <h2 class="page-title">房屋数据</h2>
        <p class="page-subtitle">共 {{ total }} 套房屋档案</p>
      </div>
      <el-button :icon="'Refresh'" @click="load">刷新</el-button>
    </div>

    <el-card shadow="never" class="table-card">
      <el-alert
        class="notice"
        type="warning"
        :closable="false"
        show-icon
        title="房屋数据涉及用户隐私，删除操作不可恢复，请谨慎处理。"
      />

      <div class="filter-bar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索房屋名 / 用户手机号 / 房屋 id"
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" :icon="'Search'" @click="handleSearch">查询</el-button>
        <el-button :icon="'RefreshLeft'" @click="handleReset">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" stripe>
        <el-table-column label="房屋名称" min-width="180">
          <template #default="{ row }">
            <span>{{ row.name || '未命名' }}</span>
            <el-tag v-if="!row.owner_id" type="info" size="small" class="tag-gap">
              无归属
            </el-tag>
          </template>
        </el-table-column>

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

        <el-table-column label="户型" width="120">
          <template #default="{ row }">{{ row.layout || '—' }}</template>
        </el-table-column>

        <el-table-column label="面积" width="110">
          <template #default="{ row }">{{ row.area ? `${row.area} ㎡` : '—' }}</template>
        </el-table-column>

        <el-table-column label="坐向" width="110">
          <template #default="{ row }">
            <el-text v-if="row.degree === null" type="info">未测量</el-text>
            <span v-else>{{ Number(row.degree).toFixed(1) }}°</span>
          </template>
        </el-table-column>

        <el-table-column label="房间数" prop="room_count" width="90" align="center" />

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
          <el-empty description="没有匹配的房屋" />
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

.tag-gap {
  margin-left: 8px;
}
</style>
