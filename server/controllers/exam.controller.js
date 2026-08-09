const pool = require('../config/db');

const generateExamCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const createExam = async (req, res) => {
  try {
    const {
      title, stream, subject, topic, difficulty,
      question_count, marks_per_question,
      duration_minutes, capacity,
      scheduled_date, start_time
    } = req.body;

    if (!title || !stream || !subject || !topic || !difficulty ||
        !question_count || !marks_per_question ||
        !duration_minutes || !capacity ||
        !scheduled_date || !start_time) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ status: 'error', message: 'Invalid difficulty' });
    }

    const total_marks = question_count * marks_per_question;

    let exam_code;
    let isUnique = false;
    while (!isUnique) {
      exam_code = generateExamCode();
      const [existing] = await pool.query('SELECT id FROM exams WHERE exam_code = ?', [exam_code]);
      if (existing.length === 0) isUnique = true;
    }

    const [result] = await pool.query(
      `INSERT INTO exams 
        (title, stream, subject, topic, difficulty, question_count, marks_per_question, total_marks,
         duration_minutes, capacity, exam_code, scheduled_date, start_time, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [title, stream, subject, topic, difficulty, question_count, marks_per_question, total_marks,
       duration_minutes, capacity, exam_code, scheduled_date, start_time, req.user.id]
    );

    res.status(201).json({
      status: 'ok',
      exam: {
        id: result.insertId, title, stream, subject, topic, difficulty,
        question_count, marks_per_question, total_marks,
        duration_minutes, capacity, exam_code, scheduled_date, start_time,
        status: 'draft'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to create exam' });
  }
};

const getMyExams = async (req, res) => {
  try {
    const [exams] = await pool.query(
      'SELECT * FROM exams WHERE created_by = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ status: 'ok', exams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch exams' });
  }
};

module.exports = { createExam, getMyExams };