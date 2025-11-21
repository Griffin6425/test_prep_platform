const pool = require('../config/database');

// Get all questions for a quiz set
const getQuestions = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;

    // Check if quiz set exists and user has access
    const quizSetCheck = await client.query(
      'SELECT owner_id FROM quiz_sets WHERE quiz_set_id = $1',
      [setId]
    );

    if (quizSetCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz set not found'
      });
    }

    if (quizSetCheck.rows[0].owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this quiz set'
      });
    }

    // Get questions with options
    const questions = await client.query(
      'SELECT * FROM questions WHERE quiz_set_id = $1 ORDER BY created_at',
      [setId]
    );

    const questionsWithOptions = await Promise.all(
      questions.rows.map(async (question) => {
        const options = await client.query(
          'SELECT option_id, option_text, is_correct FROM options WHERE question_id = $1 ORDER BY option_id',
          [question.question_id]
        );

        return {
          id: question.question_id,
          questionText: question.question_text,
          questionType: question.question_type,
          explanation: question.explanation,
          options: options.rows.map(opt => ({
            id: opt.option_id,
            text: opt.option_text,
            isCorrect: opt.is_correct
          })),
          createdAt: question.created_at
        };
      })
    );

    res.json({
      success: true,
      data: questionsWithOptions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Create new question with options (核心API)
const createQuestion = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;
    const { questionText, questionType, explanation, options } = req.body;

    // Validate input
    if (!questionText || !options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question text and at least one option are required'
      });
    }

    // Check if quiz set exists and user has access
    const quizSetCheck = await client.query(
      'SELECT owner_id FROM quiz_sets WHERE quiz_set_id = $1',
      [setId]
    );

    if (quizSetCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz set not found'
      });
    }

    if (quizSetCheck.rows[0].owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add questions to this quiz set'
      });
    }

    // Validate at least one correct answer exists
    const hasCorrectAnswer = options.some(opt => opt.isCorrect === true);
    if (!hasCorrectAnswer) {
      return res.status(400).json({
        success: false,
        message: 'At least one option must be marked as correct'
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Insert question
    const questionResult = await client.query(
      'INSERT INTO questions (quiz_set_id, question_text, question_type, explanation) VALUES ($1, $2, $3, $4) RETURNING question_id, question_text, question_type, explanation, created_at',
      [setId, questionText, questionType || 'single_choice', explanation || '']
    );

    const question = questionResult.rows[0];

    // Insert options
    const insertedOptions = [];
    for (const option of options) {
      if (!option.text || option.text.trim() === '') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'All options must have text'
        });
      }

      const optionResult = await client.query(
        'INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3) RETURNING option_id, option_text, is_correct',
        [question.question_id, option.text, option.isCorrect || false]
      );

      insertedOptions.push({
        id: optionResult.rows[0].option_id,
        text: optionResult.rows[0].option_text,
        isCorrect: optionResult.rows[0].is_correct
      });
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        id: question.question_id,
        questionText: question.question_text,
        questionType: question.question_type,
        explanation: question.explanation,
        options: insertedOptions,
        createdAt: question.created_at
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Update question
const updateQuestion = async (req, res) => {
  const client = await pool.connect();

  try {
    const { questionId } = req.params;
    const { questionText, questionType, explanation, options } = req.body;

    // Check if question exists and user has access
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
        message: 'You do not have permission to update this question'
      });
    }

    await client.query('BEGIN');

    // Update question
    await client.query(
      'UPDATE questions SET question_text = $1, question_type = $2, explanation = $3, updated_at = CURRENT_TIMESTAMP WHERE question_id = $4',
      [questionText, questionType, explanation || '', questionId]
    );

    // Delete old options and insert new ones
    if (options && Array.isArray(options)) {
      await client.query('DELETE FROM options WHERE question_id = $1', [questionId]);

      const insertedOptions = [];
      for (const option of options) {
        const optionResult = await client.query(
          'INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3) RETURNING option_id, option_text, is_correct',
          [questionId, option.text, option.isCorrect || false]
        );

        insertedOptions.push({
          id: optionResult.rows[0].option_id,
          text: optionResult.rows[0].option_text,
          isCorrect: optionResult.rows[0].is_correct
        });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          id: questionId,
          questionText,
          questionType,
          explanation,
          options: insertedOptions
        }
      });
    } else {
      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          id: questionId,
          questionText,
          questionType,
          explanation
        }
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Delete question
const deleteQuestion = async (req, res) => {
  const client = await pool.connect();

  try {
    const { questionId } = req.params;

    // Check if question exists and user has access
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
        message: 'You do not have permission to delete this question'
      });
    }

    await client.query('DELETE FROM questions WHERE question_id = $1', [questionId]);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Submit answer and get feedback
