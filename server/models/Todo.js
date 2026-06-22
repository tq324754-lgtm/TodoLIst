const mongoose = require("mongoose")

const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  endTime: { type: Number, default: 0 },
  content: { type: String },
  completed: { type: Boolean, default: false },
  collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection' },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Todo', todoSchema)
