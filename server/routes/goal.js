const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const Goal = require('../models/Goal')

// 获取目标列表
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query

    if (userId) {
      const list = await Goal.find({ userId }).sort({ targetDate: 1, createdAt: -1 })
      return res.json({ success: true, data: list })
    }

    res.json({ success: true, data: [] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 新增目标
router.post('/', async (req, res) => {
  try {
    const { userId, name, description, targetDate } = req.body

    if (!name || !targetDate) {
      return res.status(400).json({ success: false, message: '名称和目标日期不能为空' })
    }

    if (userId) {
      const goal = new Goal({
        userId,
        name: name.trim(),
        description: (description || '').trim(),
        targetDate: new Date(targetDate)
      })
      await goal.save()
      return res.json({ success: true, data: goal })
    }

    res.json({
      success: true,
      data: {
        _id: Date.now().toString(),
        name: name.trim(),
        description: (description || '').trim(),
        targetDate,
        createdAt: new Date()
      }
    })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// 编辑目标
router.put('/:id', async (req, res) => {
  try {
    const { name, description, targetDate } = req.body

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: '目标ID格式错误' })
    }

    const goal = await Goal.findById(req.params.id)
    if (!goal) {
      return res.status(404).json({ success: false, message: '目标不存在' })
    }

    if (name !== undefined && name !== '') goal.name = name.trim()
    if (description !== undefined) goal.description = description.trim()
    if (targetDate !== undefined) goal.targetDate = new Date(targetDate)

    await goal.save()
    res.json({ success: true, data: goal })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// 删除目标
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: '目标ID格式错误' })
    }

    const goal = await Goal.findByIdAndDelete(req.params.id)
    if (!goal) {
      return res.status(404).json({ success: false, message: '目标不存在' })
    }

    res.json({ success: true, data: {} })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
