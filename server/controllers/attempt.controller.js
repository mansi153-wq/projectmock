const pool = require('../config/db');
const { generateFeedback } = require('../services/gemini.service');

// POST /api/attempts/:id/violation — record a tab-switch/window-leave violation
const recordViolation = async (req, res) => {
  try {
    const [attemptRows] = await pool.query('SELECT * FROM exam_attempts WHERE id = ?', [req.params.id]);
    if (attemptRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Attempt not found' });
    }
    const attempt = attemptRows[0];

    if (attempt.student_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }

    // Already submitted — ignore
    if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
      return res.json({ status: 'already_submitted' });
    }

    const newCount = (attempt.violation_count || 0) + 1;

    if (newCount === 1) {
      // First violation — warn only
      await pool.query(
        'UPDATE exam_attempts SET violation_count = 1 WHERE id = ?',
        [attempt.id]
      );
      return res.json({
        status: 'warning',
        violationCount: 1,
        message: 'First violation recorded. Student warned.',
      });
    }

    // Second violation — auto-submit using existing logic
    const [examRows] = await pool.query('SELECT * FROM exams WHERE id = ?', [attempt.exam_id]);
    const exam = examRows[0];

    // Update violation count first
    await pool.query('UPDATE exam_attempts SET violation_count = 2 WHERE id = ?', [attempt.id]);

    // Reuse existing evaluation logic
    const result = await evaluateAndSubmit(attempt, exam, 'auto_submitted', req.app.get('io'));

    return res.json({
      status: 'auto_submitted',
      violationCount: 2,
      message: 'Second violation — exam auto-submitted.',
      result,
    });
  } catch (err) {
    console.error('Violation recording error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to record violation' });
  }
};

