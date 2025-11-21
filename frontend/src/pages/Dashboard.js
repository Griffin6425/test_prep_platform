import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizSetAPI } from '../services/api';

function Dashboard() {
  const [quizSets, setQuizSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuizSet, setNewQuizSet] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadQuizSets();
  }, []);

  const loadQuizSets = async () => {
    try {
      const response = await quizSetAPI.getAll();
      setQuizSets(response.data.data);
    } catch (err) {
      setError('加载题库失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuizSet = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await quizSetAPI.create(newQuizSet);
      setShowCreateModal(false);
      setNewQuizSet({ title: '', description: '' });
      loadQuizSets();
    } catch (err) {
      setError(err.response?.data?.message || '创建题库失败');
    }
  };

  const handleDeleteQuizSet = async (id) => {
    if (!window.confirm('确定要删除这个题库吗？')) return;

    try {
      await quizSetAPI.delete(id);
      loadQuizSets();
    } catch (err) {
      setError('删除题库失败');
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="quiz-sets-header">
        <h1>我的题库</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/wrong-questions')}>
            错题本
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/exams')}>
            考试
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            创建新题库
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {quizSets.length === 0 ? (
        <div className="empty-state">
          <h3>还没有题库</h3>
          <p>点击"创建新题库"开始添加你的第一个题库</p>
        </div>
      ) : (
        <div className="quiz-set-grid">
          {quizSets.map((quizSet) => (
            <div key={quizSet.id} className="quiz-set-card">
              <h3>{quizSet.title}</h3>
              <p>{quizSet.description || '暂无描述'}</p>
              <div className="quiz-set-meta">
                <span>{quizSet.questionCount} 道题</span>
              </div>
              <div className="quiz-set-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/quiz-set/${quizSet.id}/practice`)}
                >
                  开始刷题
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/quiz-set/${quizSet.id}/manage`)}
                >
                  管理题目
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteQuizSet(quizSet.id)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>创建新题库</h2>
            <form onSubmit={handleCreateQuizSet}>
              <div className="form-group">
                <label>题库标题</label>
                <input
                  type="text"
                  value={newQuizSet.title}
                  onChange={(e) =>
                    setNewQuizSet({ ...newQuizSet, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>题库描述</label>
                <textarea
                  value={newQuizSet.description}
                  onChange={(e) =>
                    setNewQuizSet({ ...newQuizSet, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  创建
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
