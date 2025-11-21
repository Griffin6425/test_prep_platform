import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examAPI } from '../services/api';

function ExamResults() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResults();
  }, [examId]);

  const loadResults = async () => {
    try {
      const response = await examAPI.getResults(examId);
      setResults(response.data.data);
    } catch (err) {
      setError('加载考试结果失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/exams')}>
          返回考试列表
        </button>
      </div>
    );
  }

  const { exam, answers } = results;
  const correctCount = answers.filter(a => a.isCorrect).length;

  return (
    <div className="container">
      <div className="stats-container" style={{ marginBottom: '2rem' }}>
        <h2>考试完成！</h2>
        <h3>{exam.title}</h3>
        <p style={{ color: '#666' }}>{exam.quizSetTitle}</p>

        <div className="stats-grid" style={{ marginTop: '2rem' }}>
          <div className="stat-item">
            <div className="stat-value">{exam.totalQuestions}</div>
            <div className="stat-label">总题数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{correctCount}</div>
            <div className="stat-label">答对题数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{exam.score}%</div>
            <div className="stat-label">得分</div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/exams')}>
            返回考试列表
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            返回首页
          </button>
        </div>
      </div>

      <div className="question-list">
        <h3>答题详情</h3>
        {answers.map((answer, index) => (
          <div key={index} className="question-item">
            <div className="question-text">
              {index + 1}. {answer.questionText}
              {answer.isCorrect ? (
                <span style={{ marginLeft: '1rem', color: '#27ae60' }}>✓ 正确</span>
              ) : (
                <span style={{ marginLeft: '1rem', color: '#e74c3c' }}>✗ 错误</span>
              )}
            </div>

            <div className="question-options">
              {answer.options.map((option, oIndex) => {
                const isSelected = answer.selectedOptions.includes(option.id);
                const isCorrect = option.isCorrect;

                return (
                  <div
                    key={option.id}
                    className={`question-option ${isCorrect ? 'correct' : ''} ${isSelected && !isCorrect ? 'incorrect' : ''}`}
                    style={{
                      background: isCorrect ? '#d5f4e6' : isSelected ? '#fadbd8' : 'transparent'
                    }}
                  >
                    {String.fromCharCode(65 + oIndex)}. {option.text}
                    {isCorrect && ' ✓'}
                    {isSelected && !isCorrect && ' ✗'}
                  </div>
                );
              })}
            </div>

            {answer.explanation && (
              <div style={{ marginLeft: '1rem', color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                <strong>解析：</strong> {answer.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExamResults;
