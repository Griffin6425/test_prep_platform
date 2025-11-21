const express = require('express');
const router = express.Router();
const {
  getWrongQuestions,
  addToWrongQuestions,
  markAsMastered,
  removeFromWrongQuestions,
  getWrongQuestionsStats
} = require('../controllers/wrongQuestionController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/wrong-questions', getWrongQuestions);
router.get('/wrong-questions/quiz-set/:setId', getWrongQuestions);
router.get('/wrong-questions/stats', getWrongQuestionsStats);
router.post('/wrong-questions/:questionId', addToWrongQuestions);
router.put('/wrong-questions/:wrongQuestionId/master', markAsMastered);
router.delete('/wrong-questions/:wrongQuestionId', removeFromWrongQuestions);

module.exports = router;
