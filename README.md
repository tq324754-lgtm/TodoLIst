[README.md](https://github.com/user-attachments/files/29209894/README.md)
# TodoList - 智能待办事项管理应用

一款基于 **Vue 3 + TypeScript + Express + MongoDB** 的前后端分离待办事项管理应用，支持用户登录、云端同步、拖拽排序、倒计时提醒、数据统计和管理后台等功能。

## 技术栈

### 前端

| 技术 | 说明 |
|------|------|
| Vue 3 | 渐进式 JavaScript 框架（Composition API） |
| TypeScript | 类型安全的 JavaScript 超集 |
| Vite | 下一代前端构建工具 |
| Element Plus | 基于 Vue 3 的 UI 组件库 |
| Naive UI | Vue 3 组件库 |
| Pinia | Vue 状态管理库 + persistedstate 持久化插件 |
| Vue Router | 官方路由管理器 |
| ECharts | 数据可视化图表库 |
| vuedraggable | 基于 Sortable.js 的拖拽排序组件 |
| Axios | HTTP 请求库 |
| Sass | CSS 预处理器 |

### 后端

| 技术 | 说明 |
|------|------|
| Node.js | JavaScript 运行时 |
| Express | Web 应用框架 |
| MongoDB | NoSQL 文档数据库 |
| Mongoose | MongoDB ODM |
| JWT | JSON Web Token 身份认证 |
| bcryptjs | 密码哈希加密 |
| CORS | 跨域资源共享中间件 |
| dotenv | 环境变量管理 |

## 项目结构

```
TodoList/
├── client/                     # 前端项目
│   ├── src/
│   │   ├── api/                # API 接口封装
│   │   ├── assets/             # 静态资源
│   │   ├── components/         # 公共组件
│   │   ├── hooks/              # 组合式函数（如 useTheme）
│   │   ├── router/             # 路由配置与守卫
│   │   ├── stores/             # Pinia 状态管理
│   │   │   ├── todo.ts         # 待办事项状态
│   │   │   └── user.ts         # 用户状态
│   │   ├── types/              # TypeScript 类型定义
│   │   ├── utils/              # 工具函数（如 axios 封装）
│   │   └── views/              # 页面组件
│   │       ├── TodoList.vue        # 待办主页面
│   │       ├── Statistic.vue       # 数据统计
│   │       ├── Target.vue          # 目标管理
│   │       ├── CollectionList.vue  # 待办集列表
│   │       ├── UserCollection.vue  # 待办集详情
│   │       ├── UserLogin.vue       # 登录
│   │       ├── UserRegister.vue    # 注册
│   │       ├── Mine.vue            # 个人中心
│   │       ├── HomeView.vue        # 主页布局（底部导航）
│   │       └── admin/              # 管理后台
│   │           ├── AdminLayout.vue     # 后台布局
│   │           ├── AdminDashboard.vue  # 仪表盘
│   │           └── AdminUsers.vue      # 用户管理
│   ├── vite.config.ts
│   └── package.json
│
├── server/                     # 后端项目
│   ├── models/                 # 数据模型
│   │   ├── User.js             # 用户模型
│   │   ├── Todo.js             # 待办模型
│   │   ├── Collection.js       # 待办集模型
│   │   └── Goal.js             # 目标模型
│   ├── routes/                 # API 路由
│   │   ├── user.js             # 用户登录/注册
│   │   ├── todo.js             # 待办 CRUD + 统计
│   │   ├── collection.js       # 待办集管理
│   │   ├── goal.js             # 目标管理
│   │   └── admin.js            # 管理后台接口
│   ├── middleware/             # 中间件
│   │   └── auth.js             # JWT 认证 & 权限校验
│   ├── app.js                  # 应用入口
│   ├── db.js                   # 数据库配置
│   └── package.json
└── README.md
```

## 功能模块

### 用户端

- **待办事项管理** — 添加、编辑、删除、标记完成，支持拖拽排序
- **倒计时提醒** — 为任务设置倒计时，到时自动标记完成
- **筛选过滤** — 全部 / 未完成 / 已完成三种筛选模式
- **数据可视化** — ECharts 饼图实时展示任务完成情况
- **暗色主题** — 一键切换亮色/暗色主题
- **待办集** — 按主题/项目分组管理待办
- **目标管理** — 设定和追踪个人目标
- **数据统计** — 每日/每周完成任务的统计分析
- **本地/云端双模式** — 未登录数据存本地，登录后自动同步云端

### 管理后台

- **数据仪表盘** — 用户数、任务数、完成率等数据概览，含趋势图表
- **用户管理** — 查看用户列表、修改角色（管理员/普通用户）、禁用账号、重置密码、级联删除
- **权限控制** — 基于 JWT + 角色校验的路由守卫

## 快速开始

### 环境要求

- Node.js >= 20.19.0
- npm 或 yarn

### 1. 克隆项目

```bash
git clone <项目地址>
cd TodoList
```

### 2. 启动后端

```bash
cd server
npm install
npm start
```

后端默认运行在 `http://localhost:3000`，使用 MongoDB 文件存储模式（mongodb-memory-server），无需单独安装 MongoDB。

首次启动会自动创建两个测试账号：

| 账号 | 密码 | 角色 |
|------|------|------|
| testuser | password123 | 普通用户 |
| admin | password123 | 管理员 |

### 3. 启动前端

```bash
cd client
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`，已配置 Vite 代理将 `/api` 请求转发到后端 `localhost:3000`。

## API 接口

### 用户模块 `/api/user`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /login | 用户登录 |
| POST | /register | 用户注册 |

### 待办模块 `/api/todos`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | / | 获取任务列表（支持 userId/collectionId 参数） |
| POST | / | 新增任务 |
| PUT | /:id | 修改任务 |
| DELETE | /:id | 删除任务 |
| GET | /today-stats | 今日统计 |
| GET | /weekly-stats | 近7天统计 |

### 管理后台 `/api/admin`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /dashboard | 仪表盘数据 |
| GET | /users | 用户列表 |
| PUT | /users/:id/role | 修改用户角色 |
| PUT | /users/:id/status | 禁用/启用用户 |
| PUT | /users/:id/password | 重置密码 |
| DELETE | /users/:id | 删除用户（级联删除关联数据） |

## 数据模型

### User

| 字段 | 类型 | 说明 |
|------|------|------|
| username | String | 用户名（唯一） |
| phone | String | 手机号 |
| password | String | 密码（bcrypt 加密） |
| role | String | 角色：user / admin |
| status | String | 状态：active / disabled |
| createdAt | Date | 注册时间 |

### Todo

| 字段 | 类型 | 说明 |
|------|------|------|
| text | String | 任务内容 |
| done | Boolean | 是否完成 |
| userId | ObjectId | 关联用户 |
| endTime | Number | 倒计时截止时间戳 |
| collectionId | ObjectId | 关联待办集 |
| createdAt | Date | 创建时间 |
