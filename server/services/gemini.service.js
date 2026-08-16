const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const buildPrompt = ({ subject, topic, difficulty, question_count }) => {
  return `You are an expert exam question setter.

Generate exactly ${question_count} multiple-choice questions for the following exam:

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Rules:
- Each question must have exactly 4 answer options.
- Exactly one option must be correct.
- Provide a short explanation (1-2 sentences) for why the correct answer is right.
- Do not repeat the same question twice.
- Questions must be factually accurate and appropriate for the given difficulty level.

Return ONLY a JSON array in this exact format, with no extra text:

[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": "string (must exactly match one of the options)",
    "explanation": "string"
  }
]`;
};

const generateQuestions = async (examSettings) => {
  const prompt = buildPrompt(examSettings);

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const rawText = response.text;
  return JSON.parse(rawText);
};

const buildFeedbackPrompt = ({ subject, topic, difficulty, totalQuestions, answered, correct, incorrect, score, totalMarks, percentage }) => {
  return `You are an educational feedback expert.

A student just completed an online MCQ examination with the following performance:

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Total Questions: ${totalQuestions}
Questions Answered: ${answered}
Correct Answers: ${correct}
Incorrect Answers: ${incorrect}
Score: ${score} / ${totalMarks}
Percentage: ${percentage}%

Generate personalized, constructive academic feedback for this student.

Return ONLY a JSON object in this exact format, with no extra text:

{
  "overallFeedback": "2-3 sentence overall performance summary",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;
};

const generateFeedback = async (performanceData) => {
  const prompt = buildFeedbackPrompt(performanceData);

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  return JSON.parse(response.text);
};

module.exports = { generateQuestions, generateFeedback };