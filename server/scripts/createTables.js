const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS exam_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      exam_id INT NOT NULL,
      student_id INT NOT NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      submitted_at TIMESTAMP NULL,
      score INT DEFAULT 0,
      total_marks INT NOT NULL,
      status ENUM('started','submitted','auto_submitted') DEFAULT 'started',
      rank_position INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (student_id) REFERENCES users(id),
      UNIQUE KEY unique_attempt (exam_id, student_id)
    )
  `);
  console.log('exam_attempts table ready');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS student_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      attempt_id INT NOT NULL,
      question_id INT NOT NULL,
      selected_answer VARCHAR(500) NULL,
      is_correct TINYINT(1) DEFAULT 0,
      marks_awarded INT DEFAULT 0,
      answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id),
      FOREIGN KEY (question_id) REFERENCES questions(id),
      UNIQUE KEY unique_answer (attempt_id, question_id)
    )
  `);
  console.log('student_answers table ready');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS ai_feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      attempt_id INT NOT NULL UNIQUE,
      student_id INT NOT NULL,
      overall_feedback TEXT NULL,
      strengths TEXT NULL,
      weaknesses TEXT NULL,
      recommendations TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);
  console.log('ai_feedback table ready');

  console.log('\nAll tables created successfully!');
  await conn.end();
})().catch((e) => {
  console.error('DB ERROR:', e.message);
  process.exit(1);
});
