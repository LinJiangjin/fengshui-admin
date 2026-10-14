<script setup lang="ts">
import { onActivated, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { AdminUserItem, UserStatus } from '@/api/types'
import { fetchUsers, removeUser, updateUserStatus } from '@/api/users'
import { formatDateTime, nameInitial } from '@/utils/format'

defineOptions({ name: 'UserListView' })

const router = useRouter()

const loading = ref(false)
const rows = ref<AdminUserItem[]>([])
const total = ref(0)

const query = reactive({
  page: 1,
  size: 20,
  keyword: '',
  status: '' as UserStatus | '',
})

async function load() {
  loading.value = true
  try {
    const result = await fetchUsers({
      page: query.page,
      size: query.size,
      keyword: query.keyword.trim(),
      status: query.status,
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
  query.page = 1 // 换条件必须回到第一页，否则可能停在空页
  load()
}

function handleReset() {
  query.keyword = ''
  query.status = ''
  query.page = 1
  load()
}

function goDetail(row: AdminUserItem) {
  router.push({ name: 'user-detail', params: { id: row.id } })
}

async function toggleStatus(row: AdminUserItem) {
  const banning = row.status === 'active'

  if (!banning) {
    try {
      await ElMessageBox.confirm(`确定解封用户「${row.nickname || row.phone}」吗？`, '解封确认', {
        confirmButtonText: '解封',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return
    }
    await updateUserStatus(row.id, 'active')
    ElMessage.success('已解封')
    load()
    return
  }

  // 封禁需要填原因，原因会展示给被封用户
  let reason = ''
  try {
    const { value } = await ElMessageBox.prompt(
      `封禁后该用户将无法登录 App。请填写封禁原因：`,
      `封禁「${row.nickname || row.phone}」`,
      {
        confirmButtonText: '确认封禁',
        cancelButtonText: '取消',
        inputPlaceholder: '例如：发布违规内容',
        inputValidator: (input) => (input && input.trim().length > 0) || '请填写封禁原因',
        type: 'warning',
      },
    )
    reason = value.trim()
  } catch {
    return
  }

  await updateUserStatus(row.id, 'banned', reason)
  ElMessage.success('已封禁')
  load()
}

async function handleDelete(row: AdminUserItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除用户「${row.nickname || row.phone}」吗？\n\n` +
        `该用户名下的 ${row.house_count} 套房屋数据会保留，仅解除归属关系；` +
        `如需彻底清理请到「房屋数据」页单独删除。`,
      '删除确认',
      {
        confirmButtonText: '删除用户',
        cancelButtonText: '取消',
        type: 'error',
      },
    )
  } catch {
    return
  }

  const result = await removeUser(row.id, false)
  ElMessage.success(
    result.detached_houses > 0
      ? `已删除，${result.detached_houses} 套房屋已解除归属`
      : '已删除',
  )
  // 删掉当前页最后一条时回退一页，避免停在空页
  if (rows.value.length === 1 && query.page > 1) {
    query.page -= 1
  }
  load()
}

function handlePageChange(page: number) {
  query.page = page
  load()
}

function handleSizeChange(size: number) {
  query.size = size
  query.page = 1
  load()
}

onMounted(load)
// keep-alive 下从详情页返回时刷新，保证封禁状态立刻可见
onActivated(() => {
  if (rows.value.length) load()
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2 class="page-title">用户管理</h2>
        <p class="page-subtitle">共 {{ total }} 位注册用户</p>
      </div>
      <el-button :icon="'Refresh'" @click="load">刷新</el-button>
    </div>

    <el-card shadow="never" class="table-card">
      <div class="filter-bar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索手机号 / 昵称 / 用户 id"
          clearable
          style="width: 260px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="query.status" placeholder="全部状态" style="width: 160px">
          <el-option label="全部（未注销）" value="" />
          <el-option label="正常" value="active" />
          <el-option label="已封禁" value="banned" />
          <el-option label="已注销" value="deleted" />
        </el-select>

        <el-button type="primary" :icon="'Search'" @click="handleSearch">查询</el-button>
        <el-button :icon="'RefreshLeft'" @click="handleReset">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" stripe>
        <el-table-column label="用户" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="34" :src="row.avatar || undefined">
                {{ nameInitial(row.nickname) }}
              </el-avatar>
              <div class="user-cell__meta">
                <span class="user-cell__name">{{ row.nickname || '未设置昵称' }}</span>
                <span class="user-cell__phone">{{ row.phone }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="用户 id" prop="id" min-width="180" show-overflow-tooltip />

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'active'" type="success" size="small">正常</el-tag>
            <el-tag v-else-if="row.status === 'deleted'" type="info" size="small">已注销</el-tag>
            <el-tooltip v-else :content="row.ban_reason || '无原因记录'" placement="top">
              <el-tag type="danger" size="small">已封禁</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="房屋" width="90" align="center">
          <template #default="{ row }">
            <el-text :type="row.house_count > 0 ? 'primary' : 'info'">
              {{ row.house_count }}
            </el-text>
          </template>
        </el-table-column>

        <el-table-column label="登录次数" prop="login_count" width="100" align="center" />

        <el-table-column label="注册时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>

        <el-table-column label="最近登录" width="160">
          <template #default="{ row }">{{ formatDateTime(row.last_login_at) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="goDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status !== 'deleted'"
              link
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '封禁' : '解封' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="没有匹配的用户" />
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
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.table-card {
  border-radius: 10px;
}
</style>
