const pool = require('../config/db');
const { generateQuestions } = require('../services/gemini.service');
const validateQuestions = require('../utils/validateQuestions');

const generateExamQuestions = async (req, res) => {
  const examId = req.params.id;

  try {
    const [examRows] = await pool.query('SELECT * FROM exams WHERE id = ?', [examId]);
    if (examRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Exam not found' });
    }

    const exam = examRows[0];

    if (exam.created_by !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'You do not own this exam' });
    }

    // Block regeneration only when exam is already in a published/active state
    if (exam.status === 'scheduled' || exam.status === 'active' || exam.status === 'completed') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot regenerate questions — exam is already ${exam.status}.`
      });
    }

    // If there are existing questions from a previous attempt, delete them first
    await pool.query('DELETE FROM questions WHERE exam_id = ?', [examId]);
    await pool.query('UPDATE exams SET status = ? WHERE id = ?', ['generating', examId]);

    let generatedQuestions;
    try {
      generatedQuestions = await generateQuestions({
        subject: exam.subject,
        topic: exam.topic,
        difficulty: exam.difficulty,
        question_count: exam.question_count,
      });
    } catch (aiError) {
      console.error('Gemini API error:', aiError);
      await pool.query('UPDATE exams SET status = ? WHERE id = ?', ['generation_failed', examId]);
      return res.status(502).json({ status: 'error', message: 'AI question generation failed. Please try again.' });
    }

    const validation = validateQuestions(generatedQuestions, exam.question_count);
    if (!validation.valid) {
      console.error('Validation failed:', validation.reason);
      await pool.query('UPDATE exams SET status = ? WHERE id = ?', ['generation_failed', examId]);
      return res.status(502).json({ status: 'error', message: `AI returned invalid questions: ${validation.reason}` });
    }

    // Trim to exactly the requested count (Gemini sometimes returns extras)
    const questionsToSave = generatedQuestions.slice(0, exam.question_count);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const q of questionsToSave) {
        await connection.query(
          `INSERT INTO questions 
            (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [examId, q.question, q.options[0], q.options[1], q.options[2], q.options[3], q.correctAnswer, q.explanation]
        );
      }

      await connection.query('UPDATE exams SET status = ? WHERE id = ?', ['ready', examId]);
      await connection.commit();
    } catch (dbError) {
      await connection.rollback();
      await pool.query('UPDATE exams SET status = ? WHERE id = ?', ['generation_failed', examId]);
      throw dbError;
    } finally {
      connection.release();
    }

    res.json({
      status: 'ok',
      message: `${questionsToSave.length} questions generated successfully`,
      examId,
      examStatus: 'ready'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to generate questions' });
  }
};

module.exports = { generateExamQuestions };