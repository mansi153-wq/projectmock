const pool = require('../config/db');

// GET /api/admin/exams — all exams with attempt stats
const getAdminExams = async (req, res) => {
  try {
    const [exams] = await pool.query(
      `SELECT e.*,
              COUNT(ea.id) AS total_attempts,
              COUNT(CASE WHEN ea.status IN ('submitted','auto_submitted') THEN 1 END) AS completed_attempts,
              ROUND(AVG(CASE WHEN ea.status IN ('submitted','auto_submitted') THEN (ea.score/ea.total_marks)*100 END),1) AS avg_percentage
       FROM exams e
       LEFT JOIN exam_attempts ea ON ea.exam_id = e.id
       WHERE e.created_by = ?
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [req.user.id]
    );
    res.json({ status: 'ok', exams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch exams' });
  }
};

// GET /api/admin/exams/:examId/leaderboard — full leaderboard for an exam
const getExamLeaderboard = async (req, res) => {
  try {
    const [examRows] = await pool.query('SELECT * FROM exams WHERE id = ? AND created_by = ?', [req.params.examId, req.user.id]);
    if (examRows.length === 0) return res.status(404).json({ status: 'error', message: 'Exam not found' });

    const [rows] = await pool.query(
      `SELECT ea.id AS attempt_id, ea.student_id, ea.score, ea.total_marks,
              ea.rank_position, ea.submitted_at, ea.status,
              u.name, u.email,
              ROUND((ea.score/ea.total_marks)*100, 1) AS percentage
       FROM exam_attempts ea
       JOIN users u ON ea.student_id = u.id
       WHERE ea.exam_id = ?
       ORDER BY ea.rank_position ASC, ea.submitted_at ASC`,
      [req.params.examId]
    );
    res.json({ status: 'ok', leaderboard: rows, exam: examRows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch leaderboard' });
  }
};

// GET /api/admin/exams/:examId/students — list of students who attempted
const getExamStudents = async (req, res) => {
  try {
    const [examRows] = await pool.query('SELECT * FROM exams WHERE id = ? AND created_by = ?', [req.params.examId, req.user.id]);
    if (examRows.length === 0) return res.status(404).json({ status: 'error', message: 'Exam not found' });

    const [students] = await pool.query(
      `SELECT ea.id AS attempt_id, ea.student_id, ea.score, ea.total_marks,
              ea.rank_position, ea.submitted_at, ea.started_at, ea.status,
              u.name, u.email,
              ROUND((ea.score/ea.total_marks)*100,1) AS percentage
       FROM exam_attempts ea
       JOIN users u ON ea.student_id = u.id
       WHERE ea.exam_id = ?
       ORDER BY ea.rank_position ASC`,
      [req.params.examId]
    );
    res.json({ status: 'ok', students, exam: examRows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch students' });
  }
};

// GET /api/admin/attempts/:attemptId/report — full report for a specific student attempt
const getStudentReport = async (req, res) => {
  try {
    const [attemptRows] = await pool.query(
      `SELECT ea.*, e.title, e.subject, e.topic, e.difficulty, e.stream,
              e.question_count, e.marks_per_question, e.total_marks AS exam_total,
              e.duration_minutes, e.scheduled_date, e.created_by,
              u.name AS student_name, u.email AS student_email
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       JOIN users u ON ea.student_id = u.id
       WHERE ea.id = ?`,
      [req.params.attemptId]
    );
    if (attemptRows.length === 0) return res.status(404).json({ status: 'error', message: 'Report not found' });
    const attempt = attemptRows[0];

    // Admin must own the exam
    if (attempt.created_by !== req.user.id) return res.status(403).json({ status: 'error', message: 'Access denied' });

    const [answers] = await pool.query(
      `SELECT sa.question_id, sa.selected_answer, sa.is_correct, sa.marks_awarded,
              q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer
       FROM student_answers sa
       JOIN questions q ON sa.question_id = q.id
       WHERE sa.attempt_id = ?
       ORDER BY q.id ASC`,
      [attempt.id]
    );

    const [feedbackRows] = await pool.query('SELECT * FROM ai_feedback WHERE attempt_id = ?', [attempt.id]);
    const feedback = feedbackRows.length > 0 ? {
      overallFeedback: feedbackRows[0].overall_feedback,
      strengths: JSON.parse(feedbackRows[0].strengths || '[]'),
      weaknesses: JSON.parse(feedbackRows[0].weaknesses || '[]'),
      recommendations: JSON.parse(feedbackRows[0].recommendations || '[]'),
    } : null;

    const correct = answers.filter(a => a.is_correct).length;
    const incorrect = answers.filter(a => !a.is_correct && a.selected_answer).length;
    const unanswered = attempt.question_count - answers.filter(a => a.selected_answer).length;
    const percentage = attempt.total_marks > 0 ? Math.round((attempt.score / attempt.total_marks) * 100) : 0;

    let timeTaken = null;
    if (attempt.started_at && attempt.submitted_at) {
      const ms = new Date(attempt.submitted_at) - new Date(attempt.started_at);
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      timeTaken = `${mins}m ${secs}s`;
    }

    res.json({
      status: 'ok',
      report: {
        attemptId: attempt.id,
        examId: attempt.exam_id,
        studentName: attempt.student_name,
        studentEmail: attempt.student_email,
        examTitle: attempt.title,
        subject: attempt.subject,
        topic: attempt.topic,
        stream: attempt.stream,
        difficulty: attempt.difficulty,
        scheduledDate: attempt.scheduled_date,
        totalQuestions: attempt.question_count,
        score: attempt.score,
        totalMarks: attempt.total_marks,
        percentage,
        rank: attempt.rank_position,
        correct, incorrect, unanswered,
        timeTaken,
        submittedAt: attempt.submitted_at,
        status: attempt.status,
        answers,
        feedback,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch report' });
  }
};

module.exports = { getAdminExams, getExamLeaderboard, getExamStudents, getStudentReport };
