<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { login } from '@/stores/auth'

const router = useRouter()
const route = useRoute()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const admin = await login(form.username.trim(), form.password)
    ElMessage.success(`欢迎回来，${admin.display_name || admin.username}`)

    // 带 redirect 时原地返回，否则进看板
    const redirect = route.query.redirect
    const target = typeof redirect === 'string' && redirect ? redirect : '/dashboard'
    await router.replace(target)
  } catch {
    // 错误提示已由 axios 拦截器统一处理，这里只需要恢复按钮状态
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <el-card class="login__card" shadow="never">
      <div class="login__head">
        <el-icon class="login__icon"><Compass /></el-icon>
        <h1 class="login__title">风水装修 · 管理后台</h1>
        <p class="login__sub">请使用管理员账号登录</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @keyup.enter="handleSubmit"
      >
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="管理员账号" clearable>
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="登录密码"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="login__submit"
          :loading="loading"
          @click="handleSubmit"
        >
          登 录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: #f0f2f5;
}

.login__card {
  width: 100%;
  max-width: 400px;
  padding: 8px;
  border-radius: 12px;
}

.login__head {
  margin-bottom: 24px;
  text-align: center;
}

.login__icon {
  font-size: 34px;
  color: var(--el-color-primary);
}

.login__title {
  margin: 10px 0 4px;
  font-size: 19px;
  font-weight: 500;
}

.login__sub {
  margin: 0;
  color: var(--admin-text-secondary);
  font-size: 13px;
}

.login__submit {
  width: 100%;
  margin-top: 4px;
}
</style>
