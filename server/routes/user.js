const express = require('express')
const router = express.Router()
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const { generateToken } = require('../middleware/auth')

// 注册
router.post('/register',async (req, res) => {
    const { username, phone, password } = req.body

    const exists = await User.findOne({ username })
    if (exists) return res.json({ success: false, msg: '账号已存在'})

    const hashPwd = await bcrypt.hash(password, 10)
    const user = new User({ username, phone, password: hashPwd })
    await user.save()

    res.json({ success: true, msg: '注册成功' })
})

// 登录
router.post('/login', async (req, res) => {
    const { username, password } = req.body

    const user = await User.findOne({ username })
    if(!user) return res.json({ success: false, msg: '账号不存在' })

    // 检查账号是否被禁用
    if(user.status === 'disabled') {
        return res.json({ success: false, msg: '账号已被禁用，请联系管理员' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if(!valid) return res.json({ success: false, msg: '密码错误' })

    const token = generateToken(user._id.toString(), user.role)

    res.json({
      success: true,
      msg: '登录成功',
      userId: user._id,
      role: user.role,
      username: user.username,
      token
    })
})

module.exports = router
