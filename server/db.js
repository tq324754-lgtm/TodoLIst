const mongoose = require("mongoose")
require('dotenv').config()

// MongoDB Atlas 连接配置
const mongoURI = process.env.MONGO_URI || "mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/todolist?retryWrites=true&w=majority"

async function connectDB() {
    try {
        await mongoose.connect(mongoURI)
        console.log("Connected to MongoDB Atlas");
        return mongoose.connection
    } catch (err) {
        console.log('数据库连接失败: '+err.message);
        throw err
    }
}

module.exports = connectDB
