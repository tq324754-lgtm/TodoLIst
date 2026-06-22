const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const router = express.Router()
const User = require('../models/User')
const Todo = require('../models/Todo')
const Collection = require('../models/Collection')
const { verifyToken, requireAdmin } = require('../middleware/auth')

// 所有管理员接口都需要 token + admin 权限
router.use(verifyToken, requireAdmin)

// 获取最近 7 天的日期数组
function getRecent7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    days.push({ start, end, label })
  }
  return days
}

// GET /api/admin/dashboard - 仪表盘全部数据
router.get('/dashboard', async (req, res) => {
  try {
    // --- 全局数据 ---
    const totalUsers = await User.countDocuments()
    const totalTodos = await Todo.countDocuments()
    const totalCollections = await Collection.countDocuments()

    // 今日新增
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayUserCount = await countDocsSince(User, today)
    const todayTodoCount = await Todo.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    })

    // --- 近 7 日趋势 ---
    const sevenDays = getRecent7Days()

    const userTrend = []
    const todoTrend = []

    for (const day of sevenDays) {
      // 新增用户（按 ObjectId 时间戳）
      const userCount = await countDocsBetween(User, day.start, day.end)
      userTrend.push({ date: day.label, count: userCount })

      // 新增待办
      const todoCount = await Todo.countDocuments({
        createdAt: { $gte: day.start, $lt: day.end }
      })
      todoTrend.push({ date: day.label, count: todoCount })
    }

    res.json({
      success: true,
      data: {
        cards: {
          totalUsers,
          todayUserCount,
          totalTodos,
          todayTodoCount,
          totalCollections
        },
        trends: {
          userTrend,
          todoTrend
        }
      }
    })
  } catch (err) {
    console.error('管理员仪表盘错误:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============================================
// 用户管理接口
// ============================================

// GET /api/admin/users - 获取用户列表（分页 + 搜索）
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const search = req.query.search || ''

    const skip = (page - 1) * pageSize

    // 构建搜索条件
    let query = {}
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }
    }

    const total = await User.countDocuments(query)
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)

    res.json({
      success: true,
      data: {
        users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (err) {
    console.error('获取用户列表错误:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/admin/users - 管理员创建新用户
router.post('/users', async (req, res) => {
  try {
    const { username, phone, password, role } = req.body

    if (!username || !phone || !password) {
      return res.status(400).json({ success: false, message: '用户名、手机号和密码不能为空' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度不能少于6位' })
    }

    // 检查用户名是否已存在
    const exists = await User.findOne({ username })
    if (exists) {
      return res.status(400).json({ success: false, message: '用户名已存在' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
      username,
      phone,
      password: hashedPassword,
      role: role || 'user',
      status: 'active'
    })
    await user.save()

    const userObj = user.toObject()
    delete userObj.password

    res.json({ success: true, data: userObj, message: '用户创建成功' })
  } catch (err) {
    console.error('创建用户错误:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// PUT /api/admin/users/:id - 编辑用户信息
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { username, phone, role, status } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '用户ID格式错误' })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    // 不允许修改自己的角色和状态
    if (user._id.toString() === req.userId) {
      return res.status(403).json({ success: false, message: '不能修改自己的账号信息' })
    }

    if (username !== undefined && username.trim()) user.username = username.trim()
    if (phone !== undefined && phone.trim()) user.phone = phone.trim()
    if (role !== undefined && ['user', 'admin'].includes(role)) user.role = role
    if (status !== undefined && ['active', 'disabled'].includes(status)) user.status = status

    await user.save()

    const userObj = user.toObject()
    delete userObj.password

    res.json({ success: true, data: userObj, message: '用户信息更新成功' })
  } catch (err) {
    console.error('更新用户错误:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// PUT /api/admin/users/:id/password - 重置用户密码
router.put('/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '用户ID格式错误' })
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码长度不能少于6位' })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.json({ success: true, message: '密码重置成功' })
  } catch (err) {
    console.error('重置密码错误:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// PATCH /api/admin/users/:id/role - 切换用户角色
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '用户ID格式错误' })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    // 不允许修改自己的角色
    if (user._id.toString() === req.userId) {
      return res.status(403).json({ success: false, message: '不能修改自己的角色' })
    }

    user.role = user.role === 'admin' ? 'user' : 'admin'
    await user.save()

    const userObj = user.toObject()
    delete userObj.password

    res.json({ success: true, data: userObj, message: `用户角色已切换为${user.role === 'admin' ? '管理员' : '普通用户'}` })
  } catch (err) {
    console.error('切换用户角色错误:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// PATCH /api/admin/users/:id/status - 启用/禁用账号
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '用户ID格式错误' })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    // 不允许禁用自己
    if (user._id.toString() === req.userId) {
      return res.status(403).json({ success: false, message: '不能禁用自己的账号' })
    }

    user.status = user.status === 'active' ? 'disabled' : 'active'
    await user.save()

    const userObj = user.toObject()
    delete userObj.password

    res.json({ success: true, data: userObj, message: `账号已${user.status === 'active' ? '启用' : '禁用'}` })
  } catch (err) {
    console.error('切换用户状态错误:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/admin/users/:id - 删除用户（级联删除待办和待办集）
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '用户ID格式错误' })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    // 不允许删除自己
    if (user._id.toString() === req.userId) {
      return res.status(403).json({ success: false, message: '不能删除自己的账号' })
    }

    // 级联删除：删除该用户的所有待办和待办集
    await Todo.deleteMany({ userId: id })
    await Collection.deleteMany({ userId: id })
    await User.findByIdAndDelete(id)

    res.json({ success: true, message: '用户及其所有数据已删除' })
  } catch (err) {
    console.error('删除用户错误:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// 辅助：按 ObjectId 时间戳统计某个 Model 在某时间之后的文档数
async function countDocsSince(Model, sinceDate) {
  try {
    const objectId = createObjectIdFromDate(sinceDate)
    return await Model.countDocuments({ _id: { $gte: objectId } })
  } catch (e) {
    return await Model.countDocuments({ createdAt: { $gte: sinceDate } })
  }
}

async function countDocsBetween(Model, startDate, endDate) {
  try {
    const startId = createObjectIdFromDate(startDate)
    const endId = createObjectIdFromDate(endDate)
    return await Model.countDocuments({ _id: { $gte: startId, $lt: endId } })
  } catch (e) {
    return await Model.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } })
  }
}

// 根据日期生成一个最小 ObjectId（用于时间范围查询）
function createObjectIdFromDate(date) {
  const hexSeconds = Math.floor(date.getTime() / 1000).toString(16)
  const objectIdHex = hexSeconds + '0000000000000000'
  return new mongoose.Types.ObjectId(objectIdHex)
}

module.exports = router
