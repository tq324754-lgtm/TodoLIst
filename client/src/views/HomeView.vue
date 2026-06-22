

<template>

  <el-container>
  <!--头部 -->
<div class="home-container">
 

</div>
  <!-- banner -->
  <div class="container-box">
      <router-view :key="$route.fullPath" />
    </div>
  <!-- footer -->
  <el-footer>
    <div class="home-footer">
       <div class="nav-item" @click="$router.push('/todo')">
        <el-icon><List /></el-icon>
        <span>待办</span>
      </div>

      <div class="nav-item" @click="$router.push('/collection-list')">
        <el-icon><List /></el-icon>
        <span>代办集</span>
      </div>

      <div class="nav-item" @click="$router.push('/statistic')">
        <el-icon><PieChart /></el-icon>
        <span>统计</span>
      </div>

      <div class="nav-item" @click="$router.push('/target')">
        <el-icon><Aim /></el-icon>
        <span>目标</span>
      </div>

      <div class="nav-item" @click="$router.push('/mine')">
        <el-icon><Avatar /></el-icon>
        <span>我的</span>
      </div>

      <div v-if="isAdmin" class="nav-item" @click="$router.push('/admin')">
        <el-icon><Setting /></el-icon>
        <span>管理</span>
      </div>
    </div>

    </el-footer>
</el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { List, PieChart, Aim, Avatar, Setting } from '@element-plus/icons-vue'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin)
</script>

<style lang="scss">
/* 容器样式 */
.el-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 内容区域 */
.container-box {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 底部导航 */
.home-footer {
  height: 60px;
  background: var(--footer-bg);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-shrink: 0;
}

/* Element Plus Footer样式 */
.el-footer {
  padding: 0;
  height: auto !important;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--text-secondary);
}

.nav-item:hover {
  color: var(--primary);
}

.nav-item span {
  font-size: 12px;
}
</style>
