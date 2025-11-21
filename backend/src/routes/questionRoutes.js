const express = require('express');
const router = express.Router();
const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  submitAnswer,
  getQuizStats
} = require('../controllers/questionController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/quiz-sets/:setId/questions', getQuestions);
router.post('/quiz-sets/:setId/questions', createQuestion);
router.put('/questions/:questionId', updateQuestion);
router.delete('/questions/:questionId', deleteQuestion);
router.post('/questions/:questionId/submit', submitAnswer);
router.get('/quiz-sets/:setId/stats', getQuizStats);

module.exports = router;
