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
    const body = req.body || {};
    const {
      title, stream, subject, topic, difficulty,
      question_count, marks_per_question,
      duration_minutes, capacity,
      scheduled_date, start_time
    } = body;

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

const getExamById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Exam not found' });
    }
    const exam = rows[0];
    // Only the creator can view the exam details in admin context
    if (exam.created_by !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }
    res.json({ status: 'ok', exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch exam' });
  }
};

// Admin-only: returns questions WITH correct answers for preview
const getQuestionsAdmin = async (req, res) => {
  try {
    const [examRows] = await pool.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
    if (examRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Exam not found' });
    }
    if (examRows[0].created_by !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }

    const [questions] = await pool.query(
      'SELECT * FROM questions WHERE exam_id = ? ORDER BY id ASC',
      [req.params.id]
    );
    res.json({ status: 'ok', questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch questions' });
  }
};

const publishExam = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Exam not found' });
    }
    const exam = rows[0];
    if (exam.created_by !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }
    if (exam.status !== 'ready') {
      return res.status(400).json({
        status: 'error',
        message: `Exam must be in "ready" status to publish. Current status: ${exam.status}`
      });
    }

    // Check that questions actually exist
    const [qRows] = await pool.query('SELECT COUNT(*) AS cnt FROM questions WHERE exam_id = ?', [exam.id]);
    if (qRows[0].cnt === 0) {
      return res.status(400).json({ status: 'error', message: 'No questions found. Generate questions first.' });
    }

    await pool.query('UPDATE exams SET status = ? WHERE id = ?', ['scheduled', exam.id]);
    res.json({ status: 'ok', message: 'Exam published and scheduled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to publish exam' });
  }
};

module.exports = { createExam, getMyExams, getExamById, getQuestionsAdmin, publishExam };