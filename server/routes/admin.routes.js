const express = require('express');
const router = express.Router();
const { getAdminExams, getExamLeaderboard, getExamStudents, getStudentReport } = require('../controllers/admin.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

router.get('/exams', authenticateToken, requireAdmin, getAdminExams);
router.get('/exams/:examId/leaderboard', authenticateToken, requireAdmin, getExamLeaderboard);
router.get('/exams/:examId/students', authenticateToken, requireAdmin, getExamStudents);
router.get('/attempts/:attemptId/report', authenticateToken, requireAdmin, getStudentReport);

module.exports = router;
