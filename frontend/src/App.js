import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ManageQuestions from './pages/ManageQuestions';
import Practice from './pages/Practice';
import WrongQuestions from './pages/WrongQuestions';
import ExamList from './pages/ExamList';
import Exam from './pages/Exam';
import ExamResults from './pages/ExamResults';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz-set/:setId/manage"
              element={
                <PrivateRoute>
                  <ManageQuestions />
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz-set/:setId/practice"
              element={
                <PrivateRoute>
                  <Practice />
                </PrivateRoute>
              }
            />
            <Route
              path="/wrong-questions"
              element={
                <PrivateRoute>
                  <WrongQuestions />
                </PrivateRoute>
              }
            />
            <Route
              path="/exams"
              element={
                <PrivateRoute>
                  <ExamList />
                </PrivateRoute>
              }
            />
            <Route
              path="/exam/:examId"
              element={
                <PrivateRoute>
                  <Exam />
                </PrivateRoute>
              }
            />
            <Route
              path="/exam/:examId/results"
              element={
                <PrivateRoute>
                  <ExamResults />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
