# 新增功能说明

本文档介绍了刷题平台新增的6大核心功能。

## 功能概览

1. ✅ 题目导入/导出功能（Excel/JSON）
2. ✅ 题目分类和标签系统
3. ✅ 错题本功能
4. ✅ 定时考试模式
5. ✅ 图片上传（题目配图）
6. ✅ 题目搜索功能

---

## 1. 题目导入/导出功能

### 功能说明

支持将题目批量导入或导出为Excel和JSON格式，方便题目的备份、共享和批量管理。

### 导出功能

#### 导出为JSON

**API端点：**
```
GET /api/quiz-sets/:setId/export/json
```

**使用方法（前端）：**
```javascript
const response = await importExportAPI.exportJSON(quizSetId);
// 下载JSON文件
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', `quiz-${quizSetId}.json`);
document.body.appendChild(link);
link.click();
```

**导出格式：**
```json
{
  "quizSet": {
    "title": "JavaScript基础",
    "exportedAt": "2025-01-01T00:00:00.000Z"
  },
  "questions": [
    {
      "questionText": "题目内容",
      "questionType": "single_choice",
      "category": "语法",
      "difficulty": "easy",
      "explanation": "答案解析",
      "imageUrl": "/uploads/images/xxx.jpg",
      "tags": ["标签1", "标签2"],
      "options": [
        { "text": "选项A", "isCorrect": true },
        { "text": "选项B", "isCorrect": false }
      ]
    }
  ]
}
```

#### 导出为Excel

**API端点：**
```
GET /api/quiz-sets/:setId/export/excel
```

**Excel格式：**

| 题目 | 题型 | 分类 | 难度 | 解析 | 选项A | 选项A是否正确 | 选项B | 选项B是否正确 | ... |
|------|------|------|------|------|-------|--------------|-------|--------------|-----|
| 题目内容 | 单选 | 语法 | 简单 | 解析 | 选项A | 是 | 选项B | 否 | ... |

### 导入功能

#### 从JSON导入

**API端点：**
```
POST /api/quiz-sets/:setId/import/json
```

**请求体：**
```json
{
  "questions": [
    {
      "questionText": "题目内容",
      "questionType": "single_choice",
      "category": "语法",
      "difficulty": "easy",
      "explanation": "解析",
      "tags": ["标签1"],
      "options": [
        { "text": "选项A", "isCorrect": true },
        { "text": "选项B", "isCorrect": false }
      ]
    }
  ]
}
```

#### 从Excel导入

**API端点：**
```
POST /api/quiz-sets/:setId/import/excel
```

**使用方法（前端）：**
```javascript
const file = document.querySelector('input[type="file"]').files[0];
await importExportAPI.importExcel(quizSetId, file);
```

### 使用场景

- 备份题库数据
- 在多个用户间分享题库
- 批量创建题目（Excel编辑更方便）
- 数据迁移

---

## 2. 题目分类和标签系统

### 功能说明

支持为题目添加分类和多个标签，便于组织和筛选题目。

### 数据库设计

**新增表：**

1. `tags` - 标签表
   - tag_id (主键)
   - tag_name (标签名，唯一)

2. `question_tags` - 题目标签关联表（多对多）
   - question_id (外键)
   - tag_id (外键)

**questions表新增字段：**
- category (VARCHAR) - 分类
- difficulty (VARCHAR) - 难度等级

### API接口

#### 获取所有标签

```
GET /api/tags
```

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "JavaScript",
      "questionCount": 15,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 为题目添加标签

```
POST /api/questions/:questionId/tags
```

**请求体：**
```json
{
  "tags": ["JavaScript", "ES6", "Promise"]
}
```

### 使用方法

在创建或编辑题目时：

```javascript
// 1. 创建题目时包含分类、难度和标签
const questionData = {
  questionText: "什么是Promise?",
  questionType: "single_choice",
  category: "异步编程",
  difficulty: "medium",
  explanation: "Promise是异步编程的解决方案",
  options: [...],
  tags: ["JavaScript", "ES6", "Promise"]
};

await questionAPI.create(quizSetId, questionData);

// 2. 为现有题目添加标签
await tagAPI.addToQuestion(questionId, ["新标签1", "新标签2"]);
```

### 使用场景

- 按知识点分类（语法、算法、框架等）
- 按难度筛选（简单、中等、困难）
- 按标签查找相关题目
- 创建专题练习

---

## 3. 错题本功能

### 功能说明

自动记录用户答错的题目，支持错题统计、重做练习和标记掌握。

### 数据库设计

**新增表：**

`wrong_questions` - 错题记录表
- wrong_question_id (主键)
- user_id (外键)
- question_id (外键)
- wrong_count (错误次数)
- last_attempted (最后练习时间)
- is_mastered (是否已掌握)

### 自动添加错题

答题错误时自动添加到错题本：

