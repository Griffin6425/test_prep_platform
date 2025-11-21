# 自定义刷题平台

一个全栈的刷题网站，支持用户自定义题库、创建题目、在线刷题和成绩统计。

## 技术栈

### 后端
- Node.js + Express
- PostgreSQL 数据库
- JWT 用户认证
- bcrypt 密码加密

### 前端
- React 18
- React Router v6
- Axios
- CSS3

## 功能特点

### 核心功能
1. **用户系统**
   - 用户注册和登录
   - JWT token 认证
   - 密码加密存储

2. **题库管理**
   - 创建自定义题库
   - 编辑题库信息
   - 删除题库

3. **题目管理（核心功能）**
   - 动态添加题目
   - 支持单选题和多选题
   - 动态添加/删除选项
   - 标记正确答案
   - 添加题目解析
   - 删除题目

4. **刷题功能**
   - 逐题练习模式
   - 实时答案反馈
   - 显示正确/错误状态
   - 查看答案解析
   - 进度追踪

5. **统计分析**
   - 实时正确率统计
   - 答题记录保存
   - 成绩总结展示

## 项目结构

```
training_platform/
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── config/         # 配置文件（数据库、迁移）
│   │   ├── controllers/    # 控制器（业务逻辑）
│   │   ├── middlewares/    # 中间件（认证等）
│   │   ├── routes/         # 路由定义
│   │   ├── utils/          # 工具函数（JWT等）
│   │   └── index.js        # 服务器入口
│   ├── package.json
│   └── .env                # 环境变量
│
├── frontend/               # 前端代码
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── contexts/       # React Context（认证等）
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务
│   │   ├── styles/         # 样式文件
│   │   ├── App.js          # 主应用组件
│   │   └── index.js        # 应用入口
│   ├── package.json
│   └── .env                # 环境变量
│
└── README.md               # 项目文档
```

## 数据库设计

### 表结构

1. **users（用户表）**
   - user_id (主键)
   - username (用户名)
   - email (邮箱)
   - password_hash (加密密码)
   - created_at, updated_at

2. **quiz_sets（题库表）**
   - quiz_set_id (主键)
   - title (题库标题)
   - description (描述)
   - owner_id (外键 → users)
   - created_at, updated_at

3. **questions（题目表）**
   - question_id (主键)
   - quiz_set_id (外键 → quiz_sets)
   - question_text (题目内容)
   - question_type (single_choice/multi_choice)
   - explanation (答案解析)
   - created_at, updated_at

4. **options（选项表）**
   - option_id (主键)
   - question_id (外键 → questions)
   - option_text (选项内容)
   - is_correct (是否为正确答案)
   - created_at

5. **user_progress（用户进度表）**
   - progress_id (主键)
   - user_id (外键 → users)
   - quiz_set_id (外键 → quiz_sets)
   - question_id (外键 → questions)
   - is_correct (是否答对)
   - attempted_at

## 安装和运行

### 前置要求

- Node.js (v14+)
- PostgreSQL (v12+)
- npm 或 yarn

### 1. 克隆项目

```bash
cd training_platform
```

### 2. 设置数据库

安装并启动 PostgreSQL，然后创建数据库：

```sql
CREATE DATABASE quiz_platform;
```

### 3. 配置后端

```bash
cd backend
npm install
```

编辑 `.env` 文件，配置数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quiz_platform
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

运行数据库迁移（创建表）：

```bash
npm run migrate
```

启动后端服务器：

```bash
npm run dev
# 或
npm start
```

后端将运行在 `http://localhost:5000`

### 4. 配置前端

打开新终端窗口：

```bash
cd frontend
npm install
```

确认 `.env` 文件配置正确：

```env
REACT_APP_API_URL=http://localhost:5000/api
```

启动前端开发服务器：

```bash
npm start
```

前端将运行在 `http://localhost:3000`

## API 接口文档

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息（需要认证）

### 题库相关

- `GET /api/quiz-sets` - 获取所有题库（需要认证）
- `GET /api/quiz-sets/:setId` - 获取单个题库（需要认证）
- `POST /api/quiz-sets` - 创建题库（需要认证）
- `PUT /api/quiz-sets/:setId` - 更新题库（需要认证）
- `DELETE /api/quiz-sets/:setId` - 删除题库（需要认证）

### 题目相关

- `GET /api/quiz-sets/:setId/questions` - 获取题库的所有题目（需要认证）
- `POST /api/quiz-sets/:setId/questions` - 创建新题目（需要认证）
- `PUT /api/questions/:questionId` - 更新题目（需要认证）
- `DELETE /api/questions/:questionId` - 删除题目（需要认证）
- `POST /api/questions/:questionId/submit` - 提交答案（需要认证）
- `GET /api/quiz-sets/:setId/stats` - 获取统计信息（需要认证）

## 使用说明

### 1. 注册/登录
- 首次使用需要注册账号
- 已有账号可直接登录

### 2. 创建题库
- 登录后点击"创建新题库"
- 输入题库标题和描述
- 点击"创建"完成

### 3. 添加题目（核心功能）
- 在题库列表中点击"管理题目"
- 填写题目内容
- 选择题目类型（单选/多选）
- 添加选项（可动态增删）
- 勾选复选框标记正确答案
- 填写答案解析（可选）
- 点击"保存题目"

### 4. 开始刷题
- 在题库列表中点击"开始刷题"
- 阅读题目，选择答案
- 点击"提交答案"查看结果
- 点击"下一题"继续
- 完成后查看总体统计

## 开发说明

### 后端开发

- 控制器位于 [backend/src/controllers/](backend/src/controllers/)
- 路由定义在 [backend/src/routes/](backend/src/routes/)
- 数据库配置在 [backend/src/config/database.js](backend/src/config/database.js)

### 前端开发

- 页面组件位于 [frontend/src/pages/](frontend/src/pages/)
- API 服务在 [frontend/src/services/api.js](frontend/src/services/api.js)
- 样式文件在 [frontend/src/styles/App.css](frontend/src/styles/App.css)

## 安全注意事项

1. **生产环境配置**
   - 修改 JWT_SECRET 为强密码
   - 使用 HTTPS
   - 配置 CORS 白名单
   - 启用 rate limiting

2. **数据库安全**
   - 使用强密码
   - 限制数据库访问权限
   - 定期备份数据

3. **密码安全**
   - 已使用 bcrypt 加密
   - 建议密码长度至少 8 位

## 常见问题

### 数据库连接失败
- 检查 PostgreSQL 是否运行
- 确认数据库连接信息正确
- 确保数据库已创建

### 前端无法连接后端
- 确认后端服务器正在运行
- 检查 CORS 配置
- 查看浏览器控制台错误信息

### Token 认证失败
- 确认 JWT_SECRET 配置正确
- 检查 token 是否过期
- 清除浏览器 localStorage 重新登录

## 未来改进方向

- [ ] 题目导入/导出功能（Excel/JSON）
- [ ] 题目分类和标签系统
- [ ] 错题本功能
- [ ] 多用户协作共享题库
- [ ] 定时考试模式
- [ ] 题目搜索功能
- [ ] 图片上传（题目配图）
- [ ] 富文本编辑器支持
- [ ] 移动端适配

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请提交 Issue 或联系开发者。