const submitAnswer = async (req, res) => {
  const client = await pool.connect();

  try {
    const { questionId } = req.params;
    const { selectedOptions } = req.body; // Array of option IDs

    if (!Array.isArray(selectedOptions)) {
      return res.status(400).json({
        success: false,
        message: 'selectedOptions must be an array'
      });
    }

    // Get question and quiz set info
    const questionInfo = await client.query(
      `SELECT q.question_id, q.quiz_set_id, q.question_type
       FROM questions q
       JOIN quiz_sets qs ON q.quiz_set_id = qs.quiz_set_id
       WHERE q.question_id = $1 AND qs.owner_id = $2`,
      [questionId, req.userId]
    );

    if (questionInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const question = questionInfo.rows[0];

    // Get all options for this question
    const allOptions = await client.query(
      'SELECT option_id, is_correct FROM options WHERE question_id = $1',
      [questionId]
    );

    const correctOptionIds = allOptions.rows
      .filter(opt => opt.is_correct)
      .map(opt => opt.option_id);

    // Check if answer is correct
    const selectedSet = new Set(selectedOptions);
    const correctSet = new Set(correctOptionIds);

    const isCorrect =
      selectedSet.size === correctSet.size &&
      [...selectedSet].every(id => correctSet.has(id));

    // Record progress
    await client.query(
      'INSERT INTO user_progress (user_id, quiz_set_id, question_id, is_correct) VALUES ($1, $2, $3, $4)',
      [req.userId, question.quiz_set_id, questionId, isCorrect]
    );

    // Add to wrong questions if incorrect
    if (!isCorrect) {
      await client.query(
        `INSERT INTO wrong_questions (user_id, question_id, wrong_count, last_attempted)
         VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, question_id)
         DO UPDATE SET
           wrong_count = wrong_questions.wrong_count + 1,
           last_attempted = CURRENT_TIMESTAMP,
           is_mastered = false`,
        [req.userId, questionId]
      );
    }

    res.json({
      success: true,
      data: {
        isCorrect,
        correctOptions: correctOptionIds,
        explanation: isCorrect ? 'Correct!' : 'Incorrect, please review the explanation.'
      }
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Get quiz statistics
const getQuizStats = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;

    // Check access
    const quizSetCheck = await client.query(
      'SELECT owner_id FROM quiz_sets WHERE quiz_set_id = $1',
      [setId]
    );

    if (quizSetCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz set not found'
      });
    }

    if (quizSetCheck.rows[0].owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view stats for this quiz set'
      });
    }

    const stats = await client.query(
      `SELECT
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
        ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 2) as accuracy
       FROM user_progress
       WHERE user_id = $1 AND quiz_set_id = $2`,
      [req.userId, setId]
    );

    res.json({
      success: true,
      data: {
        totalAttempts: parseInt(stats.rows[0].total_attempts) || 0,
        correctCount: parseInt(stats.rows[0].correct_count) || 0,
        accuracy: parseFloat(stats.rows[0].accuracy) || 0
      }
    });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  submitAnswer,
  getQuizStats
};
