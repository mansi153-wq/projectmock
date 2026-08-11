const express = require('express');
const router = express.Router();
const { generateExamQuestions } = require('../controllers/generate.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

router.post('/:id/generate', authenticateToken, requireAdmin, generateExamQuestions);

module.exports = router;