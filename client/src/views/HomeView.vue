<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useTodoStore } from '@/stores/todo'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { CheckboxValueType } from 'element-plus'
import { useTheme } from '@/hooks/useTheme'

const todoStore = useTodoStore()

const newTodo = ref('')
const filter = ref<'all' | 'done' | 'todo'>('all')
const editingId = ref<number | null>(null)
const editingText = ref('')
const { dark, toggleTheme } = useTheme()
// 弹窗状态
const editDialogVisible = ref(false)
// 编辑表单数据
const editForm = reactive({
  id: '',
  title:'',
  completed: false
})
//图表
const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

// 2. 监听主题变化 → 执行图表 resize （只在当前页面生效）
watch(dark, () => {
  chart?.resize() // 直接用当前页面的 chart 实例，绝对不会错
})

//初始化
onMounted(() => {
  todoStore.fetchTodos()

  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
  }
})

//监听更新图表
watch(
  () => todoStore.todos,
  () => updateChart(),
  { deep: true },
)

//筛选
const filteredTodos = computed(() => {
  if (filter.value === 'done') {
    return todoStore.todos.filter((t) => t.done)
  }
  if (filter.value === 'todo') {
    return todoStore.todos.filter((t) => !t.done)
  }
  return todoStore.todos
})

//添加
async function addTodo() {
  const value = newTodo.value.trim()
  if (!value) {
    ElMessage.error('任务不能为空')
    return
  }
  await todoStore.addTodo(value)
  newTodo.value = '' // 清空输入框
}

//删除
// 完善删除函数：加确认弹窗，防止误删
// 删除任务
async function removeTodo(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这条任务吗？删除后无法恢复', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 只有点确定才会执行这里
    await todoStore.removeTodo(id)
  } catch (error) {
    // 取消删除 → 不做任何提示
  }
}
//切换完成状态
async function toggleTodo(todo: any) {
  await todoStore.toggleTodo(todo)
}

//开始编辑
function startEdit(todo: any) {
  editingId.value = todo.id
  editingText.value = todo.text
}

//保存编辑
async function saveEdit(todo: any) {
  const value = editingText.value.trim()
  if (!value) return

  await todoStore.updateTodo(todo, value)
  editingId.value = null

}

//更新图表
function updateChart() {
  if (!chart) return

  const done = todoStore.todos.filter((t) => t.done).length
  const todo = todoStore.todos.length - done

  chart.setOption({
    title: { text: '任务完成情况', left: 'center', color: dark.value ? '#fff' : '#333' },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: [
          { value: done, name: '已完成' },
          { value: todo, name: '未完成' },
        ],
        label: { color: dark.value ? '#fff' : '#333' },
      },
    ],
  })
}

// 编辑任务 弹窗
// 打开弹窗，把当前任务的数据塞进去
const openEditDialog = (task) => {
  editForm.id = task.id
  editForm.title = task.title
  editForm.completed = task.completed
  editDialogVisible.value = true
}

// 确认修改
const confirmEdit = async () => {
  try {
    // 调用 Pinia 方法
    await todoStore.updateTodoTextAndDone(
      Number(editForm.id),
      editForm.title,
      editForm.completed
    )
    editDialogVisible.value = false
    ElMessage.success('修改成功')
  } catch (err) {
    ElMessage.error('修改失败')
  }
}
</script>

<template>
  <div class="container">
    <h2>Todo List</h2>

    <!-- 黑夜模式 -->
    <button @click="toggleTheme" class="dark-btn">
      {{ dark ? '🌙' : '🌞' }}
    </button>
    <!-- 输入 -->
    <div class="input-area">
      <input v-model="newTodo" @keyup.enter="addTodo" placeholder="输入任务吧" />
      <button @click="addTodo">添加</button>
    </div>

    <!-- 筛选 -->
    <div class="filters">
      <button @click="filter = 'all'">全部</button>
      <button @click="filter = 'todo'">未完成</button>
      <button @click="filter = 'done'">已完成</button>
    </div>

    <!-- 图表 -->
    <div ref="chartRef" class="chart"></div>

    <!-- 列表 -->
    <div class="todo-list-wrapper mt-5">
      <el-card v-for="todo in filteredTodos" :key="todo.id" shadow="hover" class="todo-card">
        <div class="flex items-center justify-between gap-3">
          <!-- 复选框 -->
          <input type="checkbox" :checked="todo.done" @change="toggleTodo(todo)" @click.stop />

          <!-- 编辑输入框 -->
          <!-- <input
            v-if="editingId === todo.id"
            v-model="editingText"
            @keyup.enter="saveEdit(todo)"
            class="flex-1 px-2 py-1 border border-blue-500 rounded outline-none"
          /> -->

          <!-- 文本 -->
          <span

            :class="{ done: todo.done }"
            @click.stop="startEdit(todo)"
            class="flex-1 cursor-pointer text-base"
          >
            {{ todo.text }}
          </span>
          <!-- 编辑文本 -->
          <el-button
          type="primary"
          icon="Edit"
          circle
          size="small"
          @click="openEditDialog(todo)">

          </el-button>
          <!-- 删除按钮 -->
          <el-button
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click.stop="removeTodo(todo.id)"
          >
          </el-button>

        </div>
      </el-card>

    </div>
     <!-- 编辑弹窗 -->

      <el-dialog
    v-model="editDialogVisible"
    title="编辑任务"
    width="400px"
  >
    <el-form :model="editForm" label-width="60px">
      <el-form-item label="任务">
        <el-input v-model="editForm.title" placeholder="请输入任务内容" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="editForm.completed">
          <el-option label="未完成" :value="false" />
          <el-option label="已完成" :value="true" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">确认修改</el-button>
      </div>
    </template>
  </el-dialog>
  </div>
