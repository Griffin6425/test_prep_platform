# 快速启动指南

## 一、环境准备

### 1. 安装 Node.js
确保已安装 Node.js v14 或更高版本：
```bash
node --version
npm --version
```

### 2. 安装 PostgreSQL
- **macOS**: `brew install postgresql`
- **Windows**: 从官网下载安装
- **Linux**: `sudo apt-get install postgresql`

启动 PostgreSQL 服务：
```bash
# macOS
brew services start postgresql

# Linux
sudo service postgresql start

# Windows
# PostgreSQL 会作为服务自动启动
```

## 二、数据库设置

### 1. 创建数据库

进入 PostgreSQL：
```bash
psql postgres
```

创建数据库：
```sql
CREATE DATABASE quiz_platform;
\q
```

### 2. 配置数据库连接

编辑 `backend/.env` 文件，修改数据库密码：
```env
DB_PASSWORD=your_actual_password
```

## 三、安装依赖

在项目根目录执行：
```bash
npm run install-all
```

或者手动安装：
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

## 四、初始化数据库

在项目根目录执行：
```bash
npm run migrate
```

你应该看到：
```
✅ Database tables created successfully!
```

## 五、启动项目

### 方式一：分别启动（推荐用于开发）

**终端 1 - 启动后端**：
```bash
cd backend
npm run dev
```

看到 `🚀 Server is running on port 5000` 表示成功。

**终端 2 - 启动前端**：
```bash
cd frontend
npm start
```

浏览器会自动打开 `http://localhost:3000`

### 方式二：使用 npm-run-all（可选）

安装 npm-run-all：
```bash
npm install -g npm-run-all
```

然后可以在根目录一次性启动：
```bash
npm-run-all --parallel dev:backend dev:frontend
```

## 六、开始使用

1. 打开浏览器访问 `http://localhost:3000`
2. 点击"注册"创建账号
3. 登录后即可创建题库和添加题目

## 七、测试功能

### 创建第一个题库
1. 点击"创建新题库"
2. 输入标题：`JavaScript 基础练习`
3. 输入描述：`JavaScript 常见面试题`
4. 点击"创建"

### 添加第一道题目
1. 点击刚创建的题库卡片上的"管理题目"按钮
2. 在表单中输入：
   - 题目内容：`JavaScript 中 var、let、const 的区别是什么？`
   - 题目类型：单选题
   - 添加 4 个选项：
     - A. var 有块级作用域
     - B. let 可以重复声明
     - C. const 声明的变量不能被修改
     - D. let 和 const 有块级作用域
   - 勾选 D 选项为正确答案
   - 解析：`let 和 const 都有块级作用域，const 声明的对象内部属性可以修改`
3. 点击"保存题目"

### 开始刷题
1. 返回题库列表
2. 点击"开始刷题"
3. 选择答案并提交
4. 查看正确率统计

## 八、常见问题排查

### 问题 1：数据库连接失败
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方案**：
1. 确认 PostgreSQL 正在运行：
   ```bash
   # macOS
   brew services list

   # Linux
   sudo service postgresql status
   ```

2. 检查数据库配置：
   ```bash
   psql -U postgres -d quiz_platform
   ```

### 问题 2：端口被占用
```
Error: listen EADDRINUSE: address already in use :::5000
```

**解决方案**：
1. 修改 `backend/.env` 中的 PORT
2. 或者杀死占用端口的进程：
   ```bash
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9

   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

### 问题 3：前端无法连接后端
```
Network Error
```

**解决方案**：
1. 确认后端在运行（终端显示 `Server is running`）
2. 检查 `frontend/.env` 中的 API_URL 配置
3. 查看浏览器控制台的详细错误信息

### 问题 4：npm install 失败

**解决方案**：
1. 清除缓存：
   ```bash
   npm cache clean --force
   ```

2. 删除 node_modules 重新安装：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. 使用淘宝镜像（中国用户）：
   ```bash
   npm config set registry https://registry.npmmirror.com
   ```

## 九、生产环境部署（可选）

### 1. 构建前端
```bash
cd frontend
npm run build
```

### 2. 配置后端服务生产环境变量
```bash
cd backend
cp .env.example .env.production
```

编辑 `.env.production`：
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
JWT_SECRET=your_strong_secret_key
```

### 3. 启动生产服务器
```bash
cd backend
NODE_ENV=production npm start
```

### 4. 使用 PM2（推荐）
```bash
npm install -g pm2
pm2 start backend/src/index.js --name quiz-backend
pm2 startup
pm2 save
```

## 十、技术支持

遇到问题？查看完整文档：
- [README.md](README.md) - 完整项目文档
- [API 文档](#api-接口文档) - 后端 API 说明

## 下一步

现在你已经成功运行了刷题平台！接下来可以：

- ✅ 创建多个题库进行分类管理
- ✅ 添加更多题目丰富题库
- ✅ 邀请朋友一起使用（每人需要注册自己的账号）
- ✅ 查看统计数据分析学习效果
- ✅ 根据需求扩展功能

祝你使用愉快！
