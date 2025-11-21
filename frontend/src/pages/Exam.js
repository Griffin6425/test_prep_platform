import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examAPI, quizSetAPI } from '../services/api';

function Exam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    startExam();
  }, [examId]);

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam) {
      handleSubmitExam();
    }
  }, [timeLeft, isSubmitted]);

  const startExam = async () => {
    try {
      const response = await examAPI.start(examId);
      const data = response.data.data;

      setExam(data);
      setQuestions(data.questions);
      setTimeLeft(data.durationMinutes * 60);
      setLoading(false);
    } catch (err) {
      setError('启动考试失败');
      setLoading(false);
    }
  };

  const handleSelectOption = (optionId) => {
    const question = questions[currentIndex];
    const currentAnswers = answers[question.id] || [];

    if (question.questionType === 'single_choice') {
      setAnswers({ ...answers, [question.id]: [optionId] });
    } else {
      if (currentAnswers.includes(optionId)) {
        setAnswers({
          ...answers,
          [question.id]: currentAnswers.filter(id => id !== optionId)
        });
      } else {
        setAnswers({
          ...answers,
          [question.id]: [...currentAnswers, optionId]
        });
      }
    }
  };

  const handleSubmitExam = async () => {
    if (isSubmitted) return;

    if (!window.confirm('确定要提交考试吗？')) return;

    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        selectedOptions: answers[q.id] || []
      }));

      const response = await examAPI.submit(examId, formattedAnswers);
      setIsSubmitted(true);
      navigate(`/exam/${examId}/results`);
    } catch (err) {
      setError('提交考试失败');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const currentQuestion = questions[currentIndex];
  const currentAnswers = answers[currentQuestion?.id] || [];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="container practice-container">
      <div className="practice-card">
        <div className="practice-header">
          <div>
            <h2>{exam?.title}</h2>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              题目 {currentIndex + 1} / {questions.length} | 已答 {answeredCount} 题
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft < 300 ? '#e74c3c' : '#3498db' }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#999' }}>剩余时间</div>
          </div>
        </div>

        <div className="practice-question">
          <h3>{currentQuestion.questionText}</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            ({currentQuestion.questionType === 'single_choice' ? '单选题' : '多选题'})
          </p>

          {currentQuestion.imageUrl && (
            <img
              src={`http://localhost:5000${currentQuestion.imageUrl}`}
              alt="题目配图"
              style={{ maxWidth: '500px', marginBottom: '1rem' }}
            />
          )}

          <div className="practice-options">
            {currentQuestion.options.map((option, index) => (
              <div
                key={option.id}
                className={`practice-option ${currentAnswers.includes(option.id) ? 'selected' : ''}`}
                onClick={() => handleSelectOption(option.id)}
              >
                <strong>{String.fromCharCode(65 + index)}.</strong> {option.text}
              </div>
            ))}
          </div>

          <div className="practice-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              上一题
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
              disabled={currentIndex === questions.length - 1}
            >
              下一题
            </button>
            <button className="btn btn-primary" onClick={handleSubmitExam}>
              提交考试
            </button>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px' }}>
          <h4 style={{ marginBottom: '1rem' }}>答题卡</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(index)}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '2px solid',
                  borderColor: answers[q.id]?.length > 0 ? '#27ae60' : '#ddd',
                  background: currentIndex === index ? '#3498db' : answers[q.id]?.length > 0 ? '#d5f4e6' : 'white',
                  color: currentIndex === index ? 'white' : '#333',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Exam;
