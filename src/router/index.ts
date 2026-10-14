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
  history: createWebHistory(),
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
