# 使用示例

本文档提供新功能的实际使用示例。

## 目录

1. [导入/导出题目](#1-导入导出题目)
2. [使用标签和分类](#2-使用标签和分类)
3. [错题本功能](#3-错题本功能)
4. [创建定时考试](#4-创建定时考试)
5. [上传题目图片](#5-上传题目图片)
6. [搜索题目](#6-搜索题目)

---

## 1. 导入/导出题目

### 导出为JSON

**前端代码示例：**

```javascript
// 在ManageQuestions组件中添加导出按钮
import { importExportAPI } from '../services/api';

const handleExportJSON = async () => {
  try {
    const response = await importExportAPI.exportJSON(setId);

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([JSON.stringify(response.data, null, 2)]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quiz-set-${setId}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    console.log('题库已导出为JSON');
  } catch (error) {
    console.error('导出失败:', error);
  }
};
```

### 导出为Excel

```javascript
const handleExportExcel = async () => {
  try {
    const response = await importExportAPI.exportExcel(setId);

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quiz-set-${setId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('导出失败:', error);
  }
};
```

### 从JSON导入

```javascript
const handleImportJSON = async (file) => {
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const jsonData = JSON.parse(e.target.result);
      await importExportAPI.importJSON(setId, jsonData);
      console.log('导入成功');
      loadQuestions(); // 重新加载题目列表
    };
    reader.readAsText(file);
  } catch (error) {
    console.error('导入失败:', error);
  }
};

// JSX
<input
  type="file"
  accept=".json"
  onChange={(e) => handleImportJSON(e.target.files[0])}
/>
```

### 从Excel导入

```javascript
const handleImportExcel = async (file) => {
  try {
    await importExportAPI.importExcel(setId, file);
    console.log('导入成功');
    loadQuestions();
  } catch (error) {
    console.error('导入失败:', error);
  }
};

// JSX
<input
  type="file"
  accept=".xlsx,.xls"
  onChange={(e) => handleImportExcel(e.target.files[0])}
/>
```

### Excel模板格式

| 题目 | 题型 | 分类 | 难度 | 解析 | 选项A | 选项A是否正确 | 选项B | 选项B是否正确 | 选项C | 选项C是否正确 | 选项D | 选项D是否正确 |
|------|------|------|------|------|-------|--------------|-------|--------------|-------|--------------|-------|--------------|
| JavaScript中var和let的区别？ | 单选 | 语法 | 简单 | let有块级作用域，var没有 | var有块级作用域 | 否 | let有块级作用域 | 是 | 两者相同 | 否 | 都没有 | 否 |
| Promise的状态有哪些？ | 多选 | 异步 | 中等 | Promise有三种状态 | pending | 是 | fulfilled | 是 | rejected | 是 | completed | 否 |

---

## 2. 使用标签和分类

### 创建带标签的题目

```javascript
const createQuestionWithTags = async () => {
  const questionData = {
    questionText: "什么是闭包？",
    questionType: "single_choice",
    category: "JavaScript基础",  // 分类
    difficulty: "medium",         // 难度
    explanation: "闭包是指有权访问另一个函数作用域中变量的函数",
    tags: ["JavaScript", "闭包", "作用域"],  // 标签数组
    options: [
      { text: "一种数据类型", isCorrect: false },
      { text: "访问外部变量的函数", isCorrect: true },
      { text: "一种循环结构", isCorrect: false },
      { text: "一种对象", isCorrect: false }
    ]
  };

  await questionAPI.create(quizSetId, questionData);
};
```

### 为现有题目添加标签

```javascript
import { tagAPI } from '../services/api';

const addTags = async (questionId) => {
  const tags = ["ES6", "Promise", "异步编程"];
  await tagAPI.addToQuestion(questionId, tags);
  console.log('标签已添加');
};
```

### 获取所有标签

```javascript
const [tags, setTags] = useState([]);

useEffect(() => {
  loadTags();
}, []);

const loadTags = async () => {
  try {
    const response = await tagAPI.getAll();
    setTags(response.data.data);
  } catch (error) {
    console.error('获取标签失败:', error);
  }
};

// 显示标签列表
{tags.map(tag => (
  <div key={tag.id}>
    {tag.name} ({tag.questionCount}题)
  </div>
))}
```

---

## 3. 错题本功能

### 自动添加（已集成）

错题会在用户答错时自动添加，无需手动操作。

### 查看错题本

```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// 跳转到错题本页面
<button onClick={() => navigate('/wrong-questions')}>
  查看错题本
</button>
```

### 获取错题统计

```javascript
const [stats, setStats] = useState(null);

useEffect(() => {
  loadWrongQuestionsStats();
}, []);

const loadWrongQuestionsStats = async () => {
  try {
    const response = await wrongQuestionAPI.getStats();
    setStats(response.data.data);
  } catch (error) {
    console.error('获取统计失败:', error);
  }
};

// 显示统计
{stats && (
  <div>
    <p>总错题数: {stats.totalWrong}</p>
    <p>未掌握: {stats.unmasteredCount}</p>
    <p>已掌握: {stats.masteredCount}</p>
  </div>
)}
```

### 标记为已掌握

```javascript
const markAsMastered = async (wrongQuestionId) => {
  try {
    await wrongQuestionAPI.markAsMastered(wrongQuestionId);
    console.log('已标记为掌握');
    loadWrongQuestions(); // 重新加载
  } catch (error) {
    console.error('标记失败:', error);
  }
};
```

---

## 4. 创建定时考试

### 创建考试

```javascript
const createExam = async () => {
  const examData = {
    title: "JavaScript期末考试",
    durationMinutes: 120,  // 120分钟
    questionCount: 50      // 50道题，0表示全部题目
  };

  try {
    const response = await examAPI.create(quizSetId, examData);
    const examId = response.data.data.id;
    console.log('考试已创建，ID:', examId);

    // 跳转到考试页面
    navigate(`/exam/${examId}`);
  } catch (error) {
    console.error('创建考试失败:', error);
  }
};
```

### 开始考试

```javascript
const startExam = async (examId) => {
  try {
    const response = await examAPI.start(examId);
    const examData = response.data.data;

    setExam(examData);
    setQuestions(examData.questions);
    setTimeLeft(examData.durationMinutes * 60); // 转换为秒
  } catch (error) {
    console.error('开始考试失败:', error);
  }
};
```

### 实现倒计时

```javascript
const [timeLeft, setTimeLeft] = useState(0);

useEffect(() => {
  if (timeLeft > 0) {
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  } else if (timeLeft === 0 && exam) {
    // 时间到，自动提交
    handleSubmitExam();
  }
}, [timeLeft]);

// 格式化时间显示
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 显示
<div style={{ color: timeLeft < 300 ? 'red' : 'blue' }}>
  {formatTime(timeLeft)}
</div>
```

### 提交考试

```javascript
const handleSubmitExam = async () => {
  const formattedAnswers = questions.map(q => ({
    questionId: q.id,
    selectedOptions: answers[q.id] || []
  }));

  try {
    const response = await examAPI.submit(examId, formattedAnswers);
    const result = response.data.data;

    console.log('考试完成');
    console.log('得分:', result.score);
    console.log('正确题数:', result.correctCount);

    // 跳转到成绩页面
    navigate(`/exam/${examId}/results`);
  } catch (error) {
    console.error('提交失败:', error);
  }
};
```

---

## 5. 上传题目图片

### 添加图片上传UI

```javascript
import { uploadAPI } from '../services/api';

const QuestionImageUpload = ({ questionId, currentImageUrl, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadAPI.uploadImage(questionId, file);
      console.log('上传成功:', response.data.data.imageUrl);
      onUploadSuccess(response.data.data.imageUrl);
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async () => {
    if (!window.confirm('确定要删除图片吗？')) return;

    try {
      await uploadAPI.deleteImage(questionId);
      console.log('图片已删除');
      onUploadSuccess(null);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  return (
    <div className="form-group">
      <label>题目配图（可选）</label>

      {currentImageUrl ? (
        <div>
          <img
            src={`http://localhost:5000${currentImageUrl}`}
            alt="题目配图"
            style={{ maxWidth: '400px', display: 'block', marginBottom: '1rem' }}
          />
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleImageDelete}
          >
            删除图片
          </button>
        </div>
      ) : (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          {uploading && <span>上传中...</span>}
        </div>
      )}
    </div>
  );
};
```

### 在创建题目时使用

```javascript
const [imageUrl, setImageUrl] = useState(null);

// 先创建题目，再上传图片
const handleCreateQuestion = async () => {
  // 1. 创建题目
  const response = await questionAPI.create(setId, questionData);
  const questionId = response.data.data.id;

  // 2. 如果有图片，上传
  if (selectedImage) {
    await uploadAPI.uploadImage(questionId, selectedImage);
  }
};
```

---

## 6. 搜索题目

### 基本搜索

```javascript
const SearchQuestions = ({ quizSetId }) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    setLoading(true);
    try {
      const response = await questionAPI.search(quizSetId, { keyword });
      setResults(response.data.data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="输入关键词搜索..."
          style={{ flex: 1 }}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? '搜索中...' : '搜索'}
        </button>
      </div>

      {results.length > 0 && (
        <div>
          <p>找到 {results.length} 道题目</p>
          {/* 显示搜索结果 */}
        </div>
      )}
    </div>
  );
};
```

### 高级搜索（组合筛选）

```javascript
const AdvancedSearch = ({ quizSetId }) => {
  const [filters, setFilters] = useState({
    keyword: '',
    category: '',
    difficulty: '',
    tags: []
  });
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    try {
      const params = {};

      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.category) params.category = filters.category;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.tags.length > 0) params.tags = filters.tags;

      const response = await questionAPI.search(quizSetId, params);
      setResults(response.data.data);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  return (
    <div className="search-panel">
      {/* 关键词搜索 */}
      <input
        type="text"
        value={filters.keyword}
        onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
        placeholder="关键词..."
      />

      {/* 分类筛选 */}
      <select
        value={filters.category}
        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
      >
        <option value="">所有分类</option>
        <option value="语法">语法</option>
        <option value="算法">算法</option>
        <option value="框架">框架</option>
      </select>

      {/* 难度筛选 */}
      <select
        value={filters.difficulty}
        onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
      >
        <option value="">所有难度</option>
        <option value="easy">简单</option>
        <option value="medium">中等</option>
        <option value="hard">困难</option>
      </select>

      {/* 标签筛选（多选） */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={filters.tags.includes('JavaScript')}
            onChange={(e) => {
              const newTags = e.target.checked
                ? [...filters.tags, 'JavaScript']
                : filters.tags.filter(t => t !== 'JavaScript');
              setFilters({ ...filters, tags: newTags });
            }}
          />
          JavaScript
        </label>
        {/* 更多标签... */}
      </div>

      <button onClick={handleSearch}>搜索</button>

      {/* 显示结果 */}
      <div>
        {results.map(q => (
          <div key={q.id}>
            <h4>{q.questionText}</h4>
            <p>分类: {q.category} | 难度: {q.difficulty}</p>
            <p>标签: {q.tags.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 完整工作流示例

### 场景：准备JavaScript考试

```javascript
// 1. 批量导入题目
const importQuestions = async () => {
  // 准备Excel文件，包含100道JavaScript题目
  const file = document.querySelector('#excel-file').files[0];
  await importExportAPI.importExcel(quizSetId, file);
  console.log('题目导入成功');
};

// 2. 为题目添加标签和分类
// （在导入时可以在Excel中指定）

// 3. 开始练习
// 用户答题，错题自动记录到错题本

// 4. 查看错题本
navigate('/wrong-questions');

// 5. 针对性复习错题

// 6. 创建模拟考试
const createMockExam = async () => {
  await examAPI.create(quizSetId, {
    title: 'JavaScript模拟考试',
    durationMinutes: 90,
    questionCount: 30
  });
};

// 7. 参加考试
navigate(`/exam/${examId}`);

// 8. 查看成绩和详细解析
navigate(`/exam/${examId}/results`);

// 9. 导出题库备份
await importExportAPI.exportJSON(quizSetId);
```

---

## 最佳实践

### 1. 题目组织

```javascript
// 使用清晰的分类和标签
const wellOrganizedQuestion = {
  questionText: "React的useEffect有哪些特点？",
  category: "React Hooks",
  difficulty: "medium",
  tags: ["React", "Hooks", "生命周期", "副作用"],
  // ...
};
```

### 2. 图片优化

```javascript
// 上传前压缩图片
const compressImage = async (file) => {
  // 使用第三方库如 browser-image-compression
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920
  };
  return await imageCompression(file, options);
};
```

### 3. 错题复习策略

```javascript
// 按错误次数排序，优先复习
const sortByWrongCount = (questions) => {
  return questions.sort((a, b) => b.wrongCount - a.wrongCount);
};
```

### 4. 定期导出备份

```javascript
// 每周自动导出
const scheduleBackup = () => {
  setInterval(async () => {
    const date = new Date().toISOString().split('T')[0];
    const response = await importExportAPI.exportJSON(quizSetId);
    // 保存文件...
  }, 7 * 24 * 60 * 60 * 1000); // 7天
};
```

---

## 调试技巧

### 查看API请求

```javascript
// 在Chrome DevTools中查看Network选项卡
// 或者在代码中添加日志

axios.interceptors.request.use(request => {
  console.log('Request:', request);
  return request;
});

axios.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
});
```

### 错误处理

```javascript
const safeApiCall = async (apiFunction, ...args) => {
  try {
    const response = await apiFunction(...args);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// 使用
const result = await safeApiCall(questionAPI.create, quizSetId, questionData);
if (result.success) {
  console.log('Success:', result.data);
} else {
  alert('Error: ' + result.error);
}
```

---

希望这些示例能帮助你更好地使用新功能！🎉
