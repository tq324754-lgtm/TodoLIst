<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Edit } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/api/goal'
import type { Goal, GoalForm } from '@/types/goal'
import { getCountdownInfo, formatTargetDate } from '@/utils/goal'

const userStore = useUserStore()
const LOCAL_KEY = 'goals_local_list'

const goals = ref<Goal[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref('')

const form = reactive<GoalForm>({
  name: '',
  description: '',
  targetDate: ''
})

const sortedGoals = computed(() =>
  [...goals.value].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  )
)

function saveLocal(list: Goal[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
}

function loadLocal(): Goal[] {
  const raw = localStorage.getItem(LOCAL_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Goal[]
  } catch {
    return []
  }
}

async function fetchGoals() {
  if (userStore.isLoggedIn && userStore.userId) {
    const res = await getGoals(userStore.userId)
    goals.value = res.data.data || []
  } else {
    goals.value = loadLocal()
  }
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.targetDate = ''
  editingId.value = ''
  isEdit.value = false
}

function openCreate() {
  resetForm()
  dialogVisible.value = true
}

function openEdit(goal: Goal) {
  isEdit.value = true
  editingId.value = goal._id
  form.name = goal.name
  form.description = goal.description
  form.targetDate = formatTargetDate(goal.targetDate)
  dialogVisible.value = true
}

async function handleSave() {
  const name = form.name.trim()
  if (!name) {
    ElMessage.warning('请输入目标名称')
    return
  }
  if (!form.targetDate) {
    ElMessage.warning('请选择目标日期')
    return
  }

  const payload: GoalForm = {
    name,
    description: form.description.trim(),
    targetDate: form.targetDate
  }

  try {
    if (userStore.isLoggedIn && userStore.userId) {
      if (isEdit.value) {
        const res = await updateGoal(editingId.value, payload)
        const updated = res.data.data
        goals.value = goals.value.map(g => (g._id === editingId.value ? updated : g))
      } else {
        const res = await createGoal({ ...payload, userId: userStore.userId })
        goals.value = [res.data.data, ...goals.value]
      }
    } else {
      if (isEdit.value) {
        goals.value = goals.value.map(g =>
          g._id === editingId.value
            ? { ...g, ...payload }
            : g
        )
      } else {
        const newGoal: Goal = {
          _id: Date.now().toString(),
          ...payload,
          createdAt: new Date().toISOString()
        }
        goals.value = [newGoal, ...goals.value]
      }
      saveLocal(goals.value)
    }

    dialogVisible.value = false
    ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
    resetForm()
  } catch {
    ElMessage.error('操作失败，请稍后重试')
  }
}

async function handleDelete(goal: Goal, e: Event) {
  e.stopPropagation()
  try {
    await ElMessageBox.confirm(`确定删除「${goal.name}」吗？`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    if (userStore.isLoggedIn && userStore.userId) {
      await deleteGoal(goal._id)
    }

    goals.value = goals.value.filter(g => g._id !== goal._id)
    if (!userStore.isLoggedIn) saveLocal(goals.value)
    ElMessage.success('已删除')
  } catch {
    // 用户取消
  }
}

function countdownOf(goal: Goal) {
  return getCountdownInfo(goal.targetDate)
}

function getCardClass(type: string) {
  return {
    'is-today': type === 'today',
    'is-future': type === 'future',
    'is-past': type === 'past'
  }
}

onMounted(() => {
  fetchGoals()
})
</script>

<template>
  <div class="target-page">
    <div class="page-header">
      <h2>未来倒计时</h2>
      <button class="add-btn" aria-label="新增目标" @click="openCreate">
        <el-icon :size="22"><Plus /></el-icon>
      </button>
    </div>

    <div class="page-body">
      <div v-if="!userStore.isLoggedIn" class="local-tip">
        未登录，数据保存在本地；登录后自动同步云端
      </div>

      <div v-if="sortedGoals.length === 0" class="empty-state">
        <div class="empty-icon">⏳</div>
        <p>还没有倒计时目标</p>
        <span>点击右上角 + 创建你的第一个目标吧</span>
      </div>

      <div v-else class="goal-list">
        <div
          v-for="goal in sortedGoals"
          :key="goal._id"
          class="goal-card"
          :class="getCardClass(countdownOf(goal).type)"
          @click="openEdit(goal)"
        >
          <div class="goal-left">
            <h3 class="goal-name">{{ goal.name }}</h3>
            <p v-if="goal.description" class="goal-desc">{{ goal.description }}</p>
            <p v-else class="goal-desc placeholder">暂无描述</p>
          </div>

          <div class="goal-right">
            <div class="days-block">
              <span class="days-num">
                {{ countdownOf(goal).type === 'today' ? '今' : countdownOf(goal).days }}
              </span>
              <span class="days-unit">天</span>
            </div>
            <p class="countdown-label">{{ countdownOf(goal).label }}</p>
            <p class="target-date">{{ formatTargetDate(goal.targetDate) }}</p>
          </div>

          <div class="card-actions" @click.stop>
            <button class="action-btn edit" @click="openEdit(goal)">
              <el-icon><Edit /></el-icon>
            </button>
            <button class="action-btn delete" @click="handleDelete(goal, $event)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑目标' : '新增目标'"
      width="90%"
      style="max-width: 420px"
      @closed="resetForm"
    >
      <el-form label-position="top">
        <el-form-item label="目标名称" required>
          <el-input v-model="form.name" placeholder="例如：期末考试" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="写点什么激励自己吧（选填）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="目标日期" required>
          <el-date-picker
            v-model="form.targetDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
$primary: #f0ec0b;
$future: #409eff;
$today: #67c23a;
$past: #909399;

.target-page {
  min-height: 100%;
  background: #f5f6f8;
}

.page-header {
  height: 56px;
  background: $primary;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 20px;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 10;

  h2 {
    font-size: 18px;
    margin: 0;
  }
}

.add-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #fff;
  }
}

