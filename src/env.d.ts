/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 增强 vue-router 的 meta 类型，让路由配置里的自定义字段有提示
declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题，用于侧边栏与 document.title */
    title?: string
    /** 是否为免登录页面 */
    public?: boolean
    /** 是否在侧边栏隐藏 */
    hidden?: boolean
    /** 侧边栏图标组件名（Element Plus Icons） */
    icon?: string
  }
}
