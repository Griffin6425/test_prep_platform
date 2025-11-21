const pool = require('../config/database');

// Get all quiz sets for current user
const getQuizSets = async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT
        quiz_set_id,
        title,
        description,
        created_at,
        (SELECT COUNT(*) FROM questions WHERE quiz_set_id = quiz_sets.quiz_set_id) as question_count
      FROM quiz_sets
      WHERE owner_id = $1
      ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.quiz_set_id,
        title: row.title,
        description: row.description,
        questionCount: parseInt(row.question_count),
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('Get quiz sets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Get single quiz set
const getQuizSet = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;

    const result = await client.query(
      `SELECT
        quiz_set_id,
        title,
        description,
        owner_id,
        created_at
      FROM quiz_sets
      WHERE quiz_set_id = $1`,
      [setId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz set not found'
      });
    }

    const quizSet = result.rows[0];

    // Check ownership
    if (quizSet.owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this quiz set'
      });
    }

    res.json({
      success: true,
      data: {
        id: quizSet.quiz_set_id,
        title: quizSet.title,
        description: quizSet.description,
        createdAt: quizSet.created_at
      }
    });
  } catch (error) {
    console.error('Get quiz set error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Create new quiz set
const createQuizSet = async (req, res) => {
  const client = await pool.connect();

  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const result = await client.query(
      'INSERT INTO quiz_sets (title, description, owner_id) VALUES ($1, $2, $3) RETURNING quiz_set_id, title, description, created_at',
      [title, description || '', req.userId]
    );

    const quizSet = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: quizSet.quiz_set_id,
        title: quizSet.title,
        description: quizSet.description,
        createdAt: quizSet.created_at
      }
    });
  } catch (error) {
    console.error('Create quiz set error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Update quiz set
const updateQuizSet = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;
    const { title, description } = req.body;

    // Check ownership
    const ownerCheck = await client.query(
      'SELECT owner_id FROM quiz_sets WHERE quiz_set_id = $1',
      [setId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz set not found'
      });
    }

    if (ownerCheck.rows[0].owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this quiz set'
      });
    }

    const result = await client.query(
      'UPDATE quiz_sets SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE quiz_set_id = $3 RETURNING *',
      [title, description || '', setId]
    );

    const quizSet = result.rows[0];

    res.json({
      success: true,
      data: {
        id: quizSet.quiz_set_id,
        title: quizSet.title,
        description: quizSet.description,
        updatedAt: quizSet.updated_at
      }
    });
  } catch (error) {
    console.error('Update quiz set error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Delete quiz set
const deleteQuizSet = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;

    // Check ownership
    const ownerCheck = await client.query(
      'SELECT owner_id FROM quiz_sets WHERE quiz_set_id = $1',
      [setId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz set not found'
      });
    }

    if (ownerCheck.rows[0].owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this quiz set'
      });
    }

    await client.query('DELETE FROM quiz_sets WHERE quiz_set_id = $1', [setId]);

    res.json({
      success: true,
      message: 'Quiz set deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz set error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getQuizSets,
  getQuizSet,
  createQuizSet,
  updateQuizSet,
  deleteQuizSet
};