```javascript
// 在questionController.js的submitAnswer方法中
if (!isCorrect) {
  await client.query(
    `INSERT INTO wrong_questions (user_id, question_id, wrong_count, last_attempted)
     VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, question_id)
     DO UPDATE SET
       wrong_count = wrong_questions.wrong_count + 1,
       last_attempted = CURRENT_TIMESTAMP,
       is_mastered = false`,
    [userId, questionId]
  );
}
```

### API接口

#### 获取错题列表

```
GET /api/wrong-questions?includeMastered=false
```

#### 获取错题统计

```
GET /api/wrong-questions/stats
```

**响应：**
```json
{
  "success": true,
  "data": {
    "totalWrong": 50,
    "unmasteredCount": 30,
    "masteredCount": 20,
    "avgWrongCount": "2.5"
  }
}
```

#### 标记为已掌握

```
PUT /api/wrong-questions/:wrongQuestionId/master
```

#### 从错题本移除

```
DELETE /api/wrong-questions/:wrongQuestionId
```

### 使用方法（前端）

```javascript
// 查看错题本
navigate('/wrong-questions');

// 标记为已掌握
await wrongQuestionAPI.markAsMastered(wrongQuestionId);

// 移除错题
await wrongQuestionAPI.remove(wrongQuestionId);
```

### 使用场景

- 查看自己的薄弱环节
- 针对性复习错题
- 跟踪学习进度
- 错题重做练习

---

## 4. 定时考试模式

### 功能说明

支持创建带时间限制的正式考试，自动计时、随机抽题、成绩统计。

### 数据库设计

**新增表：**

1. `exams` - 考试表
   - exam_id (主键)
   - quiz_set_id (外键)
   - user_id (外键)
   - title (考试标题)
   - duration_minutes (时长)
   - total_questions (题目数量)
   - started_at (开始时间)
   - ended_at (结束时间)
   - score (得分)
   - status (状态: not_started/in_progress/completed)

2. `exam_answers` - 考试答案表
   - answer_id (主键)
   - exam_id (外键)
   - question_id (外键)
   - selected_options (选中的选项ID数组)
   - is_correct (是否正确)
   - answered_at (答题时间)

### 考试流程

#### 1. 创建考试

```
POST /api/quiz-sets/:setId/exams
```

**请求体：**
```json
{
  "title": "第一次模拟考试",
  "durationMinutes": 120,
  "questionCount": 50
}
```

#### 2. 开始考试

```
POST /api/exams/:examId/start
```

- 自动记录开始时间
- 随机抽取指定数量的题目
- 返回题目列表（不包含正确答案）

#### 3. 提交考试

```
POST /api/exams/:examId/submit
```

**请求体：**
```json
{
  "answers": [
    {
      "questionId": 1,
      "selectedOptions": [101, 102]
    }
  ]
}
```

**自动判分逻辑：**
- 检查考试时间是否超时
- 批量判断每道题的正确性
- 计算总分
- 更新考试状态为completed

#### 4. 查看成绩

```
GET /api/exams/:examId/results
```

**响应：**
```json
{
  "success": true,
  "data": {
    "exam": {
      "id": 1,
      "title": "第一次模拟考试",
      "score": 85.5,
      "totalQuestions": 50,
      "status": "completed"
    },
    "answers": [
      {
        "questionId": 1,
        "questionText": "题目内容",
        "isCorrect": true,
        "selectedOptions": [101],
        "explanation": "解析"
      }
    ]
  }
}
```

### 前端功能

#### 倒计时

```javascript
const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

useEffect(() => {
  if (timeLeft > 0) {
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  } else {
    handleSubmitExam(); // 时间到自动提交
  }
}, [timeLeft]);
```

#### 答题卡

显示所有题目的答题状态，可快速跳转。

### 使用场景

- 模拟考试
- 定期测验
- 阶段性评估
- 压力测试

---

## 5. 图片上传（题目配图）

### 功能说明

支持为题目上传图片，适用于图表题、示意图等需要配图的场景。

### 技术实现

使用 `multer` 中间件处理文件上传。

#### 配置（backend/src/config/upload.js）

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'question-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
```

### API接口

#### 上传图片

```
POST /api/questions/:questionId/image
Content-Type: multipart/form-data
```

**使用方法（前端）：**
```javascript
const file = document.querySelector('input[type="file"]').files[0];
await uploadAPI.uploadImage(questionId, file);
```

#### 删除图片

```
DELETE /api/questions/:questionId/image
```

### 数据库字段

**questions表新增字段：**
- image_url (TEXT) - 图片URL

### 显示图片

```javascript
{question.imageUrl && (
  <img
    src={`http://localhost:5000${question.imageUrl}`}
    alt="题目配图"
    style={{ maxWidth: '500px' }}
  />
)}
```

### 使用场景

- 数据可视化题目（图表、曲线）
- 代码截图
- 示意图、流程图
- 图片选择题

---

## 6. 题目搜索功能

### 功能说明

支持多维度搜索题目：关键词、标签、分类、难度。

### API接口

```
GET /api/quiz-sets/:setId/search
```

**查询参数：**
- keyword (string) - 搜索关键词（题目内容或解析）
- tags (array) - 标签筛选
- category (string) - 分类筛选
- difficulty (string) - 难度筛选

**示例：**
```
GET /api/quiz-sets/1/search?keyword=promise&category=异步编程&difficulty=medium&tags=ES6
```

### 实现逻辑

```javascript
let query = `
  SELECT DISTINCT q.*
  FROM questions q
  LEFT JOIN question_tags qt ON q.question_id = qt.question_id
  LEFT JOIN tags t ON qt.tag_id = t.tag_id
  WHERE q.quiz_set_id = $1
`;

