<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  DataBoard,
  User,
  List,
  Delete,
  Setting,
  Back
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const goBack = () => {
  router.push('/todo')
}

const logout = () => {
  userStore.clearUserInfo()
  router.push('/login')
}
</script>

<template>
  <el-container class="admin-layout">
    <!-- 左侧侧边栏 -->
    <el-aside width="220px" class="admin-aside">
      <div class="admin-logo">
        <h3>管理后台</h3>
      </div>

      <el-menu
        :default-active="activeMenu"
        router
        class="admin-menu"
        background-color="#1d1e2c"
        text-color="#a3a6b7"
        active-text-color="#409eff"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>控制台</span>
        </el-menu-item>

        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/todos" disabled>
          <el-icon><List /></el-icon>
          <span>待办管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/cleanup" disabled>
          <el-icon><Delete /></el-icon>
          <span>数据清理</span>
        </el-menu-item>

        <el-menu-item index="/admin/settings" disabled>
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>

      <div class="admin-sidebar-footer">
        <el-button text @click="goBack" class="back-btn">
          <el-icon><Back /></el-icon>
          返回前台
        </el-button>
        <el-button text @click="logout" class="logout-btn" type="danger">
          退出登录
        </el-button>
      </div>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-container class="admin-main">
      <el-header class="admin-header">
        <div class="header-left">
          <span class="welcome">欢迎，{{ userStore.username }}</span>
        </div>
        <div class="header-right">
          <el-tag type="danger" size="small">管理员</el-tag>
        </div>
      </el-header>

      <el-main class="admin-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.admin-aside {
  background: #1d1e2c;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  h3 {
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 2px;
    margin: 0;
  }
}

.admin-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;

  :deep(.el-menu-item) {
    height: 50px;
    line-height: 50px;
    margin: 4px 8px;
    border-radius: 8px;

    &:hover {
      background-color: rgba(64, 158, 255, 0.1) !important;
    }

    &.is-active {
      background: linear-gradient(135deg, #409eff 0%, #337ecc 100%) !important;
      color: #fff !important;
    }

    &.is-disabled {
      opacity: 0.4;
    }
  }
}

.admin-sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;

  .back-btn,
  .logout-btn {
    color: #a3a6b7;
    justify-content: flex-start;
    width: 100%;

    &:hover {
      color: #409eff;
    }
  }

  .logout-btn:hover {
    color: #f56c6c;
  }
}

.admin-main {
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  background: #fff;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;

  .welcome {
    font-size: 14px;
    color: #606266;
  }
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
</style>
