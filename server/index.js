const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let todos = [];

//获取
app.get("/todos", (req, res) => {
  res.json(todos);
});

//添加
app.post("/todos", (req, res) => {
  const todo = {
    id: Date.now(),
    text: req.body.text,
    done: false,
  };
  todos.push(todo);
  res.json(todo);
});

//删除
app.delete("/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  todos = todos.filter((t) => t.id != id);
  res.json({ success: true });
});

//修改
app.put("/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    if (req.body.text !== undefined) {
      todo.text = req.body.text;
    }
    if (req.body.done !== undefined) {
      todo.done = req.body.done;
    }
  }
  res.json(todo);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
