const mongoose = require('mongoose')

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  targetDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Goal', goalSchema)
