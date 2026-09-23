const express = require('express');
const router = express.Router();
const {
  joinExam, getExamQuestions, saveAnswer,
  submitAttempt, getResult, getFeedback, retryFeedback, getLeaderboard,
  recordViolation,
} = require('../controllers/attempt.controller');
const { authenticateToken, requireStudent } = require('../middleware/auth.middleware');

router.post('/join', authenticateToken, requireStudent, joinExam);
router.get('/:id/questions', authenticateToken, requireStudent, getExamQuestions);
router.post('/:id/answers', authenticateToken, requireStudent, saveAnswer);
router.post('/:id/submit', authenticateToken, requireStudent, submitAttempt);
router.get('/:id/result', authenticateToken, requireStudent, getResult);
router.get('/:id/feedback', authenticateToken, requireStudent, getFeedback);
router.post('/:id/feedback/retry', authenticateToken, requireStudent, retryFeedback);
router.get('/:id/leaderboard', authenticateToken, requireStudent, getLeaderboard);
router.post('/:id/violation', authenticateToken, requireStudent, recordViolation);

module.exports = router;
