# 项目结构说明

## 完整目录树

```
training_platform/
│
├── README.md                    # 项目主文档
├── QUICKSTART.md                # 快速启动指南
├── FEATURES.md                  # 功能特性详解
├── PROJECT_STRUCTURE.md         # 本文件
├── .gitignore                   # Git 忽略规则
├── package.json                 # 根目录脚本配置
│
├── backend/                     # 后端应用
│   ├── package.json            # 后端依赖配置
│   ├── .env                    # 环境变量（不提交）
│   ├── .env.example            # 环境变量模板
│   │
│   └── src/                    # 源代码目录
│       ├── index.js            # 服务器入口文件
│       │
│       ├── config/             # 配置文件
│       │   ├── database.js     # 数据库连接配置
│       │   └── migrate.js      # 数据库迁移脚本
│       │
│       ├── controllers/        # 控制器（业务逻辑）
│       │   ├── authController.js      # 用户认证相关
│       │   ├── quizSetController.js   # 题库管理相关
│       │   └── questionController.js  # 题目管理相关
│       │
│       ├── middlewares/        # 中间件
│       │   └── auth.js         # JWT 认证中间件
│       │
│       ├── routes/             # 路由定义
│       │   ├── authRoutes.js       # 认证路由
│       │   ├── quizSetRoutes.js    # 题库路由
│       │   └── questionRoutes.js   # 题目路由
│       │
│       └── utils/              # 工具函数
│           └── jwt.js          # JWT 生成和验证
│
└── frontend/                   # 前端应用
    ├── package.json           # 前端依赖配置
    ├── .env                   # 环境变量
    │
    ├── public/                # 静态资源
    │   └── index.html         # HTML 模板
    │
    └── src/                   # 源代码目录
        ├── index.js           # 应用入口
        ├── App.js             # 根组件
        │
        ├── components/        # 可复用组件
        │   ├── Navbar.js          # 导航栏
        │   └── PrivateRoute.js    # 私有路由保护
        │
        ├── contexts/          # React Context
        │   └── AuthContext.js     # 认证状态管理
        │
        ├── pages/             # 页面组件
        │   ├── Login.js           # 登录页
        │   ├── Register.js        # 注册页
        │   ├── Dashboard.js       # 仪表盘（题库列表）
        │   ├── ManageQuestions.js # 题目管理页（核心）
        │   └── Practice.js        # 刷题练习页
        │
        ├── services/          # API 服务
        │   └── api.js             # Axios 配置和 API 方法
        │
        └── styles/            # 样式文件
            └── App.css            # 全局样式
```

## 文件说明

### 后端文件

#### 入口和配置

| 文件 | 说明 | 关键功能 |
|------|------|----------|
| `src/index.js` | 服务器入口 | Express 应用配置、路由注册、中间件 |
| `src/config/database.js` | 数据库配置 | PostgreSQL 连接池管理 |
| `src/config/migrate.js` | 数据库迁移 | 创建所有表和索引 |

#### 控制器（Controllers）

| 文件 | API 端点 | 主要功能 |
|------|----------|----------|
| `authController.js` | `/api/auth/*` | 注册、登录、获取用户信息 |
| `quizSetController.js` | `/api/quiz-sets/*` | 题库 CRUD 操作 |
| `questionController.js` | `/api/questions/*` | 题目 CRUD、答案提交、统计 |

#### 路由（Routes）

| 文件 | 作用 | 使用的控制器 |
|------|------|--------------|
| `authRoutes.js` | 定义认证相关路由 | authController |
| `quizSetRoutes.js` | 定义题库相关路由 | quizSetController |
| `questionRoutes.js` | 定义题目相关路由 | questionController |

#### 中间件和工具

| 文件 | 作用 |
|------|------|
| `middlewares/auth.js` | 验证 JWT Token，保护需要认证的路由 |
| `utils/jwt.js` | 生成和验证 JWT Token |

### 前端文件

#### 入口和配置

| 文件 | 说明 |
|------|------|
| `src/index.js` | React 应用入口，渲染根组件 |
| `src/App.js` | 根组件，配置路由和认证 |
| `public/index.html` | HTML 模板 |

#### 页面组件（Pages）

| 文件 | 路由 | 功能说明 |
|------|------|----------|
| `Login.js` | `/login` | 用户登录表单 |
| `Register.js` | `/register` | 用户注册表单 |
| `Dashboard.js` | `/dashboard` | 题库列表、创建题库 |
| `ManageQuestions.js` | `/quiz-set/:id/manage` | **核心**：添加题目、管理题目 |
| `Practice.js` | `/quiz-set/:id/practice` | 刷题练习、答案提交、结果统计 |

#### 可复用组件（Components）

| 文件 | 作用 |
|------|------|
| `Navbar.js` | 导航栏，显示用户信息和登出 |
| `PrivateRoute.js` | 保护需要登录的路由 |

