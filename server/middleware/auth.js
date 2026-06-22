const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'todolist-admin-secret-key-2026'

// 验证 JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未提供认证token' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.userRole = decoded.role
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'token无效或已过期' })
  }
}

// 验证管理员身份
function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: '需要管理员权限' })
  }
  next()
}

// 生成 JWT token
function generateToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' })
}

module.exports = { verifyToken, requireAdmin, generateToken, JWT_SECRET }
