<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminDashboard } from '@/api/admin'
import { ElMessage } from 'element-plus'
import {
  User,
  Document,
  FolderOpened,
  ArrowUp,
  ArrowDown,
  UserFilled,
  List,
  DataLine
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const router = useRouter()
const loading = ref(true)

// 卡片数据
const cards = ref({
  totalUsers: 0,
  todayUserCount: 0,
  totalTodos: 0,
  todayTodoCount: 0,
  totalCollections: 0
})

// 趋势数据
const userTrend = ref<{ date: string; count: number }[]>([])
const todoTrend = ref<{ date: string; count: number }[]>([])

// 图表实例
let userChart: echarts.ECharts | null = null
let todoChart: echarts.ECharts | null = null

const userChartRef = ref<HTMLElement>()
const todoChartRef = ref<HTMLElement>()

// 卡片配置
const cardConfigs = [
  {
    title: '总用户数',
    key: 'totalUsers',
    icon: UserFilled,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    subKey: 'todayUserCount',
    subLabel: '今日新增'
  },
  {
    title: '今日新增用户',
    key: 'todayUserCount',
    icon: User,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    subKey: null,
    subLabel: ''
  },
  {
    title: '全站待办数',
    key: 'totalTodos',
    icon: Document,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    subKey: 'todayTodoCount',
    subLabel: '今日新增'
  },
  {
    title: '今日新增待办',
    key: 'todayTodoCount',
    icon: List,
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    subKey: null,
    subLabel: ''
  },
  {
    title: '待办集总数',
    key: 'totalCollections',
    icon: FolderOpened,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    subKey: null,
    subLabel: ''
  }
]

// 加载数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAdminDashboard()
    if (res.data.success) {
      cards.value = res.data.data.cards
      userTrend.value = res.data.data.trends.userTrend
      todoTrend.value = res.data.data.trends.todoTrend
      await nextTick()
      initCharts()
    } else {
      ElMessage.error('加载仪表盘数据失败')
    }
  } catch (err: any) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      ElMessage.error('无管理员权限，请重新登录')
      router.push('/todo')
    } else {
      ElMessage.error('网络错误')
    }
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  // 用户趋势 - 折线图
  if (userChartRef.value) {
    userChart = echarts.init(userChartRef.value)
    userChart.setOption({
      title: {
        text: '近 7 日新增用户',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600, color: '#303133' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderColor: '#eee',
        textStyle: { color: '#333' }
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '12%',
        top: '20%'
      },
      xAxis: {
        type: 'category',
        data: userTrend.value.map(item => item.date),
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: { color: '#999' }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#999' }
      },
      series: [
        {
          data: userTrend.value.map(item => item.count),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ])
          },
          itemStyle: { color: '#667eea', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.02)' }
            ])
          }
        }
      ]
    })
  }

  // 待办趋势 - 柱状图
  if (todoChartRef.value) {
    todoChart = echarts.init(todoChartRef.value)
    todoChart.setOption({
      title: {
        text: '近 7 日全站待办',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600, color: '#303133' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderColor: '#eee',
        textStyle: { color: '#333' }
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '12%',
        top: '20%'
      },
      xAxis: {
        type: 'category',
        data: todoTrend.value.map(item => item.date),
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: { color: '#999' }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#999' }
      },
      series: [
        {
          data: todoTrend.value.map(item => item.count),
          type: 'bar',
          barWidth: '40%',
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4facfe' },
              { offset: 1, color: '#00f2fe' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#337ecc' },
                { offset: 1, color: '#4facfe' }
              ])
            }
          }
        }
      ]
    })
  }
}

// 快捷操作
const goUserManage = () => {
  ElMessage.info('用户管理模块即将推出')
}
const goTodoManage = () => {
  ElMessage.info('待办管理模块即将推出')
}
const goCleanup = () => {
  ElMessage.info('数据清理模块即将推出')
}

// 窗口 resize 自适应
const handleResize = () => {
  userChart?.resize()
  todoChart?.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  userChart?.dispose()
  todoChart?.dispose()
})
</script>

<template>
  <div class="dashboard" v-loading="loading">
    <!-- 数据卡片区域 -->
    <div class="cards-row">
      <div
        v-for="config in cardConfigs"
        :key="config.key"
        class="stat-card"
        :style="{ background: config.gradient }"
      >
        <div class="card-content">
          <div class="card-info">
            <p class="card-title">{{ config.title }}</p>
            <h2 class="card-value">{{ (cards as any)[config.key] }}</h2>
            <p v-if="config.subKey" class="card-sub">
              {{ config.subLabel }}：{{ (cards as any)[config.subKey] }}
            </p>
          </div>
          <div class="card-icon">
            <el-icon :size="40"><component :is="config.icon" /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <el-card shadow="hover" class="chart-card">
        <div ref="userChartRef" class="chart-container"></div>
      </el-card>
      <el-card shadow="hover" class="chart-card">
        <div ref="todoChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 快捷操作区域 -->
    <el-card shadow="hover" class="quick-actions-card">
      <template #header>
        <div class="card-header">
          <el-icon><DataLine /></el-icon>
          <span>快捷操作</span>
        </div>
      </template>
      <div class="quick-actions">
        <el-button type="primary" size="large" @click="goUserManage">
          <el-icon><User /></el-icon>
          用户管理
        </el-button>
        <el-button type="success" size="large" @click="goTodoManage">
          <el-icon><List /></el-icon>
          待办管理
        </el-button>
        <el-button type="warning" size="large" @click="goCleanup">
          <el-icon><FolderOpened /></el-icon>
          数据清理
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  min-height: 100%;
}

/* 卡片行 */
.cards-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: default;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  .card-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-title {
    font-size: 13px;
    opacity: 0.85;
    margin-bottom: 8px;
  }

  .card-value {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
  }

  .card-sub {
    font-size: 12px;
    opacity: 0.7;
    margin-top: 6px;
  }

  .card-icon {
    opacity: 0.3;
    font-size: 40px;
  }
}

/* 图表行 */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}

.chart-container {
  width: 100%;
  height: 320px;
}

/* 快捷操作 */
.quick-actions-card {
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }
}

.quick-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  .el-button {
    min-width: 140px;
    height: 48px;
    font-size: 14px;
    border-radius: 10px;
  }
}

/* 响应式 */
@media (max-width: 1200px) {
  .cards-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .cards-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
