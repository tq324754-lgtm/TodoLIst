<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Plus,
  Edit,
  Delete,
  Refresh,
  Lock,
  Switch,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  toggleUserRole,
  toggleUserStatus,
  deleteUser
} from '@/api/admin'

// 用户列表数据
interface UserInfo {
  _id: string
  username: string
  phone: string
  role: string
  status: string
  createdAt: string
}

const loading = ref(false)
const users = ref<UserInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')

// 编辑对话框
const editDialogVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = reactive({
  _id: '',
  username: '',
  phone: '',
  role: 'user',
  status: 'active'
})

// 新增用户对话框
const addDialogVisible = ref(false)
const addFormRef = ref<FormInstance>()
const addForm = reactive({
  username: '',
  phone: '',
  password: '',
  role: 'user'
})

// 重置密码对话框
const resetPwdDialogVisible = ref(false)
const resetPwdFormRef = ref<FormInstance>()
const resetPwdUserId = ref('')
const resetPwdForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const editRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
}

const addRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
  ],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
}

const resetPwdRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetPwdForm.newPassword) {
          callback(new Error('两次密码输入不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 加载用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value
    })
    if (res.data.success) {
      users.value = res.data.data.users
      total.value = res.data.data.total
    }
  } catch (err: any) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchUsers()
}

// 打开编辑对话框
const openEditDialog = (user: UserInfo) => {
  editForm._id = user._id
  editForm.username = user.username
  editForm.phone = user.phone
  editForm.role = user.role
  editForm.status = user.status
  editDialogVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate()
  
  try {
    const res = await updateUser(editForm._id, {
      username: editForm.username,
      phone: editForm.phone,
      role: editForm.role,
      status: editForm.status
    })
    if (res.data.success) {
      ElMessage.success(res.data.message)
      editDialogVisible.value = false
      fetchUsers()
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '更新失败')
  }
}

// 打开新增对话框
const openAddDialog = () => {
  addForm.username = ''
  addForm.phone = ''
  addForm.password = ''
  addForm.role = 'user'
  addDialogVisible.value = true
}

// 提交新增
const submitAdd = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate()

  try {
    const res = await createUser(addForm)
    if (res.data.success) {
      ElMessage.success(res.data.message)
      addDialogVisible.value = false
      fetchUsers()
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '创建失败')
  }
}

// 切换角色
const handleToggleRole = async (user: UserInfo) => {
  const newRole = user.role === 'admin' ? '普通用户' : '管理员'
  try {
    await ElMessageBox.confirm(
      `确定将用户「${user.username}」的角色切换为「${newRole}」吗？`,
      '角色切换确认',
      { type: 'warning' }
    )
    const res = await toggleUserRole(user._id)
    if (res.data.success) {
      ElMessage.success(res.data.message)
      fetchUsers()
    }
  } catch (err: any) {
    if (err !== 'cancel' && err?.toString() !== 'cancel') {
      ElMessage.error(err.response?.data?.message || '操作失败')
    }
  }
}

// 切换状态（启用/禁用）
const handleToggleStatus = async (user: UserInfo) => {
  const action = user.status === 'active' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定${action}用户「${user.username}」吗？${action === '禁用' ? '禁用后该用户将无法登录。' : ''}`,
      `${action}确认`,
      { type: user.status === 'active' ? 'warning' : 'info' }
    )
    const res = await toggleUserStatus(user._id)
    if (res.data.success) {
      ElMessage.success(res.data.message)
      fetchUsers()
    }
  } catch (err: any) {
    if (err !== 'cancel' && err?.toString() !== 'cancel') {
      ElMessage.error(err.response?.data?.message || '操作失败')
    }
  }
}

// 打开重置密码对话框
const openResetPwdDialog = (user: UserInfo) => {
  resetPwdUserId.value = user._id
  resetPwdForm.newPassword = ''
  resetPwdForm.confirmPassword = ''
  resetPwdDialogVisible.value = true
}

// 提交重置密码
const submitResetPwd = async () => {
  if (!resetPwdFormRef.value) return
  await resetPwdFormRef.value.validate()

  try {
    const res = await resetUserPassword(resetPwdUserId.value, resetPwdForm.newPassword)
    if (res.data.success) {
      ElMessage.success(res.data.message)
      resetPwdDialogVisible.value = false
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '重置失败')
  }
}

// 删除用户
const handleDelete = async (user: UserInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定删除用户「${user.username}」吗？\n\n此操作将同时删除该用户的所有待办和待办集数据，且无法恢复！`,
      '删除用户确认',
      { type: 'error', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    )
    const res = await deleteUser(user._id)
    if (res.data.success) {
      ElMessage.success(res.data.message)
      fetchUsers()
    }
  } catch (err: any) {
    if (err !== 'cancel' && err?.toString() !== 'cancel') {
      ElMessage.error(err.response?.data?.message || '删除失败')
    }
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="admin-users">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名或手机号"
          clearable
          style="width: 280px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
      <div class="toolbar-right">
        <el-button @click="fetchUsers">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </div>
    </div>

    <!-- 用户表格 -->
    <el-card shadow="hover" class="user-table-card">
      <el-table
        :data="users"
        v-loading="loading"
        stripe
        style="width: 100%"
        row-key="_id"
      >
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="130" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '正常' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="warning" size="small" @click="openResetPwdDialog(row)">
              <el-icon><Lock /></el-icon>
              重置密码
            </el-button>
            <el-button link :type="row.role === 'admin' ? 'info' : 'danger'" size="small" @click="handleToggleRole(row)">
              <el-icon><Switch /></el-icon>
              {{ row.role === 'admin' ? '降为用户' : '升为管理' }}
            </el-button>
            <el-button
              link
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              <el-icon>
                <CircleClose v-if="row.status === 'active'" />
                <CircleCheck v-else />
              </el-icon>
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="fetchUsers"
        />
      </div>
    </el-card>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑用户" width="480px" destroy-on-close>
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editForm.role" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="editForm.status" style="width: 100%">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增用户对话框 -->
    <el-dialog v-model="addDialogVisible" title="新增用户" width="480px" destroy-on-close>
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addForm.username" placeholder="至少3个字符" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="addForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="addForm.password" type="password" show-password placeholder="至少6个字符" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="addForm.role" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">创建</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPwdDialogVisible" title="重置密码" width="440px" destroy-on-close>
      <el-form ref="resetPwdFormRef" :model="resetPwdForm" :rules="resetPwdRules" label-width="90px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="resetPwdForm.newPassword" type="password" show-password placeholder="至少6个字符" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetPwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResetPwd">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.admin-users {
  min-height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;

  .toolbar-left {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .toolbar-right {
    display: flex;
    gap: 10px;
  }
}

.user-table-card {
  :deep(.el-card__body) {
    padding: 0;
  }
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
}
</style>
