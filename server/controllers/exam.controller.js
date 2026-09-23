const pool = require('../config/db');

const generateExamCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const createExam = async (req, res) => {
  try {
    const body = req.body || {};
    const { title, stream, subject, topic, difficulty, question_count, marks_per_question, duration_minutes, capacity, scheduled_date, start_time } = body;
    if (!title || !stream || !subject || !topic || !difficulty || !question_count || !marks_per_question || !duration_minutes || !capacity || !scheduled_date || !start_time) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ status: 'error', message: 'Invalid difficulty' });
    }
    const total_marks = question_count * marks_per_question;
    let exam_code, isUnique = false;
    while (!isUnique) {
      exam_code = generateExamCode();
      const [existing] = await pool.query('SELECT id FROM exams WHERE exam_code = ?', [exam_code]);
      if (existing.length === 0) isUnique = true;
    }
    const [result] = await pool.query(
      `INSERT INTO exams (title, stream, subject, topic, difficulty, question_count, marks_per_question, total_marks, duration_minutes, capacity, exam_code, scheduled_date, start_time, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [title, stream, subject, topic, difficulty, question_count, marks_per_question, total_marks, duration_minutes, capacity, exam_code, scheduled_date, start_time, req.user.id]
    );
    res.status(201).json({
      status: 'ok',
      exam: { id: result.insertId, title, stream, subject, topic, difficulty, question_count, marks_per_question, total_marks, duration_minutes, capacity, exam_code, scheduled_date, start_time, status: 'draft' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to create exam' });
  }
};

const getMyExams = async (req, res) => {
  try {
    const [exams] = await pool.query('SELECT * FROM exams WHERE created_by = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ status: 'ok', exams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch exams' });
  }
};

const getExamById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Exam not found' });
    if (rows[0].created_by !== req.user.id) return res.status(403).json({ status: 'error', message: 'Access denied' });
    res.json({ status: 'ok', exam: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch exam' });
  }
};

const getQuestionsAdmin = async (req, res) => {
  try {
    const [examRows] = await pool.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
    if (examRows.length === 0) return res.status(404).json({ status: 'error', message: 'Exam not found' });
    if (examRows[0].created_by !== req.user.id) return res.status(403).json({ status: 'error', message: 'Access denied' });
    const [questions] = await pool.query('SELECT * FROM questions WHERE exam_id = ? ORDER BY id ASC', [req.params.id]);
    res.json({ status: 'ok', questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch questions' });
  }
};

const publishExam = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Exam not found' });
    const exam = rows[0];
    if (exam.created_by !== req.user.id) return res.status(403).json({ status: 'error', message: 'Access denied' });
    if (exam.status !== 'ready') return res.status(400).json({ status: 'error', message: `Exam must be in "ready" status to publish. Current: ${exam.status}` });
    const [qRows] = await pool.query('SELECT COUNT(*) AS cnt FROM questions WHERE exam_id = ?', [exam.id]);
    if (qRows[0].cnt === 0) return res.status(400).json({ status: 'error', message: 'No questions found. Generate questions first.' });
    await pool.query('UPDATE exams SET status = ? WHERE id = ?', ['scheduled', exam.id]);
    res.json({ status: 'ok', message: 'Exam published and scheduled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to publish exam' });
  }
};

// POST /api/exams/:id/reset — clears all attempts + resets start time to NOW
const resetExam = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Exam not found' });
    const exam = rows[0];
    if (exam.created_by !== req.user.id) return res.status(403).json({ status: 'error', message: 'Access denied' });

    const now = new Date();
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const newDate = `${y}-${mo}-${d}`;
    let mins = now.getMinutes() - 2;
    let hrs = now.getHours();
    if (mins < 0) { mins += 60; hrs -= 1; }
    const newTime = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [attemptRows] = await connection.query('SELECT id FROM exam_attempts WHERE exam_id = ?', [exam.id]);
      const attemptIds = attemptRows.map(a => a.id);
      if (attemptIds.length > 0) {
        const placeholders = attemptIds.map(() => '?').join(',');
        await connection.query(`DELETE FROM ai_feedback WHERE attempt_id IN (${placeholders})`, attemptIds);
        await connection.query(`DELETE FROM student_answers WHERE attempt_id IN (${placeholders})`, attemptIds);
        await connection.query('DELETE FROM exam_attempts WHERE exam_id = ?', [exam.id]);
      }
      await connection.query(
        'UPDATE exams SET scheduled_date = ?, start_time = ?, status = ? WHERE id = ?',
        [newDate, newTime, 'scheduled', exam.id]
      );
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    res.json({
      status: 'ok',
      message: `Reset done. Start time: ${newTime} today. All attempts cleared — students can join fresh.`,
      newDate,
      newTime,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to reset exam' });
  }
};

const deleteExam = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Exam not found' });
    const exam = rows[0];
    if (exam.created_by !== req.user.id) return res.status(403).json({ status: 'error', message: 'Access denied' });

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Delete in order: ai_feedback → student_answers → exam_attempts → questions → exam
      const [attemptRows] = await connection.query('SELECT id FROM exam_attempts WHERE exam_id = ?', [exam.id]);
      const attemptIds = attemptRows.map(a => a.id);
      if (attemptIds.length > 0) {
        const ph = attemptIds.map(() => '?').join(',');
        await connection.query(`DELETE FROM ai_feedback WHERE attempt_id IN (${ph})`, attemptIds);
        await connection.query(`DELETE FROM student_answers WHERE attempt_id IN (${ph})`, attemptIds);
        await connection.query('DELETE FROM exam_attempts WHERE exam_id = ?', [exam.id]);
      }
      await connection.query('DELETE FROM questions WHERE exam_id = ?', [exam.id]);
      await connection.query('DELETE FROM exams WHERE id = ?', [exam.id]);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    res.json({ status: 'ok', message: 'Exam permanently deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to delete exam' });
  }
};

module.exports = { createExam, getMyExams, getExamById, getQuestionsAdmin, publishExam, resetExam, deleteExam };
