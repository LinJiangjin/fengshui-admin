<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { AdminHouseItem, UserDetailResult, UserStatus } from '@/api/types'
import { fetchUserDetail, updateUserRemark, updateUserStatus } from '@/api/users'
import { formatDateTime, nameInitial } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const userId = computed(() => String(route.params.id || ''))

const loading = ref(false)
const detail = ref<UserDetailResult | null>(null)
const remarkDraft = ref('')
const savingRemark = ref(false)

const user = computed(() => detail.value?.user ?? null)
const houses = computed<AdminHouseItem[]>(() => detail.value?.houses ?? [])

async function load() {
  loading.value = true
  try {
    const data = await fetchUserDetail(userId.value)
    detail.value = data
    remarkDraft.value = data.user.remark || ''
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

async function saveRemark() {
  if (!user.value) return
  savingRemark.value = true
  try {
    await updateUserRemark(userId.value, remarkDraft.value.trim())
    ElMessage.success('备注已保存')
    if (detail.value) {
      detail.value.user.remark = remarkDraft.value.trim()
    }
  } catch {
    // 拦截器已提示
  } finally {
    savingRemark.value = false
  }
}

async function toggleStatus() {
  const current = user.value
  if (!current) return

  const banning = current.status === 'active'
  let reason = ''

  if (banning) {
    try {
      const { value } = await ElMessageBox.prompt('封禁后该用户将无法登录 App：', '封禁原因', {
        confirmButtonText: '确认封禁',
        cancelButtonText: '取消',
        inputPlaceholder: '例如：发布违规内容',
        inputValidator: (input) => (input && input.trim().length > 0) || '请填写封禁原因',
        type: 'warning',
      })
      reason = value.trim()
    } catch {
      return
    }
  } else {
    try {
      await ElMessageBox.confirm('确定解封该用户吗？', '解封确认', {
        confirmButtonText: '解封',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return
    }
  }

  await updateUserStatus(userId.value, (banning ? 'banned' : 'active') as UserStatus, reason)
  ElMessage.success(banning ? '已封禁' : '已解封')
  load()
}

function goBack() {
  router.back()
}

onMounted(load)
</script>

<template>
  <div class="page" v-loading="loading">
    <div class="page-header">
      <div>
        <el-button link :icon="'ArrowLeft'" @click="goBack">返回用户列表</el-button>
        <h2 class="page-title">用户详情</h2>
      </div>
      <el-button
        v-if="user && user.status !== 'deleted'"
        :type="user.status === 'active' ? 'warning' : 'success'"
        @click="toggleStatus"
      >
        {{ user.status === 'active' ? '封禁该用户' : '解封该用户' }}
      </el-button>
    </div>

    <el-empty v-if="!loading && !user" description="用户不存在或已被删除">
      <el-button type="primary" @click="goBack">返回列表</el-button>
    </el-empty>

    <template v-if="user">
      <el-card shadow="never" class="card">
        <div class="profile">
          <el-avatar :size="64" :src="user.avatar || undefined">
            {{ nameInitial(user.nickname) }}
          </el-avatar>
          <div class="profile__meta">
            <div class="profile__name">
              {{ user.nickname || '未设置昵称' }}
              <el-tag v-if="user.status === 'active'" type="success" size="small">正常</el-tag>
              <el-tag v-else-if="user.status === 'deleted'" type="info" size="small">已注销</el-tag>
              <el-tag v-else type="danger" size="small">已封禁</el-tag>
            </div>
            <div class="profile__phone">{{ user.phone }}</div>
          </div>
        </div>

        <el-alert
          v-if="user.status === 'deleted'"
          class="ban-alert"
          type="info"
          :closable="false"
          show-icon
          title="该账号已注销：房屋与命理档案已删除、手机号已抹除，此处仅保留用于统计的匿名记录"
        />

        <el-alert
          v-if="user.status === 'banned'"
          class="ban-alert"
          type="error"
          :closable="false"
          show-icon
          :title="`封禁原因：${user.ban_reason || '未填写'}`"
        />

        <el-descriptions :column="3" border class="desc">
          <el-descriptions-item label="用户 id">{{ user.id }}</el-descriptions-item>
          <el-descriptions-item label="登录次数">{{ user.login_count }}</el-descriptions-item>
          <el-descriptions-item label="名下房屋">{{ houses.length }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ formatDateTime(user.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="最近登录">
            {{ formatDateTime(user.last_login_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号">{{ user.phone }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="never" class="card">
        <template #header><span>运营备注</span></template>
        <el-input
          v-model="remarkDraft"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="仅后台可见，用于记录该用户的沟通情况、工单编号等"
        />
        <div class="remark-actions">
          <el-button
            type="primary"
            :loading="savingRemark"
            :disabled="remarkDraft.trim() === (user.remark || '')"
            @click="saveRemark"
          >
            保存备注
          </el-button>
        </div>
      </el-card>

      <el-card shadow="never" class="card">
        <template #header>
          <span>名下房屋（{{ houses.length }}）</span>
        </template>
        <el-table :data="houses" stripe>
          <el-table-column label="房屋名称" min-width="160">
            <template #default="{ row }">{{ row.name || '未命名' }}</template>
          </el-table-column>
          <el-table-column label="户型" prop="layout" width="120">
            <template #default="{ row }">{{ row.layout || '—' }}</template>
          </el-table-column>
          <el-table-column label="面积" width="110">
            <template #default="{ row }">
              {{ row.area ? `${row.area} ㎡` : '—' }}
            </template>
          </el-table-column>
          <el-table-column label="坐向" width="120">
            <template #default="{ row }">
              <el-text v-if="row.degree === null" type="info">未测量</el-text>
              <span v-else>{{ Number(row.degree).toFixed(1) }}°</span>
            </template>
          </el-table-column>
          <el-table-column label="房间数" prop="room_count" width="90" align="center" />
          <el-table-column label="更新时间" width="160">
            <template #default="{ row }">{{ formatDateTime(row.updated_at) }}</template>
          </el-table-column>
          <template #empty>
            <el-empty description="该用户还没有创建房屋" />
          </template>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.card {
  margin-bottom: 16px;
  border-radius: 10px;
}

.page-header {
  align-items: flex-start;
  flex-direction: column;
}

.profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 500;
}

.profile__phone {
  margin-top: 4px;
  color: var(--admin-text-secondary);
}

.ban-alert {
  margin-top: 16px;
}

.desc {
  margin-top: 16px;
}

.remark-actions {
  margin-top: 12px;
  text-align: right;
}
</style>
