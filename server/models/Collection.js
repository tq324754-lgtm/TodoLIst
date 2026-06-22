const mongoose = require('mongoose')

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

collectionSchema.pre('save', function () {
  this.updatedAt = new Date()
})

module.exports = mongoose.model('Collection', collectionSchema)
