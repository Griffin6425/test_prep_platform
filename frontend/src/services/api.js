import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Quiz Set APIs
export const quizSetAPI = {
  getAll: () => api.get('/quiz-sets'),
  getOne: (id) => api.get(`/quiz-sets/${id}`),
  create: (data) => api.post('/quiz-sets', data),
  update: (id, data) => api.put(`/quiz-sets/${id}`, data),
  delete: (id) => api.delete(`/quiz-sets/${id}`),
};

// Question APIs
export const questionAPI = {
  getAll: (quizSetId) => api.get(`/quiz-sets/${quizSetId}/questions`),
  create: (quizSetId, data) => api.post(`/quiz-sets/${quizSetId}/questions`, data),
  update: (questionId, data) => api.put(`/questions/${questionId}`, data),
  delete: (questionId) => api.delete(`/questions/${questionId}`),
  submit: (questionId, data) => api.post(`/questions/${questionId}/submit`, data),
  getStats: (quizSetId) => api.get(`/quiz-sets/${quizSetId}/stats`),
  search: (quizSetId, params) => api.get(`/quiz-sets/${quizSetId}/search`, { params }),
};

// Import/Export APIs
export const importExportAPI = {
  exportJSON: (quizSetId) => api.get(`/quiz-sets/${quizSetId}/export/json`, { responseType: 'blob' }),
  exportExcel: (quizSetId) => api.get(`/quiz-sets/${quizSetId}/export/excel`, { responseType: 'blob' }),
  importJSON: (quizSetId, data) => api.post(`/quiz-sets/${quizSetId}/import/json`, data),
  importExcel: (quizSetId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/quiz-sets/${quizSetId}/import/excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Tag APIs
export const tagAPI = {
  getAll: () => api.get('/tags'),
  addToQuestion: (questionId, tags) => api.post(`/questions/${questionId}/tags`, { tags }),
};

// Wrong Question APIs
export const wrongQuestionAPI = {
  getAll: (params) => api.get('/wrong-questions', { params }),
  getByQuizSet: (quizSetId, params) => api.get(`/wrong-questions/quiz-set/${quizSetId}`, { params }),
  getStats: () => api.get('/wrong-questions/stats'),
  add: (questionId) => api.post(`/wrong-questions/${questionId}`),
  markAsMastered: (wrongQuestionId) => api.put(`/wrong-questions/${wrongQuestionId}/master`),
  remove: (wrongQuestionId) => api.delete(`/wrong-questions/${wrongQuestionId}`),
};

// Exam APIs
export const examAPI = {
  getAll: () => api.get('/exams'),
  create: (quizSetId, data) => api.post(`/quiz-sets/${quizSetId}/exams`, data),
  start: (examId) => api.post(`/exams/${examId}/start`),
  submit: (examId, answers) => api.post(`/exams/${examId}/submit`, { answers }),
  getResults: (examId) => api.get(`/exams/${examId}/results`),
};

// Upload APIs
export const uploadAPI = {
  uploadImage: (questionId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/questions/${questionId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (questionId) => api.delete(`/questions/${questionId}/image`),
};

export default api;
