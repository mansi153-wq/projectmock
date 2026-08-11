const express = require('express');
const router = express.Router();
const { createExam, getMyExams, getExamById, getQuestionsAdmin, publishExam } = require('../controllers/exam.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

router.post('/', authenticateToken, requireAdmin, createExam);
router.get('/my-exams', authenticateToken, requireAdmin, getMyExams);
router.get('/:id', authenticateToken, requireAdmin, getExamById);
router.get('/:id/questions-admin', authenticateToken, requireAdmin, getQuestionsAdmin);
router.post('/:id/publish', authenticateToken, requireAdmin, publishExam);

module.exports = router;