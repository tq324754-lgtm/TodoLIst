const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['user', 'admin'],
        default: 'user' 
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('User', userSchema)
