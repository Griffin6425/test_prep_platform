const pool = require('../config/database');

// Get all tags
const getAllTags = async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT t.*, COUNT(qt.question_id) as question_count
       FROM tags t
       LEFT JOIN question_tags qt ON t.tag_id = qt.tag_id
       GROUP BY t.tag_id
       ORDER BY t.tag_name`
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.tag_id,
        name: row.tag_name,
        questionCount: parseInt(row.question_count),
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('Get all tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Add tags to question
const addTagsToQuestion = async (req, res) => {
  const client = await pool.connect();

  try {
    const { questionId } = req.params;
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be an array'
      });
    }

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
        message: 'You do not have permission to add tags to this question'
      });
    }

    await client.query('BEGIN');

    // Remove existing tags
    await client.query('DELETE FROM question_tags WHERE question_id = $1', [questionId]);

    // Add new tags
    for (const tagName of tags) {
      if (tagName && tagName.trim()) {
        // Insert or get tag
        const tagResult = await client.query(
          'INSERT INTO tags (tag_name) VALUES ($1) ON CONFLICT (tag_name) DO UPDATE SET tag_name = $1 RETURNING tag_id',
          [tagName.trim()]
        );
        const tagId = tagResult.rows[0].tag_id;

        // Link tag to question
        await client.query(
          'INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [questionId, tagId]
        );
      }
    }

    await client.query('COMMIT');

    // Get updated tags
    const updatedTags = await client.query(
      `SELECT t.tag_id, t.tag_name
       FROM tags t
       JOIN question_tags qt ON t.tag_id = qt.tag_id
       WHERE qt.question_id = $1`,
      [questionId]
    );

    res.json({
      success: true,
      data: updatedTags.rows.map(row => ({
        id: row.tag_id,
        name: row.tag_name
      }))
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

// Search questions
const searchQuestions = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;
    const { keyword, tags, category, difficulty } = req.query;

    // Check ownership
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
        message: 'You do not have permission to search in this quiz set'
      });
    }

    let query = `
      SELECT DISTINCT q.*,
        ARRAY_AGG(DISTINCT t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL) as tags
      FROM questions q
      LEFT JOIN question_tags qt ON q.question_id = qt.question_id
      LEFT JOIN tags t ON qt.tag_id = t.tag_id
      WHERE q.quiz_set_id = $1
    `;

    const params = [setId];
    let paramIndex = 2;

    // Add keyword search
    if (keyword) {
      query += ` AND (q.question_text ILIKE $${paramIndex} OR q.explanation ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    // Add category filter
    if (category) {
      query += ` AND q.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Add difficulty filter
    if (difficulty) {
      query += ` AND q.difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    query += ` GROUP BY q.question_id ORDER BY q.created_at`;

    let results = await client.query(query, params);

    // Filter by tags if provided
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      results.rows = results.rows.filter(q =>
        q.tags && tagArray.some(tag => q.tags.includes(tag))
      );
    }

    // Get options for each question
    const questionsWithOptions = await Promise.all(
      results.rows.map(async (question) => {
        const options = await client.query(
          'SELECT option_id, option_text, is_correct FROM options WHERE question_id = $1 ORDER BY option_id',
          [question.question_id]
        );

        return {
          id: question.question_id,
          questionText: question.question_text,
          questionType: question.question_type,
          category: question.category,
          difficulty: question.difficulty,
          explanation: question.explanation,
          imageUrl: question.image_url,
          tags: question.tags || [],
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
    console.error('Search questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getAllTags,
  addTagsToQuestion,
  searchQuestions
};
