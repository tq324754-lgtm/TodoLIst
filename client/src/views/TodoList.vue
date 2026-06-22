<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useTodoStore } from '@/stores/todo'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useTheme } from '@/hooks/useTheme'
import  Draggable  from 'vuedraggable'
import request from '@/utils/request'
import type { Todo } from '@/types/todo'

const todoStore = useTodoStore()
const { dark, toggleTheme } = useTheme()

const newTodo = ref('')
const filter = ref<'all' | 'done' | 'todo'>('all')
const editDialogVisible = ref(false)
const refresh = ref(0)

let _timer: number | undefined = undefined

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

// ====================== 登录/本地/云端 核心 ======================
const userId = ref<string | null>(localStorage.getItem('userId') || null)
const LOCAL_KEY = 'todo_local_list'

interface RemoteTodo {
  _id: number
  text: string
  done: boolean
  endTime?: number
}

// 统一获取任务：登录=云端，未登录=本地
// 统一获取任务：登录=云端，未登录=本地
const getList = async () => {
  if (userId.value) {
    const res = await request.get<RemoteTodo[]>('/api/todos', {
      params: { userId: userId.value }
    })
    // 就这里！把 res.data.map 改成 res.map 就好！
    const remoteTodos = res.data.map((item) => ({
      id: item._id,
      text: item.text,
      done: item.done,
      endTime: item.endTime || 0
    }))
    todoStore.initTodos(remoteTodos)
  } else {
    const local = localStorage.getItem(LOCAL_KEY)
    let localTodos: Todo[] = []
    if (local) {
      try {
        localTodos = JSON.parse(local) as Todo[]
      } catch {
        localTodos = []
      }
    }
    todoStore.initTodos(localTodos)
  }
}

// 保存到本地（未登录用）
const saveLocal = () => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(todoStore.todos))
}

// ====================== 原逻辑保留 ======================
const editForm = reactive({
  id: 0,
  title: '',
  completed: false,
  minutes: 0,
  endTime: 0
})

watch(dark, () => chart?.resize())

onMounted(() => {
  getList()

  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
  }

  _timer = setInterval(() => refresh.value++, 1000)
})

onUnmounted(() => {
  if (_timer) clearInterval(_timer)
  if (chart) {
    chart.dispose()
    chart = null
  }
})

watch(
  () => todoStore.todos,
  () => {
    updateChart()
    if (!userId.value) saveLocal()
  },
  { deep: true }
)

watch(refresh, () => autoCompleteTodo(), { immediate: true })

const filteredTodos = computed(() => {
  if (filter.value === 'done') return todoStore.todos.filter(t => t.done)
  if (filter.value === 'todo') return todoStore.todos.filter(t => !t.done)
  return todoStore.todos
})

// 添加任务
async function addTodo() {
  const value = newTodo.value.trim()
  if (!value) {
    ElMessage.error('任务不能为空')
    return
  }

  const newTask = {
    text: value,
    done: false,
    endTime: 0
  }

  if (userId.value) {
    await request.post('/api/todos', {
      ...newTask,
      userId: userId.value
    })
  } else {
    todoStore.addTodoLocal({
      id: Date.now(),
      ...newTask
    })
    saveLocal()
  }

  newTodo.value = ''
  getList()
}

// 删除任务
async function removeTodo(id: number) {
  try {
    await ElMessageBox.confirm('确定删除？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    if (userId.value) {
      await request.delete(`/api/todos/${id}`)
    } else {
      todoStore.removeTodoLocal(id)
      saveLocal()
    }
    getList()
  } catch {}
}

// 切换完成状态
async function toggleTodo(todo: Todo) {
  todo.endTime = 0

  if (userId.value) {
    await request.put(`/api/todos/${todo.id}`, {
      done: !todo.done
    })
  } else {
    todoStore.toggleTodoLocal(todo)
    saveLocal()
  }
  getList()
}

