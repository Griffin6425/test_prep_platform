const pool = require('../config/database');
const XLSX = require('xlsx');

// Export questions to JSON
const exportToJSON = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;

    // Check ownership
    const quizSetCheck = await client.query(
      'SELECT owner_id, title FROM quiz_sets WHERE quiz_set_id = $1',
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
        message: 'You do not have permission to export this quiz set'
      });
    }

    // Get all questions with options and tags
    const questions = await client.query(
      `SELECT q.*,
        ARRAY_AGG(DISTINCT t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL) as tags
       FROM questions q
       LEFT JOIN question_tags qt ON q.question_id = qt.question_id
       LEFT JOIN tags t ON qt.tag_id = t.tag_id
       WHERE q.quiz_set_id = $1
       GROUP BY q.question_id
       ORDER BY q.created_at`,
      [setId]
    );

    const exportData = {
      quizSet: {
        title: quizSetCheck.rows[0].title,
        exportedAt: new Date().toISOString()
      },
      questions: await Promise.all(
        questions.rows.map(async (question) => {
          const options = await client.query(
            'SELECT option_text, is_correct FROM options WHERE question_id = $1 ORDER BY option_id',
            [question.question_id]
          );

          return {
            questionText: question.question_text,
            questionType: question.question_type,
            category: question.category,
            difficulty: question.difficulty,
            explanation: question.explanation,
            imageUrl: question.image_url,
            tags: question.tags || [],
            options: options.rows.map(opt => ({
              text: opt.option_text,
              isCorrect: opt.is_correct
            }))
          };
        })
      )
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=quiz-${setId}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Export to JSON error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during export'
    });
  } finally {
    client.release();
  }
};

// Export questions to Excel
const exportToExcel = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;

    // Check ownership
    const quizSetCheck = await client.query(
      'SELECT owner_id, title FROM quiz_sets WHERE quiz_set_id = $1',
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
        message: 'You do not have permission to export this quiz set'
      });
    }

    // Get all questions with options
    const questions = await client.query(
      'SELECT * FROM questions WHERE quiz_set_id = $1 ORDER BY created_at',
      [setId]
    );

    const excelData = [];

    for (const question of questions.rows) {
      const options = await client.query(
        'SELECT option_text, is_correct FROM options WHERE question_id = $1 ORDER BY option_id',
        [question.question_id]
      );

      const row = {
        '题目': question.question_text,
        '题型': question.question_type === 'single_choice' ? '单选' : '多选',
        '分类': question.category || '',
        '难度': question.difficulty || '',
        '解析': question.explanation || ''
      };

      options.rows.forEach((opt, index) => {
        row[`选项${String.fromCharCode(65 + index)}`] = opt.option_text;
        row[`选项${String.fromCharCode(65 + index)}是否正确`] = opt.is_correct ? '是' : '否';
      });

      excelData.push(row);
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '题目列表');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=quiz-${setId}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export to Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during export'
    });
  } finally {
    client.release();
  }
};

// Import questions from JSON
const importFromJSON = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid import data'
      });
    }

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
        message: 'You do not have permission to import to this quiz set'
      });
    }

    await client.query('BEGIN');

    let importedCount = 0;

    for (const q of questions) {
      if (!q.questionText || !q.options || q.options.length < 2) {
        continue;
      }

      // Insert question
      const questionResult = await client.query(
        `INSERT INTO questions
         (quiz_set_id, question_text, question_type, explanation, category, difficulty, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING question_id`,
        [
          setId,
          q.questionText,
          q.questionType || 'single_choice',
          q.explanation || '',
          q.category || null,
          q.difficulty || null,
          q.imageUrl || null
        ]
      );

      const questionId = questionResult.rows[0].question_id;

      // Insert options
      for (const opt of q.options) {
        if (opt.text) {
          await client.query(
            'INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
            [questionId, opt.text, opt.isCorrect || false]
          );
        }
      }

      // Insert tags if provided
      if (q.tags && Array.isArray(q.tags)) {
        for (const tagName of q.tags) {
          if (tagName) {
            // Insert or get tag
            const tagResult = await client.query(
              'INSERT INTO tags (tag_name) VALUES ($1) ON CONFLICT (tag_name) DO UPDATE SET tag_name = $1 RETURNING tag_id',
              [tagName]
            );
            const tagId = tagResult.rows[0].tag_id;

            // Link tag to question
            await client.query(
              'INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [questionId, tagId]
            );
          }
        }
      }

      importedCount++;
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully imported ${importedCount} questions`,
      data: { importedCount }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import from JSON error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during import'
    });
  } finally {
    client.release();
  }
};

// Import questions from Excel
const importFromExcel = async (req, res) => {
  const client = await pool.connect();

  try {
    const { setId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

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
        message: 'You do not have permission to import to this quiz set'
      });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    await client.query('BEGIN');

    let importedCount = 0;

    for (const row of data) {
      const questionText = row['题目'];
      const questionType = row['题型'] === '多选' ? 'multi_choice' : 'single_choice';
      const category = row['分类'] || null;
      const difficulty = row['难度'] || null;
      const explanation = row['解析'] || '';

      if (!questionText) continue;

      // Collect options
      const options = [];
      for (let i = 0; i < 10; i++) {
        const optionKey = `选项${String.fromCharCode(65 + i)}`;
        const correctKey = `选项${String.fromCharCode(65 + i)}是否正确`;

        if (row[optionKey]) {
          options.push({
            text: row[optionKey],
            isCorrect: row[correctKey] === '是'
          });
        }
      }

      if (options.length < 2) continue;

      // Insert question
      const questionResult = await client.query(
        `INSERT INTO questions
         (quiz_set_id, question_text, question_type, explanation, category, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING question_id`,
        [setId, questionText, questionType, explanation, category, difficulty]
      );

      const questionId = questionResult.rows[0].question_id;

      // Insert options
      for (const opt of options) {
        await client.query(
          'INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
          [questionId, opt.text, opt.isCorrect]
        );
      }

      importedCount++;
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully imported ${importedCount} questions`,
      data: { importedCount }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import from Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during import'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  exportToJSON,
  exportToExcel,
  importFromJSON,
  importFromExcel
};
