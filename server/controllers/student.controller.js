const pool = require('../config/db');

// GET /api/student/exams — available scheduled/active exams
const getAvailableExams = async (req, res) => {
  try {
    const [exams] = await pool.query(
      `SELECT id, title, stream, subject, topic, difficulty, question_count,
              marks_per_question, total_marks, duration_minutes, capacity,
              exam_code, scheduled_date, start_time, status
       FROM exams
       WHERE status IN ('scheduled', 'active')
       ORDER BY scheduled_date ASC, start_time ASC`
    );
    res.json({ status: 'ok', exams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch exams' });
  }
};

// GET /api/student/exams/:id — single exam details (no correct answers)
const getExamDetails = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, stream, subject, topic, difficulty, question_count,
              marks_per_question, total_marks, duration_minutes, capacity,
              exam_code, scheduled_date, start_time, status
       FROM exams WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Exam not found' });
    }
    res.json({ status: 'ok', exam: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch exam' });
  }
};

// GET /api/student/my-results — all attempts for this student
const getMyResults = async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT ea.id, ea.exam_id, ea.score, ea.total_marks, ea.status,
              ea.submitted_at, ea.rank_position,
              e.title, e.subject, e.topic, e.difficulty
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       WHERE ea.student_id = ?
       ORDER BY ea.created_at DESC`,
      [req.user.id]
    );
    res.json({ status: 'ok', results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch results' });
  }
};

// GET /api/student/stats — dashboard summary stats
const getStats = async (req, res) => {
  try {
    const [attempts] = await pool.query(
      'SELECT score, total_marks, rank_position FROM exam_attempts WHERE student_id = ? AND status IN (\'submitted\', \'auto_submitted\')',
      [req.user.id]
    );
    const completed = attempts.length;
    const avgScore = completed > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.total_marks) * 100, 0) / completed)
      : 0;
    const bestScore = completed > 0
      ? Math.max(...attempts.map(a => Math.round((a.score / a.total_marks) * 100)))
      : 0;
    const bestRank = completed > 0
      ? Math.min(...attempts.filter(a => a.rank_position).map(a => a.rank_position))
      : null;

    const [availableRows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM exams WHERE status IN (\'scheduled\', \'active\')'
    );

    res.json({
      status: 'ok',
      stats: {
        completedExams: completed,
        availableExams: availableRows[0].cnt,
        averageScore: avgScore,
        bestScore,
        bestRank,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
  }
};

module.exports = { getAvailableExams, getExamDetails, getMyResults, getStats };