// 图表
function updateChart() {
  if (!chart) return
  const done = todoStore.todos.filter(t => t.done).length
  const todoCnt = todoStore.todos.length - done

  chart.setOption({
    title: { text: '任务完成情况', left: 'center', color: dark.value ? '#fff' : '#333' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: [
        { value: done, name: '已完成' },
        { value: todoCnt, name: '未完成' },
      ],
      label: { color: dark.value ? '#fff' : '#333' },
    }]
  })
}

// 弹窗编辑
const openEditDialog = (todo: Todo) => {
  editForm.id = todo.id
  editForm.title = todo.text
  editForm.completed = todo.done
  editDialogVisible.value = true
}

const confirmEdit = async () => {
  const endTime = Date.now() + editForm.minutes * 60 * 1000

  if (userId.value) {
    await request.put(`/api/todos/${editForm.id}`, {
      text: editForm.title,
      done: editForm.completed,
      endTime
    })
  } else {
    todoStore.updateTodoTextAndDoneLocal(
      Number(editForm.id),
      editForm.title,
      editForm.completed,
      endTime
    )
    saveLocal()
  }

  editDialogVisible.value = false
  ElMessage.success('保存成功')
  getList()
}

// 倒计时
function getCountdown(todo: Todo) {
  if (!todo.endTime) return ''
  const left = todo.endTime - Date.now()
  if (left <= 0) return '✅ 已结束'
  const m = Math.floor(left / 1000 / 60)
  const s = Math.floor(left / 1000 % 60)
  return `${m}分${s}秒`
}

// 自动完成
async function autoCompleteTodo() {
  const now = Date.now()
  for (const todo of todoStore.todos) {
    if (todo.endTime && now > todo.endTime && !todo.done) {
      if (userId.value) {
        await request.put(`/api/todos/${todo.id}`, {
          text: todo.text,
          done: true,
          endTime: todo.endTime
        })
      } else {
        todoStore.updateTodoTextAndDoneLocal(todo.id, todo.text, true, todo.endTime)
      }
    }
  }
}
</script>

<template>
  <!-- eslint-disable vue/multi-word-component-names -->
  <div class="home-header">
    <h2>待办</h2>
  </div>
  <div class="container">

    <button @click="toggleTheme" class="dark-btn">
      {{ dark ? '🌙' : '🌞' }}
    </button>

    <div v-if="!userId" class="tip text-center mb-3 text-orange-500">
      ⚠️ 未登录，数据存在本地；登录后自动同步云端
    </div>

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
        v-model="filteredTodos"
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
.home-header {
  height: 60px;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 18px;
  font-weight: bold;
}

.container {
  width: 100%;
  max-width: 600px;
  flex: 1;
  overflow-y: auto;
  margin: 30px auto;
  padding: calc(var(--gap) * 2);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
}

.dark-btn {
  display: block;
  margin: 0 auto 15px;
  padding: 8px 16px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  border-radius: 4px;
  cursor: pointer;
}

.input-area {
  display: flex;
  gap: var(--gap);
  margin-bottom: 16px;
}

.input-area input {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--card);
  color: var(--text) !important;
  outline: none;
}

.input-area button {
  padding: 0 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.filters button {
  padding: 8px 12px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  border-radius: 4px;
  cursor: pointer;
}

.chart {
  width: 100%;
  height: 260px;
  margin-bottom: 20px;
  border-radius: 8px;
  background: var(--card);
}

.todo-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-card {
  background: var(--card) !important;
  border-color: var(--border) !important;
  padding: 16px !important;
  border-radius: 6px;
}

.todo-card .flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.flex-1 {
  flex: 1;
}

.done {
  text-decoration: line-through;
  color: #888;
}

.drag-handle {
  font-size: 18px;
  cursor: move;
  color: #999;
}

.tip {
  font-size: 14px;
  color: #faad14;
}
</style>
