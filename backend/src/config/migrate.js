const pool = require('./database');

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Quiz Sets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_sets (
        quiz_set_id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        owner_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        question_id SERIAL PRIMARY KEY,
        quiz_set_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type VARCHAR(20) DEFAULT 'single_choice',
        explanation TEXT,
        image_url TEXT,
        category VARCHAR(100),
        difficulty VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_set_id) REFERENCES quiz_sets(quiz_set_id) ON DELETE CASCADE
      )
    `);

    // Options table
    await client.query(`
      CREATE TABLE IF NOT EXISTS options (
        option_id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL,
        option_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
      )
    `);

    // User Progress table (optional for tracking practice results)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        progress_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        quiz_set_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        is_correct BOOLEAN,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (quiz_set_id) REFERENCES quiz_sets(quiz_set_id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
      )
    `);

    // Tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        tag_id SERIAL PRIMARY KEY,
        tag_name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Question Tags junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_tags (
        question_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (question_id, tag_id),
        FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
      )
    `);

    // Wrong Questions (错题本)
    await client.query(`
      CREATE TABLE IF NOT EXISTS wrong_questions (
        wrong_question_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        wrong_count INTEGER DEFAULT 1,
        last_attempted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_mastered BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
        UNIQUE(user_id, question_id)
      )
    `);

    // Exams table (定时考试)
    await client.query(`
      CREATE TABLE IF NOT EXISTS exams (
        exam_id SERIAL PRIMARY KEY,
        quiz_set_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        title VARCHAR(200) NOT NULL,
        duration_minutes INTEGER NOT NULL,
        total_questions INTEGER,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        score DECIMAL(5,2),
        status VARCHAR(20) DEFAULT 'not_started',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_set_id) REFERENCES quiz_sets(quiz_set_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Exam Answers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_answers (
        answer_id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        selected_options INTEGER[],
        is_correct BOOLEAN,
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quiz_sets_owner ON quiz_sets(owner_id);
      CREATE INDEX IF NOT EXISTS idx_questions_quiz_set ON questions(quiz_set_id);
      CREATE INDEX IF NOT EXISTS idx_options_question ON options(question_id);
      CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_question_tags_question ON question_tags(question_id);
      CREATE INDEX IF NOT EXISTS idx_question_tags_tag ON question_tags(tag_id);
      CREATE INDEX IF NOT EXISTS idx_wrong_questions_user ON wrong_questions(user_id);
      CREATE INDEX IF NOT EXISTS idx_exams_user ON exams(user_id);
      CREATE INDEX IF NOT EXISTS idx_exam_answers_exam ON exam_answers(exam_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createTables().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
