const express = require('express');
const router = express.Router();
const {
  getAllTags,
  addTagsToQuestion,
  searchQuestions
} = require('../controllers/tagController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/tags', getAllTags);
router.post('/questions/:questionId/tags', addTagsToQuestion);
router.get('/quiz-sets/:setId/search', searchQuestions);

module.exports = router;
