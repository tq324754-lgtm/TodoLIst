const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const userRoutes = require("./routes/user");
const todoRoutes = require("./routes/todo");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// 接口
app.use("/api/user", userRoutes);
app.use("/api/todos", todoRoutes);



app.listen(3000, () => {
  console.log("Server running on port 3000");
});
