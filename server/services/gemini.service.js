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

module.exports = { generateQuestions };