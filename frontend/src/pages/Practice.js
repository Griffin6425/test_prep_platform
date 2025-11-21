import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionAPI, quizSetAPI } from '../services/api';

function Practice() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [quizSet, setQuizSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [showQuestionJump, setShowQuestionJump] = useState(false);

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
      const questionsData = questionsRes.data.data;

      if (questionsData.length === 0) {
        setError('这个题库还没有题目');
      } else {
        setAllQuestions(questionsData);
      }
    } catch (err) {
      setError('加载题目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = (mode) => {
    if (mode === 'sequential') {
      setQuestions(allQuestions);
      setShowModeSelection(false);
    } else if (mode === 'random') {
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setShowModeSelection(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOptions([]);
      setSubmitted(false);
      setFeedback(null);
    } else {
      alert('已经是最后一题了');
    }
  };

  const handleJumpToQuestion = (index) => {
    setCurrentIndex(index);
    setSelectedOptions([]);
    setSubmitted(false);
    setFeedback(null);
    setShowQuestionJump(false);
  };

  const currentQuestion = questions[currentIndex];

  const handleOptionToggle = (optionId) => {
    if (submitted) return;

    if (currentQuestion.questionType === 'single_choice') {
      setSelectedOptions([optionId]);
    } else {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter((id) => id !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0) {
      alert('请选择至少一个选项');
      return;
    }

    try {
      const response = await questionAPI.submit(currentQuestion.id, {
        selectedOptions,
      });

      const result = response.data.data;
      setFeedback(result);
      setSubmitted(true);

      // 更新统计
      setStats({
        correct: stats.correct + (result.isCorrect ? 1 : 0),
        total: stats.total + 1,
      });
    } catch (err) {
      setError('提交答案失败');
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOptions([]);
      setSubmitted(false);
      setFeedback(null);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOptions([]);
    setSubmitted(false);
    setFeedback(null);
    setStats({ correct: 0, total: 0 });
    setShowResults(false);
    setShowModeSelection(true);
    setQuestions([]);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          返回题库列表
        </button>
      </div>
    );
  }

  if (showModeSelection) {
    return (
      <div className="container practice-container">
        <div className="stats-container">
          <h2>{quizSet?.title}</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            共 {allQuestions.length} 道题目，请选择练习模式
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleStartPractice('sequential')}
              style={{ padding: '1.5rem', fontSize: '1.1rem' }}
            >
              顺序模式
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleStartPractice('random')}
              style={{ padding: '1.5rem', fontSize: '1.1rem' }}
            >
              随机模式
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
              style={{ padding: '1rem', marginTop: '1rem' }}
            >
              返回题库
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const accuracy = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0;

    return (
      <div className="container practice-container">
        <div className="stats-container">
          <h2>刷题完成！</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">总题数</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.correct}</div>
              <div className="stat-label">答对题数</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{accuracy}%</div>
              <div className="stat-label">正确率</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={handleRestart} style={{ flex: 1 }}>
              再来一次
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
              style={{ flex: 1 }}
            >
              返回题库
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container practice-container">
      <div className="practice-card">
        <div className="practice-header">
          <h2>{quizSet?.title}</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="practice-progress">
              题目 {currentIndex + 1} / {questions.length}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setShowQuestionJump(!showQuestionJump)}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              跳题
            </button>
          </div>
        </div>

        {showQuestionJump && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '4px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              选择题目：
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
              gap: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {questions.map((_, index) => (
                <button
                  key={index}
                  className={`btn ${index === currentIndex ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleJumpToQuestion(index)}
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    minWidth: '50px'
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="practice-question">
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            ({currentQuestion.questionType === 'single_choice' ? '单选题' : '多选题'})
          </p>
          <div
            className="question-content"
            style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}
            dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }}
          />

          <div className="practice-options">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOptions.includes(option.id);
              const isCorrect = feedback?.correctOptions.includes(option.id);
              const shouldShowCorrect = submitted && isCorrect;
              const shouldShowIncorrect = submitted && isSelected && !isCorrect;

              let className = 'practice-option';
              if (shouldShowCorrect) className += ' correct';
              if (shouldShowIncorrect) className += ' incorrect';
              if (isSelected && !submitted) className += ' selected';
              if (submitted) className += ' disabled';

              return (
                <div
                  key={option.id}
                  className={className}
                  onClick={() => handleOptionToggle(option.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}
                >
                  <strong style={{ flexShrink: 0 }}>{String.fromCharCode(65 + index)}.</strong>
                  <div
                    className="question-content"
                    style={{ flex: 1, margin: 0 }}
                    dangerouslySetInnerHTML={{ __html: option.text }}
                  />
                  {shouldShowCorrect && <span style={{ flexShrink: 0 }}>✓</span>}
                  {shouldShowIncorrect && <span style={{ flexShrink: 0 }}>✗</span>}
                </div>
              );
            })}
          </div>

          {submitted && feedback && (
            <div className={`practice-feedback ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
              {feedback.isCorrect ? '✓ 回答正确！' : '✗ 回答错误'}
              {currentQuestion.explanation && (
                <div style={{ marginTop: '0.5rem', fontWeight: 'normal' }}>
                  <strong>解析：</strong>
                  <div
                    className="question-content"
                    style={{ display: 'inline' }}
                    dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="practice-actions">
            {!submitted ? (
              <>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  提交答案
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleSkip}
                  disabled={currentIndex >= questions.length - 1}
                >
                  跳过此题
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={handleNext}>
                {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              退出练习
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center', color: '#666' }}>
        当前正确率: {stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0}%
        ({stats.correct}/{stats.total})
      </div>
    </div>
  );
}

export default Practice;
