import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionAPI, quizSetAPI, importExportAPI, uploadAPI } from '../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function ManageQuestions() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [quizSet, setQuizSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  // 新题目表单状态
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('single_choice');
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  // 编辑状态
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editQuestionType, setEditQuestionType] = useState('single_choice');
  const [editExplanation, setEditExplanation] = useState('');
  const [editOptions, setEditOptions] = useState([]);

  useEffect(() => {
    loadData();
  }, [setId]);

  const loadData = async () => {
    try {
      const [quizSetRes, questionsRes] = await Promise.all([
        quizSetAPI.getOne(setId),
        questionAPI.getAll(setId),
      ]);
      setQuizSet(quizSetRes.data.data);
      setQuestions(questionsRes.data.data);
    } catch (err) {
      setError('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      alert('至少需要两个选项');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;

    // 如果是单选题，只允许选择一个正确答案
    if (field === 'isCorrect' && value && questionType === 'single_choice') {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    setOptions(newOptions);
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    setError('');

    // 验证
    if (!questionText.trim()) {
      setError('请输入题目内容');
      return;
    }

    const validOptions = options.filter((opt) => opt.text.trim());
    if (validOptions.length < 2) {
      setError('至少需要两个有效选项');
      return;
    }

    const hasCorrect = validOptions.some((opt) => opt.isCorrect);
    if (!hasCorrect) {
      setError('请至少标记一个正确答案');
      return;
    }

    try {
      await questionAPI.create(setId, {
        questionText,
        questionType,
        explanation,
        options: validOptions,
      });

      // 重置表单
      setQuestionText('');
      setExplanation('');
      setOptions([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);

      // 重新加载题目列表
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || '创建题目失败');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('确定要删除这道题目吗？')) return;

    try {
      await questionAPI.delete(questionId);
      loadData();
    } catch (err) {
      setError('删除题目失败');
    }
  };

  const handleStartEdit = (question) => {
    setEditingQuestionId(question.id);
    setEditQuestionText(question.questionText);
    setEditQuestionType(question.questionType);
    setEditExplanation(question.explanation || '');
    setEditOptions(question.options.map(opt => ({ ...opt })));
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditQuestionText('');
    setEditQuestionType('single_choice');
    setEditExplanation('');
    setEditOptions([]);
  };

  const handleEditOptionChange = (index, field, value) => {
    const newOptions = [...editOptions];
    newOptions[index][field] = value;

    if (field === 'isCorrect' && value && editQuestionType === 'single_choice') {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    setEditOptions(newOptions);
  };

  const handleAddEditOption = () => {
    setEditOptions([...editOptions, { text: '', isCorrect: false }]);
  };

  const handleRemoveEditOption = (index) => {
    if (editOptions.length <= 2) {
      alert('至少需要两个选项');
      return;
    }
    setEditOptions(editOptions.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async (questionId) => {
    setError('');

    if (!editQuestionText.trim()) {
      setError('请输入题目内容');
      return;
    }

    const validOptions = editOptions.filter((opt) => opt.text.trim());
    if (validOptions.length < 2) {
      setError('至少需要两个有效选项');
      return;
    }

    const hasCorrect = validOptions.some((opt) => opt.isCorrect);
    if (!hasCorrect) {
      setError('请至少标记一个正确答案');
      return;
    }

    try {
      await questionAPI.update(questionId, {
        questionText: editQuestionText,
        questionType: editQuestionType,
        explanation: editExplanation,
        options: validOptions,
      });

      handleCancelEdit();
      loadData();
      setSuccessMessage('题目更新成功！');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || '更新题目失败');
    }
  };

  // 导出为JSON
  const handleExportJSON = async () => {
    try {
      setError('');
      setSuccessMessage('');
      const response = await importExportAPI.exportJSON(setId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quizSet?.title || 'questions'}_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccessMessage('JSON导出成功！');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('导出JSON失败');
    }
  };

  // 导出为Excel
  const handleExportExcel = async () => {
    try {
      setError('');
      setSuccessMessage('');
      const response = await importExportAPI.exportExcel(setId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quizSet?.title || 'questions'}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccessMessage('Excel导出成功！');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('导出Excel失败');
    }
  };

  // 导入JSON
  const handleImportJSON = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await importExportAPI.importJSON(setId, data);
          setSuccessMessage('JSON导入成功！');
          setTimeout(() => setSuccessMessage(''), 3000);
          loadData();
        } catch (err) {
          setError(err.response?.data?.message || '导入JSON失败，请检查文件格式');
        } finally {
          setImportLoading(false);
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError('读取文件失败');
      setImportLoading(false);
      event.target.value = '';
    }
  };

  // 导入Excel
  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await importExportAPI.importExcel(setId, file);
      setSuccessMessage('Excel导入成功！');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || '导入Excel失败，请检查文件格式');
    } finally {
      setImportLoading(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="container">
      <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
        ← 返回题库列表
      </button>

      <h1 style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        {quizSet?.title} - 题目管理
      </h1>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* 导入/导出功能区 */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>题目导入/导出</h3>
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* 导出按钮 */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleExportJSON}
              disabled={importLoading || questions.length === 0}
            >
              📥 导出 JSON
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExportExcel}
              disabled={importLoading || questions.length === 0}
            >
              📥 导出 Excel
            </button>
          </div>

          {/* 分隔线 */}
          <div style={{
            height: '30px',
            width: '1px',
            backgroundColor: '#ccc'
          }}></div>

          {/* 导入按钮 */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label
              htmlFor="import-json"
              className="btn btn-success"
              style={{
                margin: 0,
                cursor: importLoading ? 'not-allowed' : 'pointer',
                opacity: importLoading ? 0.6 : 1
              }}
            >
              📤 导入 JSON
            </label>
            <input
              id="import-json"
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              disabled={importLoading}
              style={{ display: 'none' }}
            />

            <label
              htmlFor="import-excel"
              className="btn btn-success"
              style={{
                margin: 0,
                cursor: importLoading ? 'not-allowed' : 'pointer',
                opacity: importLoading ? 0.6 : 1
              }}
            >
              📤 导入 Excel
            </label>
            <input
              id="import-excel"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              disabled={importLoading}
              style={{ display: 'none' }}
            />

            {importLoading && (
              <span style={{ color: '#666', fontSize: '0.9rem' }}>
                处理中...
              </span>
            )}
          </div>
        </div>
        <div style={{
          marginTop: '1rem',
          fontSize: '0.85rem',
          color: '#666'
        }}>
          💡 提示：导出功能会将当前题库的所有题目保存为文件；导入功能会将文件中的题目添加到当前题库中。
        </div>
      </div>

      {/* 创建新题目表单 */}
      <div className="question-form">
        <h2>添加新题目</h2>
        <form onSubmit={handleSubmitQuestion}>
          <div className="form-group">
            <label>题目内容（支持粘贴图片）</label>
            <ReactQuill
              value={questionText}
              onChange={setQuestionText}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  [{ 'color': [] }, { 'background': [] }],
                  ['link', 'image'],
                  ['clean']
                ],
                clipboard: {
                  matchVisual: false
                }
              }}
              formats={[
                'header',
                'bold', 'italic', 'underline', 'strike',
                'list', 'bullet',
                'color', 'background',
                'link', 'image'
              ]}
              placeholder="请输入题目内容，可以直接粘贴图片..."
              style={{ backgroundColor: 'white' }}
            />
          </div>

          <div className="form-group">
            <label>题目类型</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              <option value="single_choice">单选题</option>
              <option value="multi_choice">多选题</option>
            </select>
          </div>

          <div className="form-group">
            <label>选项列表（支持粘贴图片）</label>
            <div className="options-list">
              {options.map((option, index) => (
                <div key={index} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) =>
                        handleOptionChange(index, 'isCorrect', e.target.checked)
                      }
                      title="标记为正确答案"
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                    <label style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                      选项 {String.fromCharCode(65 + index)} {option.isCorrect && '✓ 正确答案'}
                    </label>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleRemoveOption(index)}
                      style={{ marginLeft: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      删除
                    </button>
                  </div>
                  <ReactQuill
                    value={option.text}
                    onChange={(value) => handleOptionChange(index, 'text', value)}
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{ 'color': [] }, { 'background': [] }],
                        ['image'],
                        ['clean']
                      ],
                      clipboard: {
                        matchVisual: false
                      }
                    }}
                    formats={[
                      'bold', 'italic', 'underline',
                      'color', 'background',
                      'image'
                    ]}
                    placeholder={`请输入选项 ${String.fromCharCode(65 + index)} 的内容，可以粘贴图片...`}
                    style={{ backgroundColor: 'white' }}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddOption}
              style={{ marginTop: '0.5rem' }}
            >
              + 添加选项
            </button>
          </div>

          <div className="form-group">
            <label>答案解析（可选，支持粘贴图片）</label>
            <ReactQuill
              value={explanation}
              onChange={setExplanation}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  [{ 'color': [] }, { 'background': [] }],
                  ['link', 'image'],
                  ['clean']
                ],
                clipboard: {
                  matchVisual: false
                }
              }}
              formats={[
                'header',
                'bold', 'italic', 'underline', 'strike',
                'list', 'bullet',
                'color', 'background',
                'link', 'image'
              ]}
              placeholder="请输入答案解析，可以直接粘贴图片..."
              style={{ backgroundColor: 'white' }}
            />
          </div>

          <button type="submit" className="btn btn-success">
            保存题目
          </button>
        </form>
      </div>

      {/* 已有题目列表 */}
      <div className="question-list">
        <h2>已有题目 ({questions.length})</h2>
        {questions.length === 0 ? (
          <div className="empty-state">
            <p>还没有题目，请使用上面的表单添加</p>
          </div>
        ) : (
          questions.map((question, qIndex) => {
            const isEditing = editingQuestionId === question.id;

            return (
              <div key={question.id} className="question-item">
                {isEditing ? (
                  // 编辑模式
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>{qIndex + 1}.</span>
                      <span style={{ fontSize: '0.85rem', color: '#999' }}>编辑模式</span>
                    </div>

                    <div className="form-group">
                      <label>题目内容</label>
                      <ReactQuill
                        value={editQuestionText}
                        onChange={setEditQuestionText}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'color': [] }, { 'background': [] }],
                            ['link', 'image'],
                            ['clean']
                          ],
                          clipboard: { matchVisual: false }
                        }}
                        placeholder="请输入题目内容..."
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>题目类型</label>
                      <select
                        value={editQuestionType}
                        onChange={(e) => setEditQuestionType(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem' }}
                      >
                        <option value="single_choice">单选题</option>
                        <option value="multi_choice">多选题</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>选项列表</label>
                      <div className="options-list">
                        {editOptions.map((option, index) => (
                          <div key={index} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={option.isCorrect}
                                onChange={(e) => handleEditOptionChange(index, 'isCorrect', e.target.checked)}
                                style={{ width: 'auto', cursor: 'pointer' }}
                              />
                              <label style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                                选项 {String.fromCharCode(65 + index)} {option.isCorrect && '✓ 正确答案'}
                              </label>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => handleRemoveEditOption(index)}
                                style={{ marginLeft: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                              >
                                删除
                              </button>
                            </div>
                            <ReactQuill
                              value={option.text}
                              onChange={(value) => handleEditOptionChange(index, 'text', value)}
                              modules={{
                                toolbar: [
                                  ['bold', 'italic', 'underline'],
                                  [{ 'color': [] }, { 'background': [] }],
                                  ['image'],
                                  ['clean']
                                ],
                                clipboard: { matchVisual: false }
                              }}
                              placeholder={`请输入选项 ${String.fromCharCode(65 + index)} 的内容...`}
                              style={{ backgroundColor: 'white' }}
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleAddEditOption}
                        style={{ marginTop: '0.5rem' }}
                      >
                        + 添加选项
                      </button>
                    </div>

                    <div className="form-group">
                      <label>答案解析（可选）</label>
                      <ReactQuill
                        value={editExplanation}
                        onChange={setEditExplanation}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'color': [] }, { 'background': [] }],
                            ['link', 'image'],
                            ['clean']
                          ],
                          clipboard: { matchVisual: false }
                        }}
                        placeholder="请输入答案解析..."
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>

                    <div className="question-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => handleSaveEdit(question.id)}
                      >
                        保存
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={handleCancelEdit}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  // 查看模式
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>{qIndex + 1}.</span>
                      <span style={{ fontSize: '0.85rem', color: '#999' }}>
                        ({question.questionType === 'single_choice' ? '单选' : '多选'})
                      </span>
                    </div>
                    <div
                      className="question-content"
                      dangerouslySetInnerHTML={{ __html: question.questionText }}
                    />
                    <div className="question-options">
                      {question.options.map((option, oIndex) => (
                        <div
                          key={option.id}
                          className={`question-option ${option.isCorrect ? 'correct' : ''}`}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}
                        >
                          <span style={{ flexShrink: 0, fontWeight: 600 }}>
                            {String.fromCharCode(65 + oIndex)}.
                          </span>
                          <div
                            className="question-content"
                            style={{ flex: 1, margin: 0 }}
                            dangerouslySetInnerHTML={{ __html: option.text }}
                          />
                          {option.isCorrect && <span style={{ flexShrink: 0, color: '#0e8345', fontWeight: 600 }}>✓</span>}
                        </div>
                      ))}
                    </div>
                    {question.explanation && (
                      <div style={{ marginLeft: '1rem', marginTop: '0.75rem' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>解析：</strong>
                        <div
                          className="question-content"
                          style={{ fontSize: '0.9rem', color: '#666' }}
                          dangerouslySetInnerHTML={{ __html: question.explanation }}
                        />
                      </div>
                    )}
                    <div className="question-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleStartEdit(question)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ManageQuestions;