// POST /api/attempts/join — validate exam code and create/resume attempt
const joinExam = async (req, res) => {
  try {
    const { exam_code } = req.body || {};
    if (!exam_code) {
      return res.status(400).json({ status: 'error', message: 'Exam code is required' });
    }

    const [examRows] = await pool.query('SELECT * FROM exams WHERE exam_code = ?', [exam_code.trim().toUpperCase()]);
    if (examRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Invalid exam code. Please check and try again.' });
    }

    const exam = examRows[0];

    if (!['scheduled', 'active'].includes(exam.status)) {
      return res.status(400).json({ status: 'error', message: `This exam is not available. Current status: ${exam.status}` });
    }

    // Check if student already has an attempt
    const [existingAttempt] = await pool.query(
      'SELECT * FROM exam_attempts WHERE exam_id = ? AND student_id = ?',
      [exam.id, req.user.id]
    );

    if (existingAttempt.length > 0) {
      const attempt = existingAttempt[0];
      if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
        // Don't block — send them to their result instead
        return res.status(200).json({
          status: 'already_submitted',
          message: 'You have already submitted this examination.',
          attemptId: attempt.id,
          examId: exam.id,
        });
      }
      // Resume existing attempt
      return res.json({
        status: 'ok',
        message: 'Resuming existing attempt',
        attemptId: attempt.id,
        examId: exam.id,
        exam: {
          id: exam.id, title: exam.title, subject: exam.subject,
          topic: exam.topic, difficulty: exam.difficulty,
          question_count: exam.question_count, total_marks: exam.total_marks,
          duration_minutes: exam.duration_minutes, scheduled_date: exam.scheduled_date,
          start_time: exam.start_time, status: exam.status,
        },
        serverTime: new Date().toISOString(),
      });
    }

    // Check capacity
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM exam_attempts WHERE exam_id = ?',
      [exam.id]
    );
    if (countRows[0].cnt >= exam.capacity) {
      return res.status(400).json({ status: 'error', message: 'This examination has reached its student capacity.' });
    }

    // Create new attempt
    const [result] = await pool.query(
      'INSERT INTO exam_attempts (exam_id, student_id, total_marks) VALUES (?, ?, ?)',
      [exam.id, req.user.id, exam.total_marks]
    );

    res.status(201).json({
      status: 'ok',
      message: 'Joined exam successfully',
      attemptId: result.insertId,
      examId: exam.id,
      exam: {
        id: exam.id, title: exam.title, subject: exam.subject,
        topic: exam.topic, difficulty: exam.difficulty,
        question_count: exam.question_count, total_marks: exam.total_marks,
        duration_minutes: exam.duration_minutes, scheduled_date: exam.scheduled_date,
        start_time: exam.start_time, status: exam.status,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to join exam' });
  }
};

// GET /api/attempts/:id/questions — questions WITHOUT correct answers
const getExamQuestions = async (req, res) => {
  try {
    const [attemptRows] = await pool.query('SELECT * FROM exam_attempts WHERE id = ?', [req.params.id]);
    if (attemptRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Attempt not found' });
    }
    const attempt = attemptRows[0];
    if (attempt.student_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }
    if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
      return res.status(400).json({ status: 'error', message: 'This attempt has already been submitted' });
    }

    const [examRows] = await pool.query('SELECT * FROM exams WHERE id = ?', [attempt.exam_id]);
    const exam = examRows[0];

    // Get server time and calculate exam timing
    // Format date safely without UTC shift (MySQL Date object needs local date string)
    const now = new Date();
    const { examStart, examEnd } = getExamTiming(exam);

    if (now < examStart) {
      return res.status(400).json({
        status: 'error',
        message: 'Exam has not started yet',
        examStart: examStart.toISOString(),
        serverTime: now.toISOString(),
      });
    }

    if (now > examEnd) {
      // Auto-submit if time expired
      if (attempt.status === 'started') {
        await autoSubmitAttempt(attempt.id, req.user.id, exam);
      }
      return res.status(400).json({ status: 'error', message: 'Exam time has expired' });
    }

    // Return questions WITHOUT correct_answer or explanation
    const [questions] = await pool.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d
       FROM questions WHERE exam_id = ? ORDER BY id ASC`,
      [attempt.exam_id]
    );

    // Get saved answers for this attempt
    const [savedAnswers] = await pool.query(
      'SELECT question_id, selected_answer FROM student_answers WHERE attempt_id = ?',
      [attempt.id]
    );
    const answersMap = {};
    savedAnswers.forEach(a => { answersMap[a.question_id] = a.selected_answer; });

    res.json({
      status: 'ok',
      questions,
      savedAnswers: answersMap,
      serverTime: now.toISOString(),
      examStart: examStart.toISOString(),
      examEnd: examEnd.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch questions' });
  }
};

// POST /api/attempts/:id/answers — save a single answer (upsert)
const saveAnswer = async (req, res) => {
  try {
    const { questionId, selectedAnswer } = req.body || {};
    if (!questionId || selectedAnswer === undefined) {
      return res.status(400).json({ status: 'error', message: 'questionId and selectedAnswer are required' });
    }

    const [attemptRows] = await pool.query('SELECT * FROM exam_attempts WHERE id = ?', [req.params.id]);
    if (attemptRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Attempt not found' });
    }
    const attempt = attemptRows[0];
    if (attempt.student_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }
    if (attempt.status !== 'started') {
      return res.status(400).json({ status: 'error', message: 'Attempt is no longer active' });
    }

    // Check exam deadline
    const [examRows] = await pool.query('SELECT * FROM exams WHERE id = ?', [attempt.exam_id]);
    const exam = examRows[0];
    const now = new Date();
    const { examStart, examEnd } = getExamTiming(exam);
    if (now > examEnd) {
      return res.status(400).json({ status: 'error', message: 'Exam time has expired' });
    }

    // Verify question belongs to this exam
    const [qRows] = await pool.query(
      'SELECT id FROM questions WHERE id = ? AND exam_id = ?',
      [questionId, attempt.exam_id]
    );
    if (qRows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid question' });
    }

    // Upsert answer
    await pool.query(
      `INSERT INTO student_answers (attempt_id, question_id, selected_answer)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE selected_answer = VALUES(selected_answer), answered_at = CURRENT_TIMESTAMP`,
      [attempt.id, questionId, selectedAnswer]
    );

    res.json({ status: 'ok', message: 'Answer saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to save answer' });
  }
};

// POST /api/attempts/:id/submit — evaluate and submit
const submitAttempt = async (req, res) => {
  try {
    const [attemptRows] = await pool.query('SELECT * FROM exam_attempts WHERE id = ?', [req.params.id]);
    if (attemptRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Attempt not found' });
    }
    const attempt = attemptRows[0];
    if (attempt.student_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }
    if (attempt.status !== 'started') {
      return res.status(400).json({ status: 'error', message: 'Attempt already submitted' });
    }

    const [examRows] = await pool.query('SELECT * FROM exams WHERE id = ?', [attempt.exam_id]);
    const exam = examRows[0];

    const result = await evaluateAndSubmit(attempt, exam, 'submitted', req.app.get('io'));
    res.json({ status: 'ok', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to submit exam' });
  }
};

// GET /api/attempts/:id/result — get result after submission
const getResult = async (req, res) => {
  try {
    const [attemptRows] = await pool.query(
      `SELECT ea.*, e.title, e.subject, e.topic, e.difficulty,
              e.question_count, e.marks_per_question, e.duration_minutes
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       WHERE ea.id = ?`,
      [req.params.id]
    );
    if (attemptRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Result not found' });
    }
    const attempt = attemptRows[0];
    if (attempt.student_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }
    if (attempt.status === 'started') {
      return res.status(400).json({ status: 'error', message: 'Exam not yet submitted' });
    }

    // Get answers with correct answer revealed (post-submission)
    const [answers] = await pool.query(
      `SELECT sa.question_id, sa.selected_answer, sa.is_correct, sa.marks_awarded,
              q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer
       FROM student_answers sa
       JOIN questions q ON sa.question_id = q.id
       WHERE sa.attempt_id = ?
       ORDER BY q.id ASC`,
      [attempt.id]
    );

    const percentage = attempt.total_marks > 0
      ? Math.round((attempt.score / attempt.total_marks) * 100)
      : 0;

    res.json({
      status: 'ok',
      result: {
        attemptId: attempt.id,
        examId: attempt.exam_id,
        title: attempt.title,
        subject: attempt.subject,
        topic: attempt.topic,
        difficulty: attempt.difficulty,
        score: attempt.score,
        totalMarks: attempt.total_marks,
        percentage,
        rank: attempt.rank_position,
        submittedAt: attempt.submitted_at,
        status: attempt.status,
        answers,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch result' });
  }
};

// GET /api/attempts/:id/feedback — get AI feedback
const getFeedback = async (req, res) => {
  try {
    const [attemptRows] = await pool.query('SELECT * FROM exam_attempts WHERE id = ?', [req.params.id]);
    if (attemptRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Attempt not found' });
    }
    if (attemptRows[0].student_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }

    const [feedbackRows] = await pool.query(
      'SELECT * FROM ai_feedback WHERE attempt_id = ?',
      [req.params.id]
    );
    if (feedbackRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Feedback not yet generated', code: 'NOT_READY' });
    }

    const fb = feedbackRows[0];
    res.json({
      status: 'ok',
      feedback: {
        overallFeedback: fb.overall_feedback,
        strengths: JSON.parse(fb.strengths || '[]'),
        weaknesses: JSON.parse(fb.weaknesses || '[]'),
        recommendations: JSON.parse(fb.recommendations || '[]'),
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch feedback' });
  }
};

// POST /api/attempts/:id/feedback/retry — manually trigger feedback regeneration
const retryFeedback = async (req, res) => {
  try {
    const [attemptRows] = await pool.query(
      `SELECT ea.*, e.subject, e.topic, e.difficulty, e.question_count, e.total_marks, e.marks_per_question
       FROM exam_attempts ea JOIN exams e ON ea.exam_id = e.id WHERE ea.id = ?`,
      [req.params.id]
    );
    if (attemptRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Attempt not found' });
    }
    const attempt = attemptRows[0];
    if (attempt.student_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }

    const [answers] = await pool.query(
      'SELECT question_id, selected_answer FROM student_answers WHERE attempt_id = ?',
      [attempt.id]
    );
    const [questions] = await pool.query(
      'SELECT id, correct_answer FROM questions WHERE exam_id = ?',
      [attempt.exam_id]
    );
    const correctMap = {};
    questions.forEach(q => { correctMap[q.id] = q.correct_answer; });

    // Fire and forget
    generateAiFeedback(attempt.id, attempt.student_id, attempt, attempt.score, answers, correctMap)
      .catch(console.error);

    res.json({ status: 'ok', message: 'Feedback generation started' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to retry feedback' });
  }
};
const getLeaderboard = async (req, res) => {
  try {
    const [attemptRows] = await pool.query('SELECT exam_id FROM exam_attempts WHERE id = ?', [req.params.id]);
    if (attemptRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Attempt not found' });
    }
    const examId = attemptRows[0].exam_id;

    const [rows] = await pool.query(
      `SELECT ea.id, ea.student_id, ea.score, ea.total_marks, ea.rank_position, ea.submitted_at,
              u.name
       FROM exam_attempts ea
       JOIN users u ON ea.student_id = u.id
       WHERE ea.exam_id = ? AND ea.status IN ('submitted', 'auto_submitted')
       ORDER BY ea.rank_position ASC`,
      [examId]
    );

    res.json({ status: 'ok', leaderboard: rows, examId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch leaderboard' });
  }
};

// GET /api/exams/:examId/leaderboard — leaderboard by exam id
const getLeaderboardByExam = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ea.id, ea.student_id, ea.score, ea.total_marks, ea.rank_position, ea.submitted_at,
              u.name
       FROM exam_attempts ea
       JOIN users u ON ea.student_id = u.id
       WHERE ea.exam_id = ? AND ea.status IN ('submitted', 'auto_submitted')
       ORDER BY ea.rank_position ASC`,
      [req.params.examId]
    );
    res.json({ status: 'ok', leaderboard: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch leaderboard' });
  }
};

// ─── Internal helpers ───────────────────────────────────────────────────────

// Safely build exam start/end times without UTC shift
const getExamTiming = (exam) => {
  const rawDate = exam.scheduled_date;
  let dateStr;
  if (rawDate instanceof Date) {
    const y = rawDate.getFullYear();
    const m = String(rawDate.getMonth() + 1).padStart(2, '0');
    const d = String(rawDate.getDate()).padStart(2, '0');
    dateStr = `${y}-${m}-${d}`;
  } else {
    dateStr = String(rawDate).split('T')[0];
  }
  const examStart = new Date(`${dateStr}T${exam.start_time}`);
  const examEnd = new Date(examStart.getTime() + exam.duration_minutes * 60 * 1000);
  return { examStart, examEnd };
};

const evaluateAndSubmit = async (attempt, exam, submitStatus, io) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get all questions with correct answers
    const [questions] = await connection.query(
      'SELECT id, correct_answer FROM questions WHERE exam_id = ?',
      [exam.id]
    );
    const correctMap = {};
    questions.forEach(q => { correctMap[q.id] = q.correct_answer; });

    // Get student answers
    const [answers] = await connection.query(
      'SELECT question_id, selected_answer FROM student_answers WHERE attempt_id = ?',
      [attempt.id]
    );

    let score = 0;
    for (const answer of answers) {
      const isCorrect = answer.selected_answer === correctMap[answer.question_id] ? 1 : 0;
      const marksAwarded = isCorrect ? exam.marks_per_question : 0;
      score += marksAwarded;
      await connection.query(
        'UPDATE student_answers SET is_correct = ?, marks_awarded = ? WHERE attempt_id = ? AND question_id = ?',
        [isCorrect, marksAwarded, attempt.id, answer.question_id]
      );
    }

    // Mark attempt as submitted
    await connection.query(
      'UPDATE exam_attempts SET status = ?, score = ?, submitted_at = NOW() WHERE id = ?',
      [submitStatus, score, attempt.id]
    );

    // Recalculate all ranks for this exam
    const [allAttempts] = await connection.query(
      `SELECT id, score, submitted_at FROM exam_attempts
       WHERE exam_id = ? AND status IN ('submitted', 'auto_submitted')
       ORDER BY score DESC, submitted_at ASC`,
      [exam.id]
    );
    for (let i = 0; i < allAttempts.length; i++) {
      await connection.query(
        'UPDATE exam_attempts SET rank_position = ? WHERE id = ?',
        [i + 1, allAttempts[i].id]
      );
    }

    await connection.commit();

    // Get updated rank for this attempt
    const [rankRow] = await pool.query('SELECT rank_position FROM exam_attempts WHERE id = ?', [attempt.id]);
    const rank = rankRow[0]?.rank_position;

    // Emit leaderboard update via Socket.IO
    if (io) {
      const [leaderboard] = await pool.query(
        `SELECT ea.student_id, ea.score, ea.total_marks, ea.rank_position, u.name
         FROM exam_attempts ea JOIN users u ON ea.student_id = u.id
         WHERE ea.exam_id = ? AND ea.status IN ('submitted','auto_submitted')
         ORDER BY ea.rank_position ASC`,
        [exam.id]
      );
      io.to(`exam_${exam.id}`).emit('leaderboard:update', { examId: exam.id, leaderboard });
    }

    // Generate AI feedback asynchronously (don't block response)
    generateAiFeedback(attempt.id, attempt.student_id, exam, score, answers, correctMap).catch(console.error);

    return { score, totalMarks: exam.total_marks, rank, percentage: Math.round((score / exam.total_marks) * 100) };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const autoSubmitAttempt = async (attemptId, studentId, exam) => {
  const [rows] = await pool.query('SELECT * FROM exam_attempts WHERE id = ?', [attemptId]);
  if (rows.length === 0 || rows[0].status !== 'started') return;
  await evaluateAndSubmit(rows[0], exam, 'auto_submitted', null);
};

const generateAiFeedback = async (attemptId, studentId, exam, score, answers, correctMap) => {
  const maxRetries = 3;
  const retryDelayMs = 8000; // 8 seconds between retries

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const correct = answers.filter(a => a.selected_answer === correctMap[a.question_id]).length;
      const incorrect = answers.length - correct;
      const percentage = Math.round((score / exam.total_marks) * 100);

      const feedback = await generateFeedback({
        subject: exam.subject,
        topic: exam.topic,
        difficulty: exam.difficulty,
        totalQuestions: exam.question_count,
        answered: answers.length,
        correct,
        incorrect,
        score,
        totalMarks: exam.total_marks,
        percentage,
      });

      await pool.query(
        `INSERT INTO ai_feedback (attempt_id, student_id, overall_feedback, strengths, weaknesses, recommendations)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           overall_feedback = VALUES(overall_feedback),
           strengths = VALUES(strengths),
           weaknesses = VALUES(weaknesses),
           recommendations = VALUES(recommendations)`,
        [
          attemptId, studentId,
          feedback.overallFeedback,
          JSON.stringify(feedback.strengths),
          JSON.stringify(feedback.weaknesses),
          JSON.stringify(feedback.recommendations),
        ]
      );
      console.log(`AI feedback generated for attempt ${attemptId}`);
      return; // success
    } catch (err) {
      console.error(`AI feedback attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
  }
  console.error(`AI feedback failed after ${maxRetries} attempts for attempt ${attemptId}`);
};

module.exports = {
  joinExam, getExamQuestions, saveAnswer, submitAttempt,
  getResult, getFeedback, retryFeedback, getLeaderboard, getLeaderboardByExam,
  recordViolation,
};
