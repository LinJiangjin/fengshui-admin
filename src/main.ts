import { createApp } from 'vue'

import * as ElementPlusIcons from '@element-plus/icons-vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import 'element-plus/dist/index.css'
import '@/styles/index.css'

import App from '@/App.vue'
import router from '@/router'

const app = createApp(App)

// 图标全量注册：管理后台里图标用量大，注册一次省去逐页 import
for (const [name, component] of Object.entries(ElementPlusIcons)) {
  app.component(name, component)
}

app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.mount('#app')
