const pool = require('../config/database');
const path = require('path');

// Upload image for question
const uploadQuestionImage = async (req, res) => {
  try {
    const { questionId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const client = await pool.connect();

    try {
      // Check if question exists and user has permission
      const questionCheck = await client.query(
        `SELECT q.question_id, qs.owner_id
         FROM questions q
         JOIN quiz_sets qs ON q.quiz_set_id = qs.quiz_set_id
         WHERE q.question_id = $1`,
        [questionId]
      );

      if (questionCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      if (questionCheck.rows[0].owner_id !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to upload image for this question'
        });
      }

      // Save image URL to question
      const imageUrl = `/uploads/images/${req.file.filename}`;

      await client.query(
        'UPDATE questions SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE question_id = $2',
        [imageUrl, questionId]
      );

      res.json({
        success: true,
        data: {
          imageUrl,
          filename: req.file.filename,
          size: req.file.size
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Upload question image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload'
    });
  }
};

// Delete question image
const deleteQuestionImage = async (req, res) => {
  const client = await pool.connect();

  try {
    const { questionId } = req.params;

    // Check if question exists and user has permission
    const questionCheck = await client.query(
      `SELECT q.question_id, q.image_url, qs.owner_id
       FROM questions q
       JOIN quiz_sets qs ON q.quiz_set_id = qs.quiz_set_id
       WHERE q.question_id = $1`,
      [questionId]
    );

    if (questionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (questionCheck.rows[0].owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete image for this question'
      });
    }

    // Delete image file
    const imageUrl = questionCheck.rows[0].image_url;
    if (imageUrl) {
      const fs = require('fs');
      const imagePath = path.join(__dirname, '../../', imageUrl);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Remove image URL from question
    await client.query(
      'UPDATE questions SET image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE question_id = $1',
      [questionId]
    );

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete question image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  uploadQuestionImage,
  deleteQuestionImage
};
