<script setup lang="ts">
import { ref } from 'vue'
import { ElAvatar, ElButton, ElMessage } from 'element-plus'
import {
  Avatar,
  Setting,
  Clock,
  SwitchButton,
  ArrowRight
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTheme } from '@/hooks/useTheme'

const router = useRouter()
const userStore = useUserStore()
const { dark, toggleTheme } = useTheme()

// 登录状态
const isLogin = ref(userStore.isLoggedIn)
const userName = ref(userStore.currentUser || '任务用户')

// 监听登录状态变化
userStore.$onAction(({ name, after }) => {
  if (name === 'setUserInfo' || name === 'clearUserInfo') {
    after(() => {
      isLogin.value = userStore.isLoggedIn
      userName.value = userStore.currentUser || '任务用户'
    })
  }
})

// 退出登录
const logout = () => {
  userStore.clearUserInfo()
  ElMessage.success('退出成功')
  router.push('/login')
}
</script>


<template>
  <div class="mine-page">
    <!-- 头部头像区域 -->
    <div class="mine-header">
      <div class="avatar-box">
        <el-avatar :size="80" src="">
          <el-icon :size="40"><Avatar /></el-icon>
        </el-avatar>
      </div>

      <!-- 未登录 / 已登录 区分 -->
      <div class="user-info" v-if="!isLogin">

        <el-button type="primary" link @click="$router.push('/login')">
          点击去登录
        </el-button>
      </div>

      <div class="user-info" v-else>
        <div class="username">{{ userName }}</div>
        <div class="desc">欢迎使用任务管理系统</div>
      </div>
    </div>

    <!-- 自定义 Banner 区域 -->
    <div class="mine-banner">
      <div class="banner-text">
        合理规划每一天<br>高效管理待办任务
      </div>
    </div>

    <!-- 功能列表 -->
    <div class="mine-list">
      <div class="list-item" @click="toggleTheme">
        <el-icon><Setting /></el-icon>
        <span>{{ dark ? '切换为浅色模式' : '切换为深色模式' }}</span>
        <span class="theme-icon">{{ dark ? '🌙' : '🌞' }}</span>
      </div>
      <div class="list-item">
        <el-icon><Clock /></el-icon>
        <span>历史记录</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
      <div class="list-item" @click="logout" v-if="isLogin">
        <el-icon><SwitchButton /></el-icon>
        <span>退出登录</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>


<style lang="scss" scoped>
.mine-page {
  padding: 16px;
  background: var(--page-bg);
  min-height: 100vh;
}

// 头像头部
.mine-header {
  background: linear-gradient(135deg, var(--primary), #ffe666);
  border-radius: 12px;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;

  color: #333;
  margin-bottom: 20px;
}

.avatar-box {
  margin-bottom: 12px;
}

.user-info {
  // text-align: center;
}

.username {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}
.desc {
  font-size: 13px;
  color: #666;
}

// 自定义banner
.mine-banner {
  background: var(--card);
  border-radius: 12px;
  padding: 24px 20px;
  margin-bottom: 20px;
  .banner-text {
    line-height: 1.8;
    color: var(--text);
    font-size: 15px;
  }
}

// 功能列表
.mine-list {
  background: var(--card);
  border-radius: 12px;
  overflow: hidden;
}
.list-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  gap: 10px;
  cursor: pointer;
  color: var(--text);
  span {
    flex: 1;
  }
  .arrow, .theme-icon {
    color: var(--text-secondary);
  }
  &:last-child {
    border-bottom: none;
  }
}
</style>
