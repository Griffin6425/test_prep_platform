import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wrongQuestionAPI } from '../services/api';

function WrongQuestions() {
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMastered, setShowMastered] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [showMastered]);

  const loadData = async () => {
    try {
      const [questionsRes, statsRes] = await Promise.all([
        wrongQuestionAPI.getAll({ includeMastered: showMastered }),
        wrongQuestionAPI.getStats()
      ]);

      setWrongQuestions(questionsRes.data.data);
      setStats(statsRes.data.data);
    } catch (err) {
      setError('加载错题本失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsMastered = async (wrongQuestionId) => {
    try {
      await wrongQuestionAPI.markAsMastered(wrongQuestionId);
      loadData();
    } catch (err) {
      setError('标记失败');
    }
  };

  const handleRemove = async (wrongQuestionId) => {
    if (!window.confirm('确定要从错题本中移除吗？')) return;

    try {
      await wrongQuestionAPI.remove(wrongQuestionId);
      loadData();
    } catch (err) {
      setError('移除失败');
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="quiz-sets-header">
        <h1>我的错题本</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          返回首页
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="stats-container" style={{ marginBottom: '2rem' }}>
          <h3>错题统计</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.totalWrong}</div>
              <div className="stat-label">总错题数</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.unmasteredCount}</div>
              <div className="stat-label">未掌握</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.masteredCount}</div>
              <div className="stat-label">已掌握</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={showMastered}
            onChange={(e) => setShowMastered(e.target.checked)}
          />
          显示已掌握的题目
        </label>
      </div>

      {wrongQuestions.length === 0 ? (
        <div className="empty-state">
          <h3>{showMastered ? '没有错题记录' : '没有未掌握的错题'}</h3>
          <p>继续加油！</p>
        </div>
      ) : (
        <div className="question-list">
          {wrongQuestions.map((item) => (
            <div key={item.wrongQuestionId} className="question-item">
              <div className="question-text">
                {item.questionText}
                <span style={{ marginLeft: '1rem', fontSize: '0.85rem', color: '#999' }}>
                  ({item.quizSetTitle})
                </span>
                {item.isMastered && (
                  <span style={{ marginLeft: '0.5rem', color: '#27ae60' }}>✓ 已掌握</span>
                )}
              </div>

              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.75rem' }}>
                错误次数: {item.wrongCount} | 最后练习: {new Date(item.lastAttempted).toLocaleString()}
              </div>

              {item.imageUrl && (
                <img
                  src={`http://localhost:5000${item.imageUrl}`}
                  alt="题目配图"
                  style={{ maxWidth: '400px', marginBottom: '0.75rem' }}
                />
              )}

              <div className="question-options">
                {item.options.map((option, oIndex) => (
                  <div
                    key={option.id}
                    className={`question-option ${option.isCorrect ? 'correct' : ''}`}
                  >
                    {String.fromCharCode(65 + oIndex)}. {option.text}
                    {option.isCorrect && ' ✓'}
                  </div>
                ))}
              </div>

              {item.explanation && (
                <div style={{ marginLeft: '1rem', color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  <strong>解析：</strong> {item.explanation}
                </div>
              )}

              <div className="question-actions" style={{ marginTop: '1rem' }}>
                {!item.isMastered && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleMarkAsMastered(item.wrongQuestionId)}
                  >
                    标记为已掌握
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={() => handleRemove(item.wrongQuestionId)}
                >
                  从错题本移除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WrongQuestions;