</template>

<style lang="scss">
$primary: #409eff;
$danger: #f56c6c;

:root {
  --bg: #ffffff;
  --text: #303133;
  --border: #e4e7ed;
  --card: #ffffff;
  --hover: #f5f7fa;
  --gap: 8px;
}

html[data-theme="dark"] {
  --bg: #1e1e1e;
  --text: #e5eaf3;
  --border: #444;
  --card: #2a2a2a;
  --hover: #333;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

body {
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding: 10px;
}

/* 👉 1. 容器：绝对居中，不干扰卡片 */
.container {
  width: 90%;
  max-width: 600px;
  margin: 30px auto; /* 👈 强制水平居中 */
  padding: calc(var(--gap) * 2);
}

h2 {
  text-align: center;
  font-size: clamp(1.2rem, 5vw, 1.5rem);
  margin-bottom: calc(var(--gap) * 3);
}

/* 👉 2. 主题按钮：简单居中 */
.dark-btn {
  display: block;
  margin: 0 auto calc(var(--gap) * 2);
  padding: calc(var(--gap)) calc(var(--gap) * 2);
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  border-radius: 4px;
  cursor: pointer;
  font-size: clamp(0.85rem, 3vw, 0.95rem);
}

.input-area {
  display: flex;
  gap: var(--gap);
  margin-bottom: calc(var(--gap) * 2);
  width: 100%;
}

.input-area input {
  flex: 1;
  padding: calc(var(--gap) + 2px);
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--card);
  color: var(--text)!important;
  outline: none;
  font-size: clamp(0.9rem, 3.5vw, 1rem);

  &:focus {
    border-color: $primary;
  }
}

.input-area button {
  padding: 0 calc(var(--gap) * 2);
  background: $primary;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  font-size: clamp(0.85rem, 3vw, 0.95rem);
}

.filters {
  display: flex;
  gap: var(--gap);
  margin-bottom: calc(var(--gap) * 3);
  flex-wrap: wrap;
}

.filters button {
  padding: calc(var(--gap)) calc(var(--gap) * 2);
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  border-radius: 4px;
  cursor: pointer;
  font-size: clamp(0.8rem, 3vw, 0.9rem);

  &:hover {
    background: var(--hover);
  }
}

.chart {
  width: 100%;
  height: clamp(200px, 40vw, 260px);
  margin-bottom: calc(var(--gap) * 3);
  border-radius: 8px;
  background: var(--card);
}

/* 👉 3. 任务列表：彻底清除多余宽度，只保留核心 flex */
.todo-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 1.5);
  margin-top: calc(var(--gap) * 2);
}

/* 👉 4. 卡片核心样式：去掉 width，只控制内边距 */
.todo-card {
  background: var(--card) !important;
  border-color: var(--border) !important;
  transition: all 0.2s ease;
  padding: calc(var(--gap) * 2) !important; /* 👈 重要！覆盖 Element Plus 内边距 */
  border-radius: 4px;

  &:hover {
    transform: translateY(-2px);
  }

  /* 👉 5. 卡片内部：强制弹性居中 */
  > .el-card__body {
    padding: 0 !important; /* 清除 Element Plus 内部多余 padding */
  }

  .flex {
    display: flex;
    align-items: center; /* 👈 强制垂直居中 */
    justify-content: space-between; /* 👈 两端对齐 */
    gap: var(--gap);
    width: 100%; /* 保证占满宽度 */
  }
}

/* 👉 6. 文字样式：绝对居中，不跑偏 */
.todo-card .flex-1 {
  flex: 1; /* 占据中间所有空间 */
  font-size: clamp(0.9rem, 3.5vw, 1rem);
  line-height: 1.5;
  text-align: left; /* 文字左对齐 */
  color: var(--text) !important;
}

.done {
  text-decoration: line-through;
  color: #888;
}

/* 编辑输入框 */
.todo-card input[type="text"] {
  flex: 1;
  padding: calc(var(--gap));
  border: 1px solid $primary;
  border-radius: 4px;
  outline: none;
  background: var(--card);
  color: var(--text);
  font-size: clamp(0.9rem, 3.5vw, 1rem);
}
</style>
