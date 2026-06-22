<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { loginApi } from '@/api/user'

const userStore = useUserStore()


const loginForm = reactive({ username: '',password: ''})
const errors = reactive({username:'',password:''})
const router = useRouter()
const login = async () => {
   if (!validateAll()) return
  try {
    const res = await loginApi(loginForm.username, loginForm.password)
    if (res.data.success) {
      ElMessage.success('登录成功')
      userStore.setUserInfo(res.data.userId, loginForm.username, res.data.role || 'user', res.data.token || '')
      router.push('/todo')
    } else {
      ElMessage.error(res.data.msg)
    }
   } catch  {
      ElMessage.error('登录失败')
    }
  }

// 校验函数
const validateUsername = () => {
  const v = loginForm.username.trim()
  if (!v) {
    errors.username = '请输入账号'
  } else if (v.length < 3) {
    errors.username = '账号长度不能小于3个字符'
  } else {
    errors.username = ''
  }
}

// 👉 密码失焦校验
const validatePassword = () => {
  const v = loginForm.password.trim()
  if (!v) {
    errors.password = '请输入密码'
  } else if (v.length < 6) {
    errors.password = '密码长度不能小于6个字符'
  } else {
    errors.password = ''
  }
}

// 整体校验
const validateAll = () => {
  validateUsername()
  validatePassword()
  return !errors.username && !errors.password
}
</script>

<template>
  <form @submit.prevent>
<div class="login-container">
    <!-- 你要的原生表单 -->
    <div class="login-box">
      <h2 class="title">登录</h2>
      <div class="inputGroup inputGroup1">
        <label for="user">账号</label>
        <input
          type="text"
          id="email"
          class="email"
          maxlength="256"
          v-model="loginForm.username"
          @blur="validateUsername"
        />
 <p v-if="errors.username" class="err-msg">{{ errors.username }}</p>

      </div>

      <div class="inputGroup inputGroup2">
        <label for="password">密码</label>
        <input
          type="password"
          id="password"
          class="password"
          v-model="loginForm.password"
          @blur="validatePassword"
        />
        <p v-if="errors.password" class="err-msg">{{ errors.password }}</p>


      </div>

      <div class="inputGroup inputGroup3">
        <button type="button" id="login" @click="login">Log in</button>
      </div>
    </div>


  </div>
   <div class="tip">
      <span @click="$router.push('/register')" >
        没有账号？前往注册
      </span>
    </div>
  </form>

</template>



<style lang="scss" scoped>
$darkBlue: #217093;
$medBlue: #4eb8dd;
$lightBlue: #ddf1fa;
$inputBG: #f3fafd;

body {
	background-color: #eff3f4; position: relative; width: 100%; height: 100%;
	font-size: 16px; font-family: 'Source Sans Pro', sans-serif; font-weight: 400;
	-webkit-font-smoothing: antialiased;
}
button {
		display: block; margin: 0; padding: .65em 1em 1em;
		background-color: $medBlue; border: none; border-radius: 4px;
		box-sizing: border-box; box-shadow: none;
		width: 100%; height: 65px;
		font-size: 1.55em; color: #FFF; font-weight: 600; font-family: inherit;
		transition: background-color .2s ease-out;
		&:hover, &:active {
			background-color: $darkBlue;
		}
	}
form {
	position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
	display: block; width: 100%; max-width: 400px;
	margin: 0; padding: 2.25em; box-sizing: border-box;  border-radius: .5em;
	font-family: 'Source Sans Pro', sans-serif;
.inputGroup {
		margin: 0 0 2em; padding: 0; position: relative;
		&:last-of-type {
			margin-bottom: 0;
		}
	}
  .title{
    text-align:center;
    font-size: 1.25em; color: #217093; font-weight: 700; font-family: inherit;
  }
  .err-msg{
    color:rgb(155, 26, 26);
  }
	label {
		margin: 0 0 12px; display: block;
		font-size: 1.25em; color: #217093; font-weight: 700; font-family: inherit;
	}
	input[type='email'], input[type="text"], input[type='password'] {
		display: block; margin: 0; padding: 0 1em 0;
		background-color: $inputBG; border: solid 2px $darkBlue; border-radius: 4px; -webkit-appearance: none;
		box-sizing: border-box;
		width: 100%; height: 65px;
		font-size: 1.55em; color: #353538; font-weight: 600; font-family: inherit;
		transition: box-shadow .2s linear, border-color .25s ease-out;
		&:focus {
			outline: none;
			box-shadow: 0px 2px 10px rgba(0,0,0,.1);
			border: solid 2px #4eb8dd;
		}
	}
	input[type='email'], input[type="text"] {
		padding: 14px 1em 0px;
	}
	button {
		display: block; margin: 0; padding: .65em 1em 1em;
		background-color: $medBlue; border: none; border-radius: 4px;
		box-sizing: border-box; box-shadow: none;
		width: 100%; height: 65px;
		font-size: 1.55em; color: #FFF; font-weight: 600; font-family: inherit;
		transition: background-color .2s ease-out;
		&:hover, &:active {
			background-color: $darkBlue;
		}
	}
.tip {
  cursor: pointer;
}
}
</style>
