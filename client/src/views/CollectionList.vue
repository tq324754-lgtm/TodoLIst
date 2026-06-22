<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  ArrowRight,
  PieChart,
  Setting,
  Clock,
  MoreFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionStatistics
} from '@/api/collection'
import request from '@/api/request'
import type { Collection, CollectionStatistics } from '@/types/collection'
import {
  loadLocalCollections,
  saveLocalCollections,
  loadLocalTodos,
  saveLocalTodos,
  attachTodoCounts,
  getLocalStatistics,
  deleteLocalTodosByCollection
} from '@/utils/collectionLocal'

const router = useRouter()
const userStore = useUserStore()

const collections = ref<Collection[]>([])
const loading = ref(false)

const createDialogVisible = ref(false)
const newCollectionName = ref('')

const quickAddDialogVisible = ref(false)
const quickAddText = ref('')
const quickAddCollectionId = ref('')
const quickAddCollectionName = ref('')

const renameDialogVisible = ref(false)
const renameId = ref('')
const renameName = ref('')
const statsDialogVisible = ref(false)
const statsData = ref<CollectionStatistics | null>(null)

async function fetchCollections() {
  loading.value = true
  try {
    if (userStore.isLoggedIn && userStore.userId) {
      const res = await getCollections(userStore.userId)
      collections.value = res.data.data || []
    } else {
      const cols = loadLocalCollections()
      const todos = loadLocalTodos()
      collections.value = attachTodoCounts(cols, todos)
    }
  } catch {
    ElMessage.error('获取待办集列表失败')
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  newCollectionName.value = ''
  createDialogVisible.value = true
}

async function handleCreate() {
  const name = newCollectionName.value.trim()
  if (!name) {
    ElMessage.warning('请输入待办集名称')
    return
  }

  try {
    if (userStore.isLoggedIn && userStore.userId) {
      const res = await createCollection({ name, userId: userStore.userId })
      collections.value = [{ ...res.data.data, todoCount: 0 }, ...collections.value]
    } else {
      const newCol: Collection = {
        _id: Date.now().toString(),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        todoCount: 0
      }
      const list = [newCol, ...loadLocalCollections()]
      saveLocalCollections(list)
      collections.value = [newCol, ...collections.value]
    }

    createDialogVisible.value = false
    ElMessage.success('创建成功')
  } catch {
    ElMessage.error('创建失败，请稍后重试')
  }
}

function goDetail(id: string) {
  router.push(`/collection-detail/${id}`)
}

function openQuickAdd(col: Collection, e: Event) {
  e.stopPropagation()
  quickAddCollectionId.value = col._id
  quickAddCollectionName.value = col.name
  quickAddText.value = ''
  quickAddDialogVisible.value = true
}

async function handleQuickAdd() {
  const text = quickAddText.value.trim()
  if (!text) {
    ElMessage.warning('请输入待办内容')
    return
  }

  try {
    if (userStore.isLoggedIn && userStore.userId) {
      await request.post('/api/todos', {
        text,
        collectionId: quickAddCollectionId.value,
        userId: userStore.userId,
        done: false
      })
    } else {
      const todos = loadLocalTodos()
      todos.unshift({
        _id: Date.now().toString(),
        text,
        done: false,
        collectionId: quickAddCollectionId.value,
        createdAt: new Date().toISOString()
      })
      saveLocalTodos(todos)
    }

    quickAddDialogVisible.value = false
    ElMessage.success('添加成功')

    try {
      await ElMessageBox.confirm('是否进入该待办集详情页？', '提示', {
        confirmButtonText: '进入',
        cancelButtonText: '留在此页',
        type: 'info'
      })
      goDetail(quickAddCollectionId.value)
    } catch {
      await fetchCollections()
    }
  } catch {
    ElMessage.error('添加失败，请稍后重试')
  }
}

async function openStats(col: Collection, e: Event) {
  e.stopPropagation()
  try {
    if (userStore.isLoggedIn) {
      const res = await getCollectionStatistics(col._id)
      statsData.value = res.data.data
    } else {
      statsData.value = getLocalStatistics(col._id, col.name)
    }
    statsDialogVisible.value = true
  } catch {
    ElMessage.error('获取统计数据失败')
  }
}

function openRename(col: Collection) {
  renameId.value = col._id
  renameName.value = col.name
  renameDialogVisible.value = true
}

function onSettingsCommand(command: string, col: Collection) {
  if (command === 'rename') {
    openRename(col)
  } else if (command === 'delete') {
    handleDelete(col)
  }
}

async function handleRename() {
  const name = renameName.value.trim()
  if (!name) {
    ElMessage.warning('名称不能为空')
    return
  }

  try {
    if (userStore.isLoggedIn) {
      await updateCollection(renameId.value, { name })
    } else {
      const list = loadLocalCollections().map(c =>
        c._id === renameId.value ? { ...c, name, updatedAt: new Date().toISOString() } : c
      )
      saveLocalCollections(list)
    }

    collections.value = collections.value.map(c =>
      c._id === renameId.value ? { ...c, name } : c
    )
    renameDialogVisible.value = false
    ElMessage.success('修改成功')
  } catch {
    ElMessage.error('修改失败')
  }
}

async function handleDelete(col: Collection) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${col.name}」吗？该集下所有待办将一并删除，且不可恢复。`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )

    if (userStore.isLoggedIn) {
      await deleteCollection(col._id)
    } else {
      const list = loadLocalCollections().filter(c => c._id !== col._id)
      saveLocalCollections(list)
      deleteLocalTodosByCollection(col._id)
    }

    collections.value = collections.value.filter(c => c._id !== col._id)
    ElMessage.success('已删除')
  } catch {
    // 用户取消
  }
}

function placeholderTip(label: string) {
  ElMessage.info(`${label}功能开发中，敬请期待`)
}

onMounted(() => {
  fetchCollections()
})
</script>

<template>
  <div class="collection-list-page">
    <!-- 顶部导航栏 -->
    <header class="top-bar">
      <div class="top-bar-left">
        <h1 class="main-title">待办集</h1>
        <p class="sub-title">点击开启学霸模式</p>
      </div>
      <div class="top-bar-right">
        <button class="text-btn" @click="placeholderTip('权限设置')">必开权限</button>
        <button class="icon-btn" aria-label="番茄钟" @click="placeholderTip('番茄钟')">
          <el-icon :size="20"><Clock /></el-icon>
        </button>
        <button class="icon-btn" aria-label="新建待办集" @click="openCreateDialog">
          <el-icon :size="20"><Plus /></el-icon>
        </button>
        <button class="icon-btn" aria-label="更多" @click="placeholderTip('更多操作')">
          <el-icon :size="20"><MoreFilled /></el-icon>
        </button>
      </div>
    </header>

    <div v-if="!userStore.isLoggedIn" class="local-tip">
      未登录，数据保存在本地；登录后自动同步云端
    </div>

    <!-- 列表 -->
    <div v-if="loading" class="loading-tip">加载中...</div>

    <div v-else-if="collections.length === 0" class="empty-state">
      <p class="empty-text">暂无待办集，点击右上角 + 创建</p>
      <button class="empty-btn" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        创建第一个待办集
      </button>
    </div>

    <ul v-else class="collection-list">
      <li
        v-for="col in collections"
        :key="col._id"
        class="collection-item"
        @click="goDetail(col._id)"
      >
        <div class="item-main">
          <span class="item-name">{{ col.name }}</span>
          <span v-if="col.todoCount !== undefined" class="item-count">{{ col.todoCount }} 项</span>
        </div>
        <div class="item-actions" @click.stop>
          <button class="action-icon" aria-label="进入详情" @click="goDetail(col._id)">
            <el-icon><ArrowRight /></el-icon>
          </button>
          <button class="action-icon" aria-label="完成率" @click="openStats(col, $event)">
            <el-icon><PieChart /></el-icon>
          </button>
          <el-dropdown trigger="click" @command="(cmd: string) => onSettingsCommand(cmd, col)">
            <button class="action-icon" aria-label="设置" @click.stop>
              <el-icon><Setting /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">修改名称</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除待办集</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <button class="action-icon add" aria-label="快捷添加" @click="openQuickAdd(col, $event)">
            <el-icon><Plus /></el-icon>
          </button>
        </div>
      </li>
    </ul>

    <!-- 新建待办集 -->
    <el-dialog v-model="createDialogVisible" title="新建待办集" width="90%" style="max-width: 400px">
      <el-input
        v-model="newCollectionName"
        placeholder="输入待办集名称，如：学习、工作"
        maxlength="20"
        show-word-limit
        @keyup.enter="handleCreate"
      />
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>

    <!-- 快捷添加待办 -->
    <el-dialog
      v-model="quickAddDialogVisible"
      :title="`快捷添加 · ${quickAddCollectionName}`"
      width="90%"
      style="max-width: 400px"
    >
      <el-input
        v-model="quickAddText"
        placeholder="输入待办内容"
        maxlength="100"
        @keyup.enter="handleQuickAdd"
      />
      <template #footer>
        <el-button @click="quickAddDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleQuickAdd">添加</el-button>
      </template>
    </el-dialog>

    <!-- 修改名称 -->
    <el-dialog v-model="renameDialogVisible" title="修改待办集名称" width="90%" style="max-width: 400px">
      <el-input v-model="renameName" placeholder="输入新名称" maxlength="20" @keyup.enter="handleRename" />
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRename">保存</el-button>
      </template>
    </el-dialog>

    <!-- 统计卡片 -->
    <el-dialog v-model="statsDialogVisible" title="完成率统计" width="90%" style="max-width: 360px">
      <div v-if="statsData" class="stats-card">
        <h3 class="stats-name">{{ statsData.name }}</h3>
        <div class="stats-numbers">
          <div class="stats-item">
            <span class="stats-value">{{ statsData.completed }}</span>
            <span class="stats-label">已完成</span>
          </div>
          <div class="stats-divider">/</div>
          <div class="stats-item">
            <span class="stats-value">{{ statsData.total }}</span>
            <span class="stats-label">总任务</span>
          </div>
        </div>
        <div class="stats-rate">
          <span class="rate-num">{{ statsData.rate }}%</span>
          <span class="rate-label">完成率</span>
        </div>
        <el-progress
          :percentage="statsData.rate"
          :stroke-width="10"
          :color="statsData.rate >= 80 ? '#67c23a' : statsData.rate >= 50 ? '#409eff' : '#e6a23c'"
        />
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.collection-list-page {
  min-height: 100%;
  background: #f0f4f8;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 20px;
  background: linear-gradient(135deg, #5dade2 0%, #3498db 50%, #2980b9 100%);
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.top-bar-left {
  .main-title {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 4px;
    letter-spacing: 0.5px;
  }

  .sub-title {
    font-size: 12px;
    margin: 0;
    opacity: 0.85;
    color: rgba(255, 255, 255, 0.9);
  }
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.text-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.icon-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }
}

.local-tip {
  font-size: 13px;
  color: #e6a23c;
  background: #fdf6ec;
  padding: 10px 16px;
  text-align: center;
}

.loading-tip {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.empty-state {
  text-align: center;
  padding: 60px 24px;

  .empty-text {
    color: #909399;
    font-size: 15px;
    margin-bottom: 20px;
  }
}

.empty-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.35);
  animation: pulse 2s ease-in-out infinite;

  &:hover {
    background: #2980b9;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}

.collection-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: #fff;
}

.collection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eef0f3;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f8fafc;
  }

  &:active {
    background: #f0f4f8;
  }
}

.item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-count {
  font-size: 12px;
  color: #909399;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.action-icon {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #909399;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;

  &:hover {
    background: #f0f4f8;
    color: #3498db;
  }

  &.add:hover {
    color: #67c23a;
  }
}

.stats-card {
  text-align: center;
  padding: 8px 0;
}

.stats-name {
  font-size: 18px;
  color: #303133;
  margin: 0 0 20px;
}

.stats-numbers {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-value {
  font-size: 28px;
  font-weight: 700;
  color: #3498db;
}

.stats-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.stats-divider {
  font-size: 24px;
  color: #dcdfe6;
}

.stats-rate {
  margin-bottom: 12px;

  .rate-num {
    font-size: 32px;
    font-weight: 700;
    color: #67c23a;
  }

  .rate-label {
    display: block;
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}

@media (max-width: 480px) {
  .text-btn {
    display: none;
  }

  .action-icon {
    width: 32px;
    height: 32px;
  }
}
</style>