#### 状态管理（Contexts）

| 文件 | 作用 |
|------|------|
| `AuthContext.js` | 全局认证状态，提供 login/logout/register 方法 |

#### 服务层（Services）

| 文件 | 作用 |
|------|------|
| `api.js` | Axios 实例配置、API 方法封装 |

#### 样式（Styles）

| 文件 | 作用 |
|------|------|
| `App.css` | 全局样式，包含所有组件样式 |

## 数据流

### 1. 用户注册/登录流程

```
前端组件 (Register.js/Login.js)
    ↓
AuthContext (register/login 方法)
    ↓
API 服务 (authAPI.register/login)
    ↓
后端路由 (authRoutes.js)
    ↓
控制器 (authController.js)
    ↓
数据库 (users 表)
    ↓
返回 JWT Token
    ↓
前端存储到 localStorage
    ↓
后续请求自动带上 Token
```

### 2. 创建题目流程（核心功能）

```
用户填写表单 (ManageQuestions.js)
    ↓
输入题目内容、选择类型
    ↓
动态添加/删除选项
    ↓
标记正确答案
    ↓
提交表单
    ↓
前端验证（至少2个选项、至少1个正确答案）
    ↓
调用 API (questionAPI.create)
    ↓
后端路由 (questionRoutes.js - POST /quiz-sets/:setId/questions)
    ↓
认证中间件验证 Token
    ↓
控制器 (questionController.createQuestion)
    ↓
验证权限（是否是题库所有者）
    ↓
开启数据库事务
    ↓
插入 questions 表
    ↓
循环插入 options 表（关联 question_id）
    ↓
提交事务
    ↓
返回创建的题目数据
    ↓
前端刷新题目列表
```

### 3. 刷题答题流程

```
进入练习页面 (Practice.js)
    ↓
加载题库和所有题目
    ↓
显示第一题
    ↓
用户选择答案
    ↓
点击"提交答案"
    ↓
调用 API (questionAPI.submit)
    ↓
后端验证答案是否正确
    ↓
记录到 user_progress 表
    ↓
返回正确/错误状态和正确答案
    ↓
前端显示答案反馈
    ↓
更新统计数据
    ↓
点击"下一题"
    ↓
重复以上流程
    ↓
最后一题完成后显示总结
```

## 关键设计模式

### 1. MVC 架构（后端）

```
Model (数据库表)
    ↕
Controller (业务逻辑)
    ↕
Routes (路由映射)
    ↕
View (前端通过 API 调用)
```

### 2. 组件化架构（前端）

```
App.js (根组件)
├── Navbar (导航栏)
└── Router (路由)
    ├── Login (登录页)
    ├── Register (注册页)
    ├── Dashboard (仪表盘)
    │   └── QuizSetCard (题库卡片)
    ├── ManageQuestions (题目管理)
    │   ├── QuestionForm (题目表单)
    │   └── QuestionList (题目列表)
    └── Practice (练习页)
        ├── QuestionDisplay (题目显示)
        ├── OptionList (选项列表)
        └── Stats (统计)
```

### 3. 分层架构

```
表现层 (Presentation Layer)
    - React 组件
    - 用户交互
    ↓
业务逻辑层 (Business Logic Layer)
    - Controllers
    - 数据验证
    - 权限检查
    ↓
数据访问层 (Data Access Layer)
    - PostgreSQL 查询
    - 事务管理
    ↓
数据存储层 (Data Storage Layer)
    - PostgreSQL 数据库
```

## 扩展指南

### 添加新功能的步骤

#### 后端

1. **数据库**：在 `migrate.js` 中添加新表
2. **控制器**：在 `controllers/` 中创建新控制器
3. **路由**：在 `routes/` 中定义路由
4. **注册**：在 `index.js` 中注册路由

#### 前端

1. **API**：在 `services/api.js` 中添加 API 方法
2. **页面**：在 `pages/` 中创建新页面组件
3. **路由**：在 `App.js` 中添加路由
4. **样式**：在 `App.css` 中添加样式

### 示例：添加"收藏题目"功能

#### 后端

1. 数据库：添加 `favorites` 表
```javascript
// migrate.js
CREATE TABLE favorites (
  favorite_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  question_id INTEGER REFERENCES questions(question_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. 控制器：创建 `favoriteController.js`
3. 路由：创建 `favoriteRoutes.js`
4. 注册：`app.use('/api/favorites', favoriteRoutes)`

#### 前端

1. API：`favoriteAPI.add()`, `favoriteAPI.getAll()`
2. 页面：`pages/Favorites.js`
3. 路由：`<Route path="/favorites" element={<Favorites />} />`
4. 样式：添加 `.favorites-*` 类

## 总结

这个项目采用了清晰的分层架构和模块化设计，使得代码易于理解、维护和扩展。核心功能"用户自定义题目"通过动态表单和灵活的数据结构完美实现，是整个项目的亮点。
