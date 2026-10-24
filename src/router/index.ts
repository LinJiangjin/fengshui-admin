import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { getToken } from '@/utils/token'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '数据看板', icon: 'DataLine' },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/UserListView.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'users/:id',
        name: 'user-detail',
        component: () => import('@/views/UserDetailView.vue'),
        meta: { title: '用户详情', hidden: true },
      },
      {
        path: 'houses',
        name: 'houses',
        component: () => import('@/views/HouseListView.vue'),
        meta: { title: '房屋数据', icon: 'OfficeBuilding' },
      },
      {
        path: 'bazi',
        name: 'bazi',
        component: () => import('@/views/BaziListView.vue'),
        meta: { title: '命理档案', icon: 'Tickets' },
      },
      {
        path: 'schemes',
        name: 'schemes',
        component: () => import('@/views/SchemeListView.vue'),
        meta: { title: '方案库', icon: 'PictureFilled' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面不存在', public: true },
  },
]

const router = createRouter({
  // base 取 vite 的 base（部署为 /admin/ 时即 /admin/）。
  // 不能用默认值：不带 base 时 router.replace('/dashboard') 会跳出 /admin 前缀，
  // 请求打到根路径，被服务端的 SPA 回退返回 Flutter 首页（踩过一次）。
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const logged = Boolean(getToken())

  // 未登录访问受保护页面 → 带 redirect 回登录页，登录后原地返回
  if (!to.meta.public && !logged) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // 已登录还去登录页 → 直接进看板
  if (to.name === 'login' && logged) {
    return { name: 'dashboard' }
  }
  return true
})

router.afterEach((to) => {
  const title = to.meta.title
  document.title = title ? `${title} · 风水装修管理后台` : '风水装修管理后台'
})

export default router
