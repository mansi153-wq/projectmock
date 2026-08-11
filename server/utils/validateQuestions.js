const validateQuestions = (questions, expectedCount) => {
  if (!Array.isArray(questions)) {
    return { valid: false, reason: 'Response is not an array' };
  }

  if (questions.length < expectedCount) {
    return { valid: false, reason: `Expected ${expectedCount} questions, got only ${questions.length}` };
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    if (!q.question || typeof q.question !== 'string') {
      return { valid: false, reason: `Question ${i + 1}: missing or invalid question text` };
    }

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return { valid: false, reason: `Question ${i + 1}: must have exactly 4 options` };
    }

    if (q.options.some((opt) => !opt || typeof opt !== 'string')) {
      return { valid: false, reason: `Question ${i + 1}: all options must be non-empty strings` };
    }

    if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
      return { valid: false, reason: `Question ${i + 1}: missing correct answer` };
    }

    if (!q.options.includes(q.correctAnswer)) {
      return { valid: false, reason: `Question ${i + 1}: correct answer does not match any option` };
    }

    if (!q.explanation || typeof q.explanation !== 'string') {
      return { valid: false, reason: `Question ${i + 1}: missing explanation` };
    }
  }

  const questionTexts = questions.map((q) => q.question.trim().toLowerCase());
  const uniqueTexts = new Set(questionTexts);
  if (uniqueTexts.size !== questionTexts.length) {
    return { valid: false, reason: 'Duplicate questions detected' };
  }

  return { valid: true };
};

module.exports = validateQuestions;