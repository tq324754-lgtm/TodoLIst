<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useTodoStore } from '@/stores/todo'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { CheckboxValueType } from 'element-plus'
import { useTheme } from '@/hooks/useTheme'
import Draggable from 'vuedraggable'


interface Todo {
  id: number
  text: string
  done: boolean
  endTime: number
}

const todoStore = useTodoStore()

const newTodo = ref('')
const filter = ref<'all' | 'done' | 'todo'>('all')
const editingId = ref<number | null>(null)
const editingText = ref('')
const { dark, toggleTheme } = useTheme()
const editDialogVisible = ref(false)

const editForm = reactive({
  id: '',
  title: '',
  completed: false,
  minutes: 0,
  endTime: 0
})

const refresh = ref(0)
let timer: any = null

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

watch(dark, () => {
  chart?.resize()
})

onMounted(() => {
  todoStore.fetchTodos()

  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
  }

  timer = setInterval(() => refresh.value++, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

watch(
  () => todoStore.todos,
  () => updateChart(),
  { deep: true }
)

watch(
  refresh,
  () => autoCompleteTodo(),
  { immediate: true }
)

const filteredTodos = computed(() => {
  if (filter.value === 'done') return todoStore.todos.filter(t => t.done)
  if (filter.value === 'todo') return todoStore.todos.filter(t => !t.done)
  return todoStore.todos
})

async function addTodo() {
  const value = newTodo.value.trim()
  if (!value) {
    ElMessage.error('任务不能为空')
    return
  }
  await todoStore.addTodo(value)
  newTodo.value = ''
}

async function removeTodo(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这条任务吗？删除后无法恢复', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await todoStore.removeTodo(id)
  } catch (error) {}
}

async function toggleTodo(todo: Todo) {
  todo.endTime = 0
  await todoStore.toggleTodo(todo)
}

function startEdit(todo: Todo) {
  editingId.value = todo.id
  editingText.value = todo.text
}

async function saveEdit(todo: Todo) {
  const value = editingText.value.trim()
  if (!value) return
  await todoStore.updateTodo(todo, value)
  editingId.value = null
}

function updateChart() {
  if (!chart) return
  const done = todoStore.todos.filter(t => t.done).length
  const todo = todoStore.todos.length - done

  chart.setOption({
    title: { text: '任务完成情况', left: 'center', color: dark.value ? '#fff' : '#333' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: [
        { value: done, name: '已完成' },
        { value: todo, name: '未完成' },
      ],
      label: { color: dark.value ? '#fff' : '#333' },
    }]
  })
}

const openEditDialog = (todo: Todo) => {
  editForm.id = todo.id
  editForm.title = todo.text
  editForm.completed = todo.done
  editDialogVisible.value = true
}

const confirmEdit = async () => {
  const endTime = Date.now() + editForm.minutes * 60 * 1000
  await todoStore.updateTodoTextAndDone(
    Number(editForm.id),
    editForm.title,
    editForm.completed,
    endTime
  )
  editDialogVisible.value = false
  ElMessage.success('保存成功')
}

function getCountdown(todo: Todo) {
  refresh.value
  if (!todo.endTime) return ''
  const left = todo.endTime - Date.now()
  if (left <= 0) return '✅ 已结束'
  const m = Math.floor(left / 1000 / 60)
  const s = Math.floor(left / 1000 % 60)
  return `${m}分${s}秒`
}

function autoCompleteTodo() {
  const now = Date.now()
  todoStore.todos.forEach(todo => {
    if (todo.endTime && now > todo.endTime && !todo.done) {
      todoStore.updateTodoTextAndDone(todo.id, todo.text, true, todo.endTime)
    }
  })
}
</script>

<template>
  <div class="container">
    <h2>Todo List</h2>

    <button @click="toggleTheme" class="dark-btn">
      {{ dark ? '🌙' : '🌞' }}
    </button>

    <div class="input-area">
      <input v-model="newTodo" @keyup.enter="addTodo" placeholder="输入任务吧" />
      <button @click="addTodo">添加</button>
    </div>

    <div class="filters">
      <button @click="filter = 'all'">全部</button>
      <button @click="filter = 'todo'">未完成</button>
      <button @click="filter = 'done'">已完成</button>
    </div>

    <div ref="chartRef" class="chart"></div>


    <div class="todo-list-wrapper mt-5">
      <draggable
        v-model="todoStore.todos"
        item-key="id"
        handle=".drag-handle"
        :transition="300"
        style="display: flex; flex-direction: column; gap: 12px;"
      >
        <template #item="{ element }">
          <el-card shadow="hover" class="todo-card">
            <div class="flex items-center justify-between gap-3">
              <div class="drag-handle cursor-move text-gray-400">⋮⋮</div>

              <input
                type="checkbox"
                :checked="element.done"
                @change="toggleTodo(element)"
                @click.stop
              />

              <span
                :class="{ done: element.done }"
                @click.stop="startEdit(element)"
                class="flex-1 cursor-pointer text-base"
              >
                {{ element.text }}
              </span>

              <span class="text-sm text-blue-500">{{ getCountdown(element) }}</span>

              <el-button
                type="primary"
                icon="Edit"
                circle
                size="small"
                @click="openEditDialog(element)"
              />

              <el-button
                type="danger"
                :icon="Delete"
                circle
                size="small"
                @click.stop="removeTodo(element.id)"
              />
            </div>
          </el-card>
        </template>
      </draggable>
    </div>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑任务"
      width="460px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="任务">
          <el-input v-model="editForm.title" placeholder="请输入任务内容" />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="editForm.completed">
            <el-option label="未完成" :value="false" />
            <el-option label="已完成" :value="true" />
          </el-select>
        </el-form-item>

        <el-form-item label="倒计时">
          <el-input v-model.number="editForm.minutes" placeholder="输入分钟数">
            <template #append>分钟</template>
          </el-input>
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

.container {
  width: 90%;
  max-width: 600px;
  margin: 30px auto;
  padding: calc(var(--gap) * 2);
}

h2 {
  text-align: center;
  font-size: clamp(1.2rem, 5vw, 1.5rem);
  margin-bottom: calc(var(--gap) * 3);
}

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

.todo-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 1.5);
  margin-top: calc(var(--gap) * 2);
}

.todo-card {
  background: var(--card) !important;
  border-color: var(--border) !important;
  transition: all 0.2s ease;
  padding: calc(var(--gap) * 2) !important;
  border-radius: 4px;

  &:hover {
    transform: translateY(-2px);
  }

  > .el-card__body {
    padding: 0 !important;
  }

  .flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap);
    width: 100%;
  }
}

.todo-card .flex-1 {
  flex: 1;
  font-size: clamp(0.9rem, 3.5vw, 1rem);
  line-height: 1.5;
  text-align: left;
  color: var(--text) !important;
}

.done {
  text-decoration: line-through;
  color: #888;
}

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

.drag-handle {
  font-size: 18px;
  cursor: move;
  user-select: none;
  color: #999;
}
</style>
