const express = require('express');
const router = express.Router();
const {
  getQuizSets,
  getQuizSet,
  createQuizSet,
  updateQuizSet,
  deleteQuizSet
} = require('../controllers/quizSetController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', getQuizSets);
router.get('/:setId', getQuizSet);
router.post('/', createQuizSet);
router.put('/:setId', updateQuizSet);
router.delete('/:setId', deleteQuizSet);

module.exports = router;
