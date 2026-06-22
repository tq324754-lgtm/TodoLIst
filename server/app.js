const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const User = require("./models/User");
const userRoutes = require("./routes/user");
const todoRoutes = require("./routes/todo");
const goalRoutes = require("./routes/goal");
const collectionRoutes = require("./routes/collection"); // 已引入
const adminRoutes = require("./routes/admin"); // 管理员路由

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// ==============================================
// 👇👇👇 【关键修复】路由必须写在这！！！  👇👇👇
// ==============================================
app.use("/api/user", userRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/collections", collectionRoutes);  // ✅ 这个现在永久生效！
app.use("/api/admin", adminRoutes); // 管理员接口

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let mongod;

async function startServer() {
  try {
    mongod = await MongoMemoryServer.create({
      instance: {
        dbPath: dataDir,
        port: 27017
      }
    });
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log("✅ 连接本地文件MongoDB成功！");

    await queryAllUsers();
    await initializeTestData();

    // 路由【不能】写在这里！！！ 我已经帮你移走了！

    app.get("/", (req, res) => {
      res.json({ message: "API is running" });
    });

    app.get("/api/users", async (req, res) => {
      try {
        const users = await User.find();
        res.json({ success: true, count: users.length, data: users });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ 启动失败：", err.message);
    process.exit(1);
  }
}

async function queryAllUsers() {
  try {
    const allUsers = await User.find();
    console.log("\n📊 所有用户数据：");
    console.log(allUsers);
  } catch (err) {
    console.error("❌ 查询失败");
  }
}

async function initializeTestData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      
      // 创建普通测试用户
      const testUser = new User({
        username: "testuser",
        phone: "1234567890",
        password: hashedPassword
      });
      await testUser.save();
      console.log("\n🆕 测试用户已创建");

      // 创建管理员用户
      const adminUser = new User({
        username: "admin",
        phone: "13800000000",
        password: hashedPassword,
        role: "admin"
      });
      await adminUser.save();
      console.log("🆕 管理员用户已创建 (admin / password123)");
    }
  } catch (err) {
    console.error("❌ 初始化测试数据失败");
  }
}

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
  process.exit(0);
});

startServer();