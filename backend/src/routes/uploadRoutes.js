const express = require('express');
const router = express.Router();
const {
  uploadQuestionImage,
  deleteQuestionImage
} = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/auth');
const { uploadImage } = require('../config/upload');

router.use(authMiddleware);

router.post('/questions/:questionId/image', uploadImage.single('image'), uploadQuestionImage);
router.delete('/questions/:questionId/image', deleteQuestionImage);

module.exports = router;
