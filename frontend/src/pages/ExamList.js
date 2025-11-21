import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI, quizSetAPI } from '../services/api';

function ExamList() {
  const [exams, setExams] = useState([]);
  const [quizSets, setQuizSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExam, setNewExam] = useState({
    quizSetId: '',
    title: '',
    durationMinutes: 60,
    questionCount: 0
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [examsRes, quizSetsRes] = await Promise.all([
        examAPI.getAll(),
        quizSetAPI.getAll()
      ]);

      setExams(examsRes.data.data);
      setQuizSets(quizSetsRes.data.data);
    } catch (err) {
      setError('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await examAPI.create(newExam.quizSetId, {
        title: newExam.title,
        durationMinutes: parseInt(newExam.durationMinutes),
        questionCount: newExam.questionCount > 0 ? parseInt(newExam.questionCount) : null
      });

      setShowCreateModal(false);
      setNewExam({
        quizSetId: '',
        title: '',
        durationMinutes: 60,
        questionCount: 0
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || '创建考试失败');
    }
  };

  const handleStartExam = (examId) => {
    navigate(`/exam/${examId}`);
  };

  const handleViewResults = (examId) => {
    navigate(`/exam/${examId}/results`);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="quiz-sets-header">
        <h1>我的考试</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            创建新考试
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            返回首页
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {exams.length === 0 ? (
        <div className="empty-state">
          <h3>还没有考试记录</h3>
          <p>点击"创建新考试"开始</p>
        </div>
      ) : (
        <div className="quiz-set-grid">
          {exams.map((exam) => (
            <div key={exam.id} className="quiz-set-card">
              <h3>{exam.title}</h3>
              <p>{exam.quizSetTitle}</p>
              <div className="quiz-set-meta">
                <div>
                  <div>时长: {exam.durationMinutes}分钟</div>
                  <div>题数: {exam.totalQuestions}</div>
                </div>
                <div>
                  {exam.status === 'not_started' && <span style={{ color: '#3498db' }}>未开始</span>}
                  {exam.status === 'in_progress' && <span style={{ color: '#f39c12' }}>进行中</span>}
                  {exam.status === 'completed' && <span style={{ color: '#27ae60' }}>已完成</span>}
                </div>
              </div>

              {exam.score !== null && (
                <div style={{ marginTop: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold', color: '#3498db' }}>
                  得分: {exam.score}%
                </div>
              )}

              <div className="quiz-set-actions" style={{ marginTop: '1rem' }}>
                {exam.status === 'not_started' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleStartExam(exam.id)}
                  >
                    开始考试
                  </button>
                )}
                {exam.status === 'completed' && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleViewResults(exam.id)}
                  >
                    查看结果
                  </button>
                )}
              </div>

              <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>
                创建时间: {new Date(exam.createdAt).toLocaleString()}
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
            <h2>创建新考试</h2>
            <form onSubmit={handleCreateExam}>
              <div className="form-group">
                <label>选择题库</label>
                <select
                  value={newExam.quizSetId}
                  onChange={(e) => setNewExam({ ...newExam, quizSetId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  <option value="">请选择题库</option>
                  {quizSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.title} ({set.questionCount}题)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>考试标题</label>
                <input
                  type="text"
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  placeholder="例如：第一次模拟考试"
                  required
                />
              </div>

              <div className="form-group">
                <label>考试时长（分钟）</label>
                <input
                  type="number"
                  value={newExam.durationMinutes}
                  onChange={(e) => setNewExam({ ...newExam, durationMinutes: e.target.value })}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>题目数量（0表示全部题目）</label>
                <input
                  type="number"
                  value={newExam.questionCount}
                  onChange={(e) => setNewExam({ ...newExam, questionCount: e.target.value })}
                  min="0"
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

export default ExamList;
