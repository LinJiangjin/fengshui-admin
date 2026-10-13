<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import { clearAuth, displayName } from '@/stores/auth'

const route = useRoute()
const router = useRouter()

/** 侧边栏菜单：取根路由下未标记 hidden 的子路由 */
const menuItems = computed(() => {
  const root = router.options.routes.find((item) => item.path === '/')
  return (root?.children ?? [])
    .filter((child) => !child.meta?.hidden && child.meta?.title)
    .map((child) => ({
      path: `/${child.path}`,
      title: child.meta?.title as string,
      icon: (child.meta?.icon as string) || 'Menu',
    }))
})

/** 当前高亮项：详情页等子路径回退到其父级菜单 */
const activeMenu = computed(() => {
  const matched = menuItems.value.find((item) => route.path.startsWith(item.path))
  return matched?.path ?? route.path
})

const pageTitle = computed(() => (route.meta.title as string) || '')

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return // 点了取消
  }
  clearAuth()
  ElMessage.success('已退出登录')
  router.replace({ name: 'login' })
}
</script>

<template>
  <el-container class="layout">
    <el-aside width="216px" class="layout__aside">
      <div class="brand">
        <el-icon class="brand__icon"><Compass /></el-icon>
        <div class="brand__text">
          <span class="brand__title">风水装修</span>
          <span class="brand__sub">管理后台</span>
        </div>
      </div>

      <el-menu :default-active="activeMenu" router class="layout__menu">
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout__header">
        <h1 class="layout__page-title">{{ pageTitle }}</h1>

        <el-dropdown trigger="click">
          <span class="layout__user">
            <el-icon><UserFilled /></el-icon>
            <span>{{ displayName }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="layout__main">
        <router-view v-slot="{ Component }">
          <keep-alive :include="['UserListView', 'HouseListView', 'BaziListView']">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100vh;
}

.layout__aside {
  display: flex;
  flex-direction: column;
  background: var(--admin-sidebar-bg);
  border-right: 1px solid var(--el-border-color-light);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 60px;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.brand__icon {
  font-size: 22px;
  color: var(--el-color-primary);
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.brand__title {
  font-size: 15px;
  font-weight: 500;
}

.brand__sub {
  font-size: 12px;
  color: var(--admin-text-secondary);
}

.layout__menu {
  flex: 1;
  border-right: none;
}

.layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
}

.layout__page-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.layout__user {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--admin-text);
  cursor: pointer;
  outline: none;
}

.layout__main {
  padding: 0;
  overflow-y: auto;
}
</style>
