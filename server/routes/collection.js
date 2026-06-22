const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const Collection = require('../models/Collection')
const Todo = require('../models/Todo')

// 获取当前用户所有待办集
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query

    if (!userId) {
      return res.json({ success: true, data: [] })
    }

    const collections = await Collection.find({ userId }).sort({ createdAt: -1 })

    const list = await Promise.all(
      collections.map(async (col) => {
        const todoCount = await Todo.countDocuments({ collectionId: col._id })
        return {
          ...col.toObject(),
          todoCount
        }
      })
    )

    res.json({ success: true, data: list })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 所有待办集全局统计（须在 /:id 之前）
router.get('/all-statistics', async (req, res) => {
  try {
    const { userId } = req.query
    let query = {}
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = userId
    }

    const collections = await Collection.find(query)
    const list = []
    for (const col of collections) {
      const total = await Todo.countDocuments({ collectionId: col._id })
      const completed = await Todo.countDocuments({ collectionId: col._id, done: true })
      list.push({
        name: col.name,
        value: total,
        completed
      })
    }

    res.json({ success: true, data: list })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// 获取单个待办集统计（须在 /:id 之前）
router.get('/:id/statistics', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: '待办集ID格式错误' })
    }

    const collection = await Collection.findById(req.params.id)
    if (!collection) {
      return res.status(404).json({ success: false, message: '待办集不存在' })
    }

    const total = await Todo.countDocuments({ collectionId: req.params.id })
    const completed = await Todo.countDocuments({ collectionId: req.params.id, done: true })
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100)

    res.json({
      success: true,
      data: {
        name: collection.name,
        total,
        completed,
        rate
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 获取单个待办集
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: '待办集ID格式错误' })
    }

    const collection = await Collection.findById(req.params.id)
    if (!collection) {
      return res.status(404).json({ success: false, message: '待办集不存在' })
    }

    res.json({ success: true, data: collection })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 新建待办集
router.post('/', async (req, res) => {
  try {
    const { name, userId } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '待办集名称不能为空' })
    }

    if (userId) {
      const collection = new Collection({
        name: name.trim(),
        userId: userId || undefined
      })
      await collection.save()
      return res.json({ success: true, data: collection })
    }

    res.json({
      success: true,
      data: {
        _id: Date.now().toString(),
        name: name.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        todoCount: 0
      }
    })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// 修改待办集名称
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: '待办集ID格式错误' })
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '待办集名称不能为空' })
    }

    const collection = await Collection.findById(req.params.id)
    if (!collection) {
      return res.status(404).json({ success: false, message: '待办集不存在' })
    }

    collection.name = name.trim()
    collection.updatedAt = new Date()
    await collection.save()

    res.json({ success: true, data: collection })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// 删除待办集（级联删除待办）
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: '待办集ID格式错误' })
    }

    const collection = await Collection.findById(req.params.id)
    if (!collection) {
      return res.status(404).json({ success: false, message: '待办集不存在' })
    }

    await Todo.deleteMany({ collectionId: req.params.id })
    await Collection.findByIdAndDelete(req.params.id)

    res.json({ success: true, data: {} })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
