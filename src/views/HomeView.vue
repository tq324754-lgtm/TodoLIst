<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, watch, onMounted } from "vue"
import { Delete } from '@element-plus/icons-vue'
import { computed } from 'vue'
import * as echarts from 'echarts'
import { useTodoStore } from '@/stores/todo'

const todoStore = useTodoStore()
const inputRef = ref<HTMLTextAreaElement | null>(null)
const newTodo = ref("")
const filter = ref<'all' | 'done' | 'todo'>('all')
const showInput = ref(false)
//echart
const chartRef =  ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
const editingId = ref<number | null>(null)
const editingText = ref("")


const filteredTodos = computed(() => {
  if (filter.value === 'done') {
    return todoStore.todos.filter(t => t.done)
  }
  if (filter.value === 'todo') {
    return todoStore.todos.filter(t => !t.done)
  }
  return todoStore.todos
})

type Todo = {
  id: number
  text: string
  done: boolean
}


// 直接使用 todoStore.todos，不需要额外的 computed 属性
//页面加载时读取 LOcalStorage 中的数据
onMounted(() => {
  //初始化
  todoStore.init()
  // 读取数据


  // 初始化图表
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
  }

  // 点击外部关闭输入框
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement
    if (!target.closest(".input-area")) {
      showInput.value = false
    }
  })
})

//监听自动聚焦
watch(showInput, (val) => {
  if(val) {
    setTimeout(() => {
      inputRef.value?.focus()
    }, 0)
  }
})
watch(
  () => todoStore.todos,
  () => {
    updateChart()
  },
  { deep: true }
)
function addTodo() {
  const value = newTodo.value.trim()
  if(!value) {
    ElMessage.error("任务不能为空")
    return
  }
  if(!newTodo.value) return

  todoStore.addTodo({
    id: Date.now(),
    text: value,
    done: false
  })

  newTodo.value = ""
  showInput.value = false

  updateChart()
}

function removeTodo(id: number) {
  todoStore.removeTodo(id)

  updateChart()
}

//清空
function clearDone() {
  todoStore.clearDone()
  updateChart()
}

// 输入框自动撑高
function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}


// 图表
function updateChart() {
  if (!chart) return

  const doneCount = todoStore.todos.filter(t => t.done).length
  const todoCount = todoStore.todos.length - doneCount

  chart.setOption({
    title: {
      text: '任务完成情况',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: [
          { value: doneCount, name: '已完成' },
          { value: todoCount, name: '未完成' }
        ]
      }
    ]
  }, true)
}

// 跳动+编辑
function startEdit(todo: any) {
  editingId.value = todo.id
  editingText.value = todo.text
}
// 保存编辑
function saveEdit(todo: any) {
  const value = editingText.value.trim()
  if (!value) return

  todo.text = value
  editingId.value = null
}
</script>

<template>
   <div class="container">
    <el-card>
      <h2>Todo List</h2>

      <!-- 输入区域 -->

      <div class="input-area" @click.stop>
        <el-button
          v-if="!showInput"
          type="primary"
          @click.stop="showInput = true"
          circle
        >
          +
        </el-button>
        <transition name="fade-slide">
          <textarea
            v-if="showInput"
            class="auto-textarea"
            ref="inputRef"
            v-model="newTodo"
            placeholder="输入任务"
            @input="autoResize"
            @keyup.enter.exact="addTodo"
          />
        </transition>

      </div>
      <div class="filters">
  <button @click="filter = 'all'">全部</button>
  <button @click="filter = 'todo'">未完成</button>
  <button @click="filter = 'done'">已完成</button>
  <button @click="clearDone">清空已完成</button>

</div>
<!-- 图表 -->
<div ref="chartRef" class="chart"></div>
      <!-- 列表 -->
      <div class="list-wrapper">
        <ul>
          <li
          v-for="todo in filteredTodos"
          :key="todo.id"
          class="todo-item"
          @click="startEdit(todo)"
          :class="{ bounce: editingId === todo.id }"
          >
            <div class="item-left">
              <el-checkbox v-model="todo.done" @click.stop/>
              <!-- 编辑状态 -->
              <input
              v-if="editingId === todo.id"
              v-model="editingText"
              class="edit-input"
              @keyup.enter="saveEdit(todo)"
              @click.stop
              />
              <!-- 正常状态 -->
              <span
                v-else
                class="todo-text"
                :class="{ 'is-done': todo.done }"
              >
                {{ todo.text }}
              </span>
            </div>

            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              plain
              @click="removeTodo(todo.id)"
            />
          </li>
        </ul>
      </div>
      <p v-if="todoStore.todos.length === 0">暂无任务</p>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
$primary: #409eff;
$danger: #f56c6c;
$text-main: #303133;
$text-secondary: #a8abb2;
$border-color: #ccc;
$bg-hover: #f5f7fa;

// 卡片阴影（mixin🔥）
@mixin card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

// flex 居中
@mixin flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.container {
  width: 600px;
  margin: 0 auto;

  .auto-textarea {
    width: 100%;
    min-height: 40px;
    max-height: 200px;
    resize: none;
    overflow: hidden;
    padding: 8px;
    font-size: 16px;
  }

  .input-area {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  input {
    flex: 1;
    padding: 8px;
    font-size: 16px;
  }

  button {
    padding: 8px 16px;
    cursor: pointer;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .todo-item {
    @include flex-between;
    padding: 12px 10px;
    border-bottom: 1px solid $border-color;
    border-radius: 4px;
    transition: all 0.3s;

    &:hover {
      background-color: $bg-hover;
      transform: translateY(-1px); // 🔥 微动效
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .todo-text {
      font-size: 14px;
      color: $text-main;
      transition: all 0.3s;

      &.is-done {
        text-decoration: line-through;
        color: $text-secondary;
      }
    }
  }

  // 删除按钮（你也可以不用）
  .delete-btn {
    background-color: $danger;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
  }

  // 输入框动画
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: all 0.3s ease;
  }

  .fade-slide-enter-from,
  .fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }

  // 图表
  .chart {
    width: 100%;
    height: 300px;
    margin-top: 20px;
  }

  // 点击跳动
  .bounce {
    animation: bounce 0.3s;
  }

  @keyframes bounce {
    0% { transform: scale(1); }
    30% { transform: scale(1.05); }
    60% { transform: scale(0.98); }
    100% { transform: scale(1); }
  }

  // 编辑输入框
  .edit-input {
    font-size: 14px;
    padding: 4px 6px;
    border: 1px solid $border-color;
    border-radius: 4px;
    transition: all 0.2s;

    &:focus {
      border-color: $primary;
      outline: none;
      box-shadow: 0 0 4px rgba(64,158,255,0.5);
    }
  }
}
</style>
