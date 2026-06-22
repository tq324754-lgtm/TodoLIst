const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const Todo = require('../models/Todo')

// 1. 获取任务：支持 按userId查 / 按collectionId查 / 未登录返回空
router.get('/', async (req, res) => {
  try {
    const { userId, collectionId } = req.query
    
    // 优先级：先按collectionId查（代办集），再按userId查，最后返回空
    if (collectionId) {
      // 查指定代办集下的所有待办
      const list = await Todo.find({ collectionId }).sort({ _id: -1 })
      return res.json({ success: true, data: list })
    } else if (userId) {
      // 兼容你原来的逻辑：按用户查所有待办
      const list = await Todo.find({ userId }).sort({ _id: -1 })
      return res.json({ success: true, data: list })
    }
    
    // 未登录/无参数：返回空数组（前端用本地存储）
    res.json({ success: true, data: [] })
  } catch (err) {
    // 新增错误处理，避免服务器崩溃
    res.status(500).json({ success: false, message: err.message })
  }
})

// 2. 新增任务：支持 关联collectionId / 关联userId / 前端本地存储
router.post('/', async (req, res) => {
  try {
    const { text, userId, collectionId, endTime } = req.body
    
    // 有userId/collectionId：存数据库
    if (userId || collectionId) {
      const todo = new Todo({
        text,
        content: text,
        userId,
        collectionId,
        endTime: endTime || 0,
        done: false,
        completed: false
      })
      await todo.save()
      return res.json({ success: true, data: todo })
    }
    
    // 未登录：后端不存，返回前端本地存储用的临时数据
    res.json({ 
      success: true, 
      data: { _id: Date.now(), text, done: false, endTime } 
    })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// 3. 删除任务（保留你原来的逻辑，新增错误处理）
router.delete('/:id', async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id)
    res.json({ success: true, data: {} })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 4. 修改任务（保留你原来的逻辑，新增错误处理）
// 4. 修改任务（增强容错）
router.put('/:id', async (req, res) => {
  try {
    const { text, done, endTime, collectionId, completed } = req.body
    
    // 修复点1：校验ID格式
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: '待办ID格式错误' })
    }

    const todo = await Todo.findById(req.params.id)
    if (!todo) {
      return res.status(404).json({ success: false, message: '待办不存在' })
    }

    // 修复点2：只更新有传值的字段，避免覆盖为undefined
    if (text !== undefined && text !== '') todo.text = text
    if (done !== undefined) todo.done = done
    if (endTime !== undefined) todo.endTime = endTime
    if (completed !== undefined) todo.completed = completed
    if (collectionId !== undefined && collectionId !== '') todo.collectionId = collectionId

    await todo.save()
    res.json({ success: true, data: todo })
  } catch (err) {
    // 修复点3：打印具体错误，方便排查
    console.error('修改待办失败：', err.message)
    res.status(400).json({ success: false, message: err.message })
  }
})

function getRecent7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const full = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const show = `${date.getMonth() + 1}/${date.getDate()}`
    days.push({ full, show })
  }
  return days
}

router.get('/today-stats', async (req, res) => {
  try {
    const { userId } = req.query
    const today = new Date()
    today.setHours(0, 0, 0, 0) // 今天0点
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1) // 明天0点

    const query = {
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = userId
    }

    const todayTotal = await Todo.countDocuments(query)
    const todayCompleted = await Todo.countDocuments({ ...query, done: true })
    const rate = todayTotal === 0 ? 0 : Math.round((todayCompleted / todayTotal) * 100)

    res.json({
      success: true,
      data: {
        todayTotal,
        todayCompleted,
        todayRate: rate
      }
    })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

router.get('/weekly-stats', async (req, res) => {
  try {
    const { userId } = req.query
    const sevenDays = getRecent7Days()
    const result = []

    for (const day of sevenDays) {
      const startOfDay = new Date(day.full)
      const endOfDay = new Date(startOfDay)
      endOfDay.setDate(endOfDay.getDate() + 1)

      const query = {
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      }
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        query.userId = userId
      }
      const total = await Todo.countDocuments(query)
      const completed = await Todo.countDocuments({ ...query, done: true })
      const rate = total === 0 ? 0 : Math.round((completed / total) * 100)

      result.push({
        dateLabel: day.show,
        total,
        completed,
        rate
      })
    }

    res.json({ success: true, data: result })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

module.exports = router
