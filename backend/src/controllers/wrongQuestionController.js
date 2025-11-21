const pool = require('../config/database');

// Get all wrong questions for user
const getWrongQuestions = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;
    const { includeMastered } = req.query;

    let query = `
      SELECT wq.*, q.*, qs.title as quiz_set_title
      FROM wrong_questions wq
      JOIN questions q ON wq.question_id = q.question_id
      JOIN quiz_sets qs ON q.quiz_set_id = qs.quiz_set_id
      WHERE wq.user_id = $1
    `;

    const params = [req.userId];

    if (setId) {
      query += ` AND q.quiz_set_id = $2`;
      params.push(setId);
    }

    if (includeMastered !== 'true') {
      query += ` AND wq.is_mastered = false`;
    }

    query += ` ORDER BY wq.wrong_count DESC, wq.last_attempted DESC`;

    const results = await client.query(query, params);

    const wrongQuestions = await Promise.all(
      results.rows.map(async (row) => {
        const options = await client.query(
          'SELECT option_id, option_text, is_correct FROM options WHERE question_id = $1 ORDER BY option_id',
          [row.question_id]
        );

        return {
          wrongQuestionId: row.wrong_question_id,
          questionId: row.question_id,
          questionText: row.question_text,
          questionType: row.question_type,
          category: row.category,
          difficulty: row.difficulty,
          explanation: row.explanation,
          imageUrl: row.image_url,
          quizSetTitle: row.quiz_set_title,
          wrongCount: row.wrong_count,
          lastAttempted: row.last_attempted,
          isMastered: row.is_mastered,
          options: options.rows.map(opt => ({
            id: opt.option_id,
            text: opt.option_text,
            isCorrect: opt.is_correct
          }))
        };
      })
    );

    res.json({
      success: true,
      data: wrongQuestions
    });
  } catch (error) {
    console.error('Get wrong questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Add question to wrong questions
const addToWrongQuestions = async (req, res) => {
  const client = await pool.connect();

  try {
    const { questionId } = req.params;

    // Check if question exists
    const questionCheck = await client.query(
      'SELECT question_id FROM questions WHERE question_id = $1',
      [questionId]
    );

    if (questionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Insert or update wrong question
    const result = await client.query(
      `INSERT INTO wrong_questions (user_id, question_id, wrong_count, last_attempted)
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, question_id)
       DO UPDATE SET
         wrong_count = wrong_questions.wrong_count + 1,
         last_attempted = CURRENT_TIMESTAMP,
         is_mastered = false
       RETURNING *`,
      [req.userId, questionId]
    );

    res.json({
      success: true,
      data: {
        wrongQuestionId: result.rows[0].wrong_question_id,
        questionId: result.rows[0].question_id,
        wrongCount: result.rows[0].wrong_count,
        lastAttempted: result.rows[0].last_attempted
      }
    });
  } catch (error) {
    console.error('Add to wrong questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Mark wrong question as mastered
const markAsMastered = async (req, res) => {
  const client = await pool.connect();

  try {
    const { wrongQuestionId } = req.params;

    const result = await client.query(
      `UPDATE wrong_questions
       SET is_mastered = true
       WHERE wrong_question_id = $1 AND user_id = $2
       RETURNING *`,
      [wrongQuestionId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Wrong question record not found'
      });
    }

    res.json({
      success: true,
      message: 'Marked as mastered',
      data: {
        wrongQuestionId: result.rows[0].wrong_question_id,
        isMastered: result.rows[0].is_mastered
      }
    });
  } catch (error) {
    console.error('Mark as mastered error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Remove from wrong questions
const removeFromWrongQuestions = async (req, res) => {
  const client = await pool.connect();

  try {
    const { wrongQuestionId } = req.params;

    const result = await client.query(
      'DELETE FROM wrong_questions WHERE wrong_question_id = $1 AND user_id = $2 RETURNING *',
      [wrongQuestionId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Wrong question record not found'
      });
    }

    res.json({
      success: true,
      message: 'Removed from wrong questions'
    });
  } catch (error) {
    console.error('Remove from wrong questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Get wrong questions statistics
const getWrongQuestionsStats = async (req, res) => {
  const client = await pool.connect();

  try {
    const stats = await client.query(
      `SELECT
        COUNT(*) as total_wrong,
        COUNT(*) FILTER (WHERE is_mastered = false) as unmastered_count,
        COUNT(*) FILTER (WHERE is_mastered = true) as mastered_count,
        AVG(wrong_count) as avg_wrong_count
       FROM wrong_questions
       WHERE user_id = $1`,
      [req.userId]
    );

    res.json({
      success: true,
      data: {
        totalWrong: parseInt(stats.rows[0].total_wrong),
        unmasteredCount: parseInt(stats.rows[0].unmastered_count),
        masteredCount: parseInt(stats.rows[0].mastered_count),
        avgWrongCount: parseFloat(stats.rows[0].avg_wrong_count).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get wrong questions stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getWrongQuestions,
  addToWrongQuestions,
  markAsMastered,
  removeFromWrongQuestions,
  getWrongQuestionsStats
};
