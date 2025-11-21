const pool = require('../config/database');

// Create a new exam
const createExam = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;
    const { title, durationMinutes, questionCount } = req.body;

    if (!title || !durationMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Title and duration are required'
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
        message: 'You do not have permission to create exam for this quiz set'
      });
    }

    // Get total questions in quiz set
    const questionCountResult = await client.query(
      'SELECT COUNT(*) as total FROM questions WHERE quiz_set_id = $1',
      [setId]
    );

    const totalAvailable = parseInt(questionCountResult.rows[0].total);
    const examQuestionCount = questionCount && questionCount < totalAvailable
      ? questionCount
      : totalAvailable;

    if (examQuestionCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions available in this quiz set'
      });
    }

    // Create exam
    const result = await client.query(
      `INSERT INTO exams (quiz_set_id, user_id, title, duration_minutes, total_questions, status)
       VALUES ($1, $2, $3, $4, $5, 'not_started')
       RETURNING *`,
      [setId, req.userId, title, durationMinutes, examQuestionCount]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].exam_id,
        quizSetId: result.rows[0].quiz_set_id,
        title: result.rows[0].title,
        durationMinutes: result.rows[0].duration_minutes,
        totalQuestions: result.rows[0].total_questions,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Start an exam
const startExam = async (req, res) => {
  const client = await pool.connect();

  try {
    const { examId } = req.params;

    // Get exam info
    const examResult = await client.query(
      `SELECT e.*, qs.owner_id
       FROM exams e
       JOIN quiz_sets qs ON e.quiz_set_id = qs.quiz_set_id
       WHERE e.exam_id = $1`,
      [examId]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const exam = examResult.rows[0];

    if (exam.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to start this exam'
      });
    }

    if (exam.status !== 'not_started') {
      return res.status(400).json({
        success: false,
        message: 'Exam has already been started'
      });
    }

    // Update exam status
    await client.query(
      `UPDATE exams
       SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
       WHERE exam_id = $1`,
      [examId]
    );

    // Get random questions
    const questions = await client.query(
      `SELECT question_id FROM questions
       WHERE quiz_set_id = $1
       ORDER BY RANDOM()
       LIMIT $2`,
      [exam.quiz_set_id, exam.total_questions]
    );

    // Get full question details with options
    const questionsWithOptions = await Promise.all(
      questions.rows.map(async (q) => {
        const questionResult = await client.query(
          'SELECT * FROM questions WHERE question_id = $1',
          [q.question_id]
        );

        const options = await client.query(
          'SELECT option_id, option_text FROM options WHERE question_id = $1 ORDER BY option_id',
          [q.question_id]
        );

        const question = questionResult.rows[0];

        return {
          id: question.question_id,
          questionText: question.question_text,
          questionType: question.question_type,
          imageUrl: question.image_url,
          options: options.rows.map(opt => ({
            id: opt.option_id,
            text: opt.option_text
          }))
        };
      })
    );

    res.json({
      success: true,
      data: {
        examId: exam.exam_id,
        title: exam.title,
        durationMinutes: exam.duration_minutes,
        startedAt: new Date(),
        questions: questionsWithOptions
      }
    });
  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Submit exam answers
const submitExam = async (req, res) => {
  const client = await pool.connect();

  try {
    const { examId } = req.params;
    const { answers } = req.body; // Array of { questionId, selectedOptions }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers must be an array'
      });
    }

    // Get exam info
    const examResult = await client.query(
      'SELECT * FROM exams WHERE exam_id = $1',
      [examId]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const exam = examResult.rows[0];

    if (exam.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to submit this exam'
      });
    }

    if (exam.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Exam is not in progress'
      });
    }

    // Check if exam time has expired
    const startedAt = new Date(exam.started_at);
    const now = new Date();
    const elapsedMinutes = (now - startedAt) / (1000 * 60);

    if (elapsedMinutes > exam.duration_minutes) {
      return res.status(400).json({
        success: false,
        message: 'Exam time has expired'
      });
    }

    await client.query('BEGIN');

    let correctCount = 0;

    // Process each answer
    for (const answer of answers) {
      const { questionId, selectedOptions } = answer;

      // Get correct options
      const correctOptions = await client.query(
        'SELECT option_id FROM options WHERE question_id = $1 AND is_correct = true',
        [questionId]
      );

      const correctOptionIds = correctOptions.rows.map(row => row.option_id);
      const selectedSet = new Set(selectedOptions);
      const correctSet = new Set(correctOptionIds);

      const isCorrect =
        selectedSet.size === correctSet.size &&
        [...selectedSet].every(id => correctSet.has(id));

      if (isCorrect) {
        correctCount++;
      }

      // Save answer
      await client.query(
        `INSERT INTO exam_answers (exam_id, question_id, selected_options, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [examId, questionId, selectedOptions, isCorrect]
      );
    }

    // Calculate score
    const score = (correctCount / exam.total_questions) * 100;

    // Update exam
    await client.query(
      `UPDATE exams
       SET status = 'completed', ended_at = CURRENT_TIMESTAMP, score = $1
       WHERE exam_id = $2`,
      [score, examId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        examId: exam.exam_id,
        totalQuestions: exam.total_questions,
        correctCount,
        score: parseFloat(score.toFixed(2)),
        completedAt: new Date()
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Get exam results
const getExamResults = async (req, res) => {
  const client = await pool.connect();

  try {
    const { examId } = req.params;

    const examResult = await client.query(
      `SELECT e.*, qs.title as quiz_set_title
       FROM exams e
       JOIN quiz_sets qs ON e.quiz_set_id = qs.quiz_set_id
       WHERE e.exam_id = $1`,
      [examId]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const exam = examResult.rows[0];

    if (exam.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this exam'
      });
    }

    // Get answers
    const answers = await client.query(
      `SELECT ea.*, q.question_text, q.explanation
       FROM exam_answers ea
       JOIN questions q ON ea.question_id = q.question_id
       WHERE ea.exam_id = $1
       ORDER BY ea.answered_at`,
      [examId]
    );

    const detailedAnswers = await Promise.all(
      answers.rows.map(async (answer) => {
        const options = await client.query(
          'SELECT option_id, option_text, is_correct FROM options WHERE question_id = $1 ORDER BY option_id',
          [answer.question_id]
        );

        return {
          questionId: answer.question_id,
          questionText: answer.question_text,
          explanation: answer.explanation,
          selectedOptions: answer.selected_options,
          isCorrect: answer.is_correct,
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
      data: {
        exam: {
          id: exam.exam_id,
          title: exam.title,
          quizSetTitle: exam.quiz_set_title,
          durationMinutes: exam.duration_minutes,
          totalQuestions: exam.total_questions,
          score: parseFloat(exam.score),
          status: exam.status,
          startedAt: exam.started_at,
          endedAt: exam.ended_at
        },
        answers: detailedAnswers
      }
    });
  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Get user's exams
const getUserExams = async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT e.*, qs.title as quiz_set_title
       FROM exams e
       JOIN quiz_sets qs ON e.quiz_set_id = qs.quiz_set_id
       WHERE e.user_id = $1
       ORDER BY e.created_at DESC`,
      [req.userId]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.exam_id,
        title: row.title,
        quizSetTitle: row.quiz_set_title,
        durationMinutes: row.duration_minutes,
        totalQuestions: row.total_questions,
        score: row.score ? parseFloat(row.score) : null,
        status: row.status,
        startedAt: row.started_at,
        endedAt: row.ended_at,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('Get user exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createExam,
  startExam,
  submitExam,
  getExamResults,
  getUserExams
};
