<template>
  <div class="collection-detail-page">
    <header class="detail-header">
      <button class="back-btn" @click="router.push('/collection-list')">← 返回</button>
      <div class="header-info">
        <h2>{{ collection.name || '待办集' }}</h2>
        <span class="todo-count">{{ todos.length }} 个待办</span>
      </div>
    </header>

    <div class="detail-body">
      <div class="add-todo-form">
        <input
          v-model="newTodoContent"
          placeholder="输入待办内容，按回车添加..."
          class="todo-input"
          @keyup.enter="addTodo"
        />
        <button class="add-btn" @click="addTodo">添加</button>
      </div>

      <div class="todo-list">
        <div v-if="todos.length === 0" class="empty-tip">暂无待办事项，添加一个吧～</div>

        <div v-for="todo in todos" :key="todo._id" class="todo-item">
          <input
            v-model="todo.completed"
            type="checkbox"
            class="todo-checkbox"
            @change="updateTodoStatus(todo)"
          />
          <span :class="{ completed: todo.completed }" class="todo-content">
            {{ todo.content }}
          </span>
          <button class="delete-btn" @click="deleteTodo(todo._id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getCollectionById } from '@/api/collection'
import request from '@/api/request'
import {
  loadLocalCollections,
  loadLocalTodos,
  saveLocalTodos
} from '@/utils/collectionLocal'

interface Todo {
  _id: string
  content: string
  completed: boolean
  collectionId: string
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const collectionId = ref<string>('')
const collection = ref({ name: '' })
const todos = ref<Todo[]>([])
const newTodoContent = ref('')

watch(
  () => route.params.id,
  async (id) => {
    if (!id || typeof id !== 'string') {
      router.replace('/collection-list')
      return
    }
    collectionId.value = id
    collection.value = { name: '' }
    todos.value = []
    await getCollectionInfo()
    await getTodos()
  },
  { immediate: true }
)

async function getCollectionInfo() {
  try {
    if (userStore.isLoggedIn) {
      const res = await getCollectionById(collectionId.value)
      collection.value = { name: res.data.data.name }
    } else {
      const col = loadLocalCollections().find(c => c._id === collectionId.value)
      collection.value = { name: col?.name || '未命名集合' }
    }
  } catch {
    collection.value = { name: '未命名集合' }
  }
}

async function getTodos() {
  try {
    if (userStore.isLoggedIn) {
      const res = await request.get('/api/todos', {
        params: { collectionId: collectionId.value }
      })
      const list = res.data.data || []
      todos.value = list.map((item: { _id: string; text?: string; content?: string; done?: boolean; completed?: boolean; collectionId: string }) => ({
        _id: item._id,
        content: item.text || item.content || '',
        completed: item.done ?? item.completed ?? false,
        collectionId: item.collectionId
      }))
    } else {
      todos.value = loadLocalTodos()
        .filter(t => t.collectionId === collectionId.value)
        .map(t => ({
          _id: t._id,
          content: t.text,
          completed: t.done,
          collectionId: t.collectionId
        }))
    }
  } catch {
    ElMessage.error('获取待办列表失败')
  }
}

async function addTodo() {
  if (!newTodoContent.value.trim()) {
    ElMessage.warning('请输入待办内容')
    return
  }

  const text = newTodoContent.value.trim()

  try {
    if (userStore.isLoggedIn && userStore.userId) {
      const res = await request.post('/api/todos', {
        text,
        collectionId: collectionId.value,
        userId: userStore.userId,
        done: false
      })
      todos.value.unshift({
        _id: res.data.data._id,
        content: res.data.data.text,
        completed: false,
        collectionId: collectionId.value
      })
    } else {
      const newTodo = {
        _id: Date.now().toString(),
        text,
        done: false,
        collectionId: collectionId.value,
        createdAt: new Date().toISOString()
      }
      const all = loadLocalTodos()
      all.unshift(newTodo)
      saveLocalTodos(all)
      todos.value.unshift({
        _id: newTodo._id,
        content: text,
        completed: false,
        collectionId: collectionId.value
      })
    }
    newTodoContent.value = ''
    ElMessage.success('添加成功')
  } catch {
    ElMessage.error('添加失败')
  }
}

async function updateTodoStatus(todo: Todo) {
  try {
    if (userStore.isLoggedIn) {
      await request.put(`/api/todos/${todo._id}`, { done: todo.completed })
    } else {
      const all = loadLocalTodos().map(t =>
        t._id === todo._id ? { ...t, done: todo.completed } : t
      )
      saveLocalTodos(all)
    }
  } catch {
    todo.completed = !todo.completed
    ElMessage.error('更新失败')
  }
}

async function deleteTodo(todoId: string) {
  try {
    await ElMessageBox.confirm('确定删除这个待办吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    if (userStore.isLoggedIn) {
      await request.delete(`/api/todos/${todoId}`)
    } else {
      const all = loadLocalTodos().filter(t => t._id !== todoId)
      saveLocalTodos(all)
    }

    todos.value = todos.value.filter(item => item._id !== todoId)
    ElMessage.success('已删除')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.collection-detail-page {
  min-height: 100%;
  background: #f0f4f8;
}

.detail-header {
  background: linear-gradient(135deg, #5dade2 0%, #3498db 100%);
  color: #fff;
  padding: 12px 16px 16px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  margin-bottom: 10px;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info h2 {
  margin: 0;
  font-size: 20px;
}

.todo-count {
  font-size: 13px;
  opacity: 0.9;
}

.detail-body {
  max-width: 640px;
  margin: 0 auto;
  padding: 16px;
}

.add-todo-form {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.todo-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 15px;
  background: #fff;
}

.add-btn {
  padding: 0 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
}

.add-btn:hover {
  background: #2980b9;
}

.todo-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.empty-tip {
  text-align: center;
  color: #909399;
  padding: 32px 20px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f2f5;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.todo-content {
  flex: 1;
  font-size: 15px;
  color: #303133;
}

.completed {
  text-decoration: line-through;
  color: #c0c4cc;
}

.delete-btn {
  padding: 4px 10px;
  background: transparent;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: #fef0f0;
}
</style>
