<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { registerApi } from '@/api/user'

const router = useRouter()
const registerRef = ref<FormInstance>()

const registerForm = reactive({
  username: '',
  phone: '',
  password: '',
  repassword: ''
})

// 正确的 TS 校验函数（无 any、无报错）
const validatePwd = (rule: unknown, value: string, callback: (err?: Error) => void) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 校验规则
const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 12, message: '账号长度3-12位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  repassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePwd, trigger: 'blur' }
  ]
}

// 注册提交
const handleRegister = async () => {
  if (!registerRef.value) return
  const valid = await registerRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    const res = await registerApi(
      registerForm.username,
      registerForm.phone,
      registerForm.password
    )
    if (res.data.success) {
      ElMessage.success('注册成功')
      router.push('/login')
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch {
    ElMessage.error('注册失败')
  }
}
</script>

<template>
  <!-- 正常 el-form，不隐藏、不破坏、TS 完美 -->
  <el-form
    ref="registerRef"
    :model="registerForm"
    :rules="registerRules"
    class="register-form"
  >
    <div class="register-container">
      <div class="register-box">
        <h2 class="title">注册</h2>
        <label for="user">账号</label>
        <el-form-item prop="username"  label-width="auto">
          <el-input v-model="registerForm.username" />
        </el-form-item>
        <label for="user">手机号</label>
        <el-form-item prop="phone" label-width="auto">
          <el-input v-model="registerForm.phone" />
        </el-form-item>
        <label for="user">设置密码</label>
        <el-form-item prop="password" label-width="auto">
          <el-input v-model="registerForm.password" type="password" show-password />
        </el-form-item>
        <label for="user">确认密码</label>
        <el-form-item prop="repassword" label-width="auto">
          <el-input v-model="registerForm.repassword" type="password" show-password />
        </el-form-item>

        <el-form-item>
          <button class="submit-btn" @click="handleRegister">立即注册</button>
        </el-form-item>

        <div class="tip">
          <span @click="$router.push('/login')">已有账号？前往登录</span>
        </div>
      </div>
    </div>
  </el-form>
</template>

<style lang="scss" scoped>
$darkBlue: #217093;
$medBlue: #4eb8dd;
$inputBG: #f3fafd;

.register-form {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.register-container {
  width: 100%;
  max-width: 420px;
  padding: 2rem;
}

.register-box {
  background: #fff;
  padding: 2.5rem;
  border-radius: 0.5rem;

  .title {
    text-align: center;
    font-size: 1.5rem;
    color: $darkBlue;
    font-weight: 700;
    margin-bottom: 1.8rem;
  }
label {
		margin: 0 0 12px; display: block;
		font-size: 1.25em; color: #217093; font-weight: 700; font-family: inherit;
	}
  :deep(.el-form-item) {
    margin-bottom: 1.8rem;
  }

  :deep(.el-form-item__label) {
    font-size: 1.1rem;
    color: $darkBlue !important;
    font-weight: 600;
    padding: 0;
    margin-bottom: 0.6rem;
  }

  :deep(.el-input) {
    height: 65px;
    border: 0;
  }

  :deep(.el-input__wrapper) {
    height: 65px;
    background: $inputBG;
    border-radius: 4px;
    border: 2px solid $darkBlue;
    box-shadow: none;
  }

  :deep(.el-input__inner) {
    height: 65px;
    font-size: 1.4rem;
    font-weight: 600;
    color: #333;

  }

:deep(.el-input__wrapper.is-error) {
  border-color: $darkBlue;
  box-shadow: none;
}
:deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: $darkBlue !important;
  box-shadow: none !important;
  background: #f3fafd !important;
}
:deep(.el-form-item.is-error .el-input__inner) {
  -webkit-box-shadow: none !important;
  box-shadow: none !important;
}
  :deep(.el-input__wrapper.is-focus) {
    border-color: $medBlue;
  }

  :deep(.el-form-item__content) {
    line-height: normal;
  }
:deep(.el-input.is-error *) {
  border-color: $darkBlue !important;
  box-shadow: none !important;
}
  :deep(.el-form-item__error) {
    position: static;
  padding-top: 4px;
  font-size: 0.85rem;
  color:rgb(155, 26, 26);
  line-height: 1.2;

  }


  .submit-btn {
    width: 100%;
    height: 65px;
    font-size: 1.4rem;
    font-weight: 600;
    background: $medBlue;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .submit-btn:hover {
    background: $darkBlue;
  }

  .tip {
    text-align: center;
    margin-top: 1.2rem;
    color: $darkBlue;
    cursor: pointer;
  }
}
</style>
