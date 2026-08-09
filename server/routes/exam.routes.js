const express = require('express');
const router = express.Router();
const { createExam, getMyExams } = require('../controllers/exam.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

router.post('/', authenticateToken, requireAdmin, createExam);
router.get('/my-exams', authenticateToken, requireAdmin, getMyExams);

module.exports = router;