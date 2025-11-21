const express = require('express');
const router = express.Router();
const {
  createExam,
  startExam,
  submitExam,
  getExamResults,
  getUserExams
} = require('../controllers/examController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/exams', getUserExams);
router.post('/quiz-sets/:setId/exams', createExam);
router.post('/exams/:examId/start', startExam);
router.post('/exams/:examId/submit', submitExam);
router.get('/exams/:examId/results', getExamResults);

module.exports = router;