.page-body {
  max-width: 640px;
  margin: 0 auto;
  padding: 16px;
}

.local-tip {
  font-size: 13px;
  color: #e6a23c;
  background: #fdf6ec;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  p {
    font-size: 16px;
    color: #606266;
    margin-bottom: 8px;
  }

  span {
    font-size: 13px;
  }
}

.goal-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.goal-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  position: relative;
  border-left: 4px solid transparent;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.is-future {
    border-left-color: $future;
    .days-num,
    .countdown-label {
      color: $future;
    }
  }

  &.is-today {
    border-left-color: $today;
    .days-num,
    .countdown-label {
      color: $today;
    }
  }

  &.is-past {
    border-left-color: $past;
    .days-num,
    .countdown-label {
      color: $past;
    }
  }
}

.goal-left {
  flex: 1;
  min-width: 0;
  padding-right: 8px;
}

.goal-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goal-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  &.placeholder {
    color: #c0c4cc;
  }
}

.goal-right {
  flex-shrink: 0;
  text-align: right;
  min-width: 88px;
}

.days-block {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 2px;
  line-height: 1;
}

.days-num {
  font-size: 32px;
  font-weight: 700;
}

.days-unit {
  font-size: 14px;
  color: #909399;
}

.countdown-label {
  font-size: 12px;
  margin: 4px 0 2px;
  font-weight: 500;
}

.target-date {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: #f5f7fa;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: #ebeef5;
  }

  &.delete:hover {
    color: #f56c6c;
    background: #fef0f0;
  }

  &.edit:hover {
    color: #409eff;
    background: #ecf5ff;
  }
}

@media (max-width: 480px) {
  .goal-card {
    padding: 14px 12px;
  }

  .days-num {
    font-size: 28px;
  }

  .card-actions {
    flex-direction: row;
  }
}
</style>
