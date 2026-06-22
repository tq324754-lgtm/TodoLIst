<template>
    <div class="statistics-page">
      <!-- 顶部标题栏 暖粉渐变 -->
      <header class="stat-header">
        <h1>数据统计</h1>
        <p>记录你的待办完成情况</p>
      </header>
  
      <!-- 顶部数据卡片组 -->
      <div class="card-wrap">
        <div class="stat-card card-1">
          <div class="card-num">{{ todayData.todayTotal }}</div>
          <div class="card-desc">今日新增待办</div>
        </div>
        <div class="stat-card card-2">
          <div class="card-num">{{ todayData.todayCompleted }}</div>
          <div class="card-desc">今日已完成</div>
        </div>
        <div class="stat-card card-3">
          <div class="card-num">{{ todayData.todayRate }}%</div>
          <div class="card-desc">今日完成率</div>
        </div>
      </div>
  
      <!-- 近7日趋势折线图 -->
      <div class="chart-box">
        <div class="chart-title">近7日待办趋势</div>
        <div id="lineChart" class="chart-content"></div>
      </div>
  
      <!-- 双图表区域：柱状图 + 饼图 -->
      <div class="chart-row">
        <div class="chart-box half-box">
          <div class="chart-title">每日完成率</div>
          <div id="barChart" class="chart-content"></div>
        </div>
        <div class="chart-box half-box">
          <div class="chart-title">待办集任务占比</div>
          <div id="pieChart" class="chart-content"></div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
  import * as echarts from 'echarts'
  import { useUserStore } from '@/stores/user'
  import { useThemeStore } from '@/stores/theme'
  import { getTodayStats, getWeeklyStats } from '@/api/todo'
  import { getAllCollectionStats } from '@/api/collection'
  import { ElMessage } from 'element-plus'
  
  const userStore = useUserStore()
  const themeStore = useThemeStore()
  const userId = userStore.isLoggedIn && userStore.userId ? userStore.userId : undefined
  
  // 数据定义
  const todayData = ref({
    todayTotal: 0,
    todayCompleted: 0,
    todayRate: 0
  })
  const weeklyData = ref<Array<{ dateLabel: string; total: number; completed: number; rate: number }>>([])
  const collectionPieData = ref<Array<{ name: string; value: number; completed: number }>>([])
  
  // 图表实例（销毁用）
  let lineChart: echarts.ECharts | null = null
  let barChart: echarts.ECharts | null = null
  let pieChart: echarts.ECharts | null = null
  
  // 获取所有统计数据
  async function getAllStats() {
  try {
    // 1. 今日数据
    const todayRes = await getTodayStats(userId || '')
    todayData.value = todayRes.data.data

    // 2. 七日数据
    const weeklyRes = await getWeeklyStats(userId || '')
    weeklyData.value = weeklyRes.data.data

    // 3. 集合饼图数据
    const pieRes = await getAllCollectionStats(userId || '')
    collectionPieData.value = pieRes.data.data

    await nextTick()
    initAllChart()
  } catch (err) {
    ElMessage.error('加载统计数据失败')
    console.error(err)
  }
}
  
  const chartTextColor = () => themeStore.isDark ? '#e5eaf3' : '#444'

  // 初始化所有图表
  function initAllChart() {
    initLineChart()
    initBarChart()
    initPieChart()
  }
  
  // 1. 折线图 - 七日新增/完成趋势
  function initLineChart() {
    const dom = document.getElementById('lineChart')
    if (!dom) return
    lineChart?.dispose()
    lineChart = echarts.init(dom)
  
    const xData = weeklyData.value.map(item => item.dateLabel)
    const totalData = weeklyData.value.map(item => item.total)
    const completedData = weeklyData.value.map(item => item.completed)
  
    const textColor = chartTextColor()
    const option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增待办', '已完成'], top: 0, textStyle: { color: textColor } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: xData, axisLabel: { color: textColor } },
      yAxis: { type: 'value', axisLabel: { color: textColor } },
      series: [
        {
          name: '新增待办',
          type: 'line',
          smooth: true,
          data: totalData,
          itemStyle: { color: '#f67280' },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0, color: 'rgba(246, 114, 128, 0.3)'
          }, {
            offset: 1, color: 'rgba(246, 114, 128, 0.05)'
          }]) }
        },
        {
          name: '已完成',
          type: 'line',
          smooth: true,
          data: completedData,
          itemStyle: { color: '#c06c84' },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0, color: 'rgba(192, 108, 132, 0.3)'
          }, {
            offset: 1, color: 'rgba(192, 108, 132, 0.05)'
          }]) }
        }
      ]
    }
    lineChart.setOption(option)
  }
  
  // 2. 柱状图 - 每日完成率
  function initBarChart() {
    const dom = document.getElementById('barChart')
    if (!dom) return
    barChart?.dispose()
    barChart = echarts.init(dom)
  
    const xData = weeklyData.value.map(item => item.dateLabel)
    const rateData = weeklyData.value.map(item => item.rate)
  
    const textColor = chartTextColor()
    const option = {
      tooltip: { trigger: 'axis', formatter: '{b} : {c} %' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: xData, axisLabel: { color: textColor } },
      yAxis: { type: 'value', max: 100, axisLabel: { color: textColor } },
      series: [
        {
          type: 'bar',
          data: rateData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#6c5b7b' },
              { offset: 1, color: '#c06c84' }
            ])
          },
          barWidth: '40%'
        }
      ]
    }
    barChart.setOption(option)
  }
  
  // 3. 饼图 - 待办集占比
  function initPieChart() {
    const dom = document.getElementById('pieChart')
    if (!dom) return
    pieChart?.dispose()
    pieChart = echarts.init(dom)
  
    const pieData = collectionPieData.value.map(item => ({
      name: item.name,
      value: item.value
    }))
  
    // 自定义暖色系配色（无蓝色）
    const colorList = ['#f8b195', '#f67280', '#c06c84', '#6c5b7b', '#a89cc8']
  
    const option = {
      tooltip: { trigger: 'item', formatter: '{b} : {c} 项 ({d}%)' },
      series: [
        {
          type: 'pie',
          radius: '70%',
          data: pieData,
          color: colorList
        }
      ]
    }
    pieChart.setOption(option)
  }
  
  // 窗口自适应图表
  function resizeChart() {
    lineChart?.resize()
    barChart?.resize()
    pieChart?.resize()
  }
  
  watch(() => themeStore.isDark, () => {
    initAllChart()
  })

  onMounted(() => {
    getAllStats()
    window.addEventListener('resize', resizeChart)
  })
  
  // 页面销毁，释放图表实例
  onUnmounted(() => {
    window.removeEventListener('resize', resizeChart)
    lineChart?.dispose()
    barChart?.dispose()
    pieChart?.dispose()
  })
  </script>
  
  <style scoped lang="scss">
  .statistics-page {
    min-height: 100vh;
    background-color: var(--page-bg);
    padding-bottom: 40px;
  }
  
  // 顶部渐变标题栏
  .stat-header {
    background: linear-gradient(135deg, #f8b195 0%, #f67280 100%);
    padding: 24px 20px;
    color: #fff;
    h1 {
      margin: 0 0 6px;
      font-size: 22px;
      font-weight: 600;
    }
    p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
  }
  
  // 数据卡片组
  .card-wrap {
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    flex-wrap: wrap;
  }
  .stat-card {
    flex: 1;
    min-width: 100px;
    padding: 20px 12px;
    border-radius: 12px;
    text-align: center;
    color: #fff;
  }
  .card-1 {
    background: linear-gradient(135deg, #f8b195, #f6a08a);
  }
  .card-2 {
    background: linear-gradient(135deg, #f67280, #e86470);
  }
  .card-3 {
    background: linear-gradient(135deg, #c06c84, #b25c74);
  }
  .card-num {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .card-desc {
    font-size: 13px;
    opacity: 0.95;
  }
  
  // 图表通用样式
  .chart-box {
    margin: 16px 20px;
    padding: 16px;
    background: var(--card);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .chart-title {
    font-size: 15px;
    color: var(--text);
    margin-bottom: 12px;
    font-weight: 500;
  }
  .chart-content {
    width: 100%;
    height: 280px;
  }
  
  // 双图表行布局
  .chart-row {
    display: flex;
    gap: 16px;
    padding: 0 20px;
    flex-wrap: wrap;
  }
  .half-box {
    flex: 1;
    min-width: 300px;
    margin: 0;
  }
  </style>