const express = require('express');
const router = express.Router();
const { getAvailableExams, getExamDetails, getMyResults, getStats } = require('../controllers/student.controller');
const { authenticateToken, requireStudent } = require('../middleware/auth.middleware');

router.get('/exams', authenticateToken, requireStudent, getAvailableExams);
router.get('/exams/:id', authenticateToken, requireStudent, getExamDetails);
router.get('/my-results', authenticateToken, requireStudent, getMyResults);
router.get('/stats', authenticateToken, requireStudent, getStats);

module.exports = router;