// 关键词搜索（ILIKE支持大小写不敏感）
if (keyword) {
  query += ` AND (q.question_text ILIKE '%${keyword}%' OR q.explanation ILIKE '%${keyword}%')`;
}

// 分类筛选
if (category) {
  query += ` AND q.category = '${category}'`;
}

// 难度筛选
if (difficulty) {
  query += ` AND q.difficulty = '${difficulty}'`;
}

// 标签筛选
if (tags) {
  query += ` AND t.tag_name IN (${tags.join(',')})`;
}
```

### 使用方法（前端）

```javascript
const searchQuestions = async () => {
  const results = await questionAPI.search(quizSetId, {
    keyword: searchKeyword,
    category: selectedCategory,
    difficulty: selectedDifficulty,
    tags: selectedTags
  });
  setFilteredQuestions(results.data.data);
};
```

### 使用场景

- 查找特定知识点的题目
- 按难度筛选练习
- 标签组合搜索
- 快速定位题目

---

## 安装和部署

### 1. 安装新依赖

```bash
cd backend
npm install multer xlsx
```

### 2. 运行数据库迁移

```bash
npm run migrate
```

这会创建所有新增的数据库表：
- tags
- question_tags
- wrong_questions
- exams
- exam_answers

并为questions表添加新字段：
- image_url
- category
- difficulty

### 3. 创建上传目录

```bash
mkdir -p backend/uploads/images
```

### 4. 启动服务

```bash
# 后端
cd backend
npm run dev

# 前端
cd frontend
npm start
```

---

## 使用示例

### 完整工作流程

1. **创建题库并批量导入**
   ```bash
   # 准备Excel文件，包含100道题目
   # 通过导入功能一次性导入
   ```

2. **为题目添加分类和标签**
   ```javascript
   // 创建题目时指定
   category: "算法",
   difficulty: "hard",
   tags: ["动态规划", "字符串"]
   ```

3. **上传题目配图**
   ```javascript
   // 为有图表的题目上传图片
   await uploadAPI.uploadImage(questionId, imageFile);
   ```

4. **开始练习**
   ```bash
   # 用户答题，错题自动进入错题本
   ```

5. **创建模拟考试**
   ```javascript
   await examAPI.create(quizSetId, {
     title: "期末模拟考试",
     durationMinutes: 120,
     questionCount: 50
   });
   ```

6. **查看错题本**
   ```bash
   # 针对薄弱环节重点练习
   ```

7. **搜索和筛选**
   ```javascript
   // 按标签搜索特定知识点
   await questionAPI.search(quizSetId, { tags: ["动态规划"] });
   ```

8. **导出备份**
   ```javascript
   // 定期导出JSON备份
   await importExportAPI.exportJSON(quizSetId);
   ```

---

## API快速参考

### 导入/导出
- `GET /api/quiz-sets/:setId/export/json` - 导出JSON
- `GET /api/quiz-sets/:setId/export/excel` - 导出Excel
- `POST /api/quiz-sets/:setId/import/json` - 导入JSON
- `POST /api/quiz-sets/:setId/import/excel` - 导入Excel

### 标签和搜索
- `GET /api/tags` - 获取所有标签
- `POST /api/questions/:questionId/tags` - 添加标签
- `GET /api/quiz-sets/:setId/search` - 搜索题目

### 错题本
- `GET /api/wrong-questions` - 获取错题列表
- `GET /api/wrong-questions/stats` - 错题统计
- `PUT /api/wrong-questions/:id/master` - 标记已掌握
- `DELETE /api/wrong-questions/:id` - 移除错题

### 考试
- `POST /api/quiz-sets/:setId/exams` - 创建考试
- `POST /api/exams/:examId/start` - 开始考试
- `POST /api/exams/:examId/submit` - 提交考试
- `GET /api/exams/:examId/results` - 查看成绩
- `GET /api/exams` - 获取考试列表

### 图片上传
- `POST /api/questions/:questionId/image` - 上传图片
- `DELETE /api/questions/:questionId/image` - 删除图片

---

## 总结

这6个新功能大幅提升了刷题平台的实用性：

1. **导入/导出** - 便于题目管理和分享
2. **分类标签** - 更好的组织和筛选
3. **错题本** - 针对性复习薄弱点
4. **考试模式** - 模拟真实考试场景
5. **图片上传** - 支持更丰富的题型
6. **搜索功能** - 快速定位题目

所有功能都已实现完整的前后端，可以立即使用！
