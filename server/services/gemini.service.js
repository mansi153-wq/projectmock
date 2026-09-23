const { GoogleGenAI } = require('@google/genai');

// Create client lazily so dotenv has already loaded the key
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in .env');
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
};

const MODEL = 'gemini-3.5-flash';

const buildPrompt = ({
  subject,
  topic,
  difficulty,
  question_count
}) => `
You are an expert exam question setter.

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

Return ONLY a JSON array in this exact format:

[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": "string (must exactly match one of the options)",
    "explanation": "string"
  }
]
`.trim();

const buildFeedbackPrompt = ({
  subject,
  topic,
  difficulty,
  totalQuestions,
  answered,
  correct,
  incorrect,
  score,
  totalMarks,
  percentage
}) => `
You are an educational feedback expert.

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

Return ONLY a JSON object in this exact format:

{
  "overallFeedback": "2-3 sentence overall performance summary",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": [
    "recommendation 1",
    "recommendation 2",
    "recommendation 3"
  ]
}
`.trim();


// Retry temporary Gemini errors such as 503
const generateWithRetry = async (request, retries = 3) => {
  const ai = getClient();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      const status = error?.status;

      // Only retry temporary server/rate-limit errors
      const shouldRetry =
        status === 503 ||
        status === 429 ||
        status === 500 ||
        status === 504;

      if (!shouldRetry || attempt === retries) {
        throw error;
      }

      // Exponential backoff:
      // 2 sec → 4 sec → 8 sec
      const delay = 2000 * Math.pow(2, attempt);

      console.log(
        `Gemini temporarily unavailable (${status}). ` +
        `Retrying in ${delay / 1000}s...`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};


const generateQuestions = async (examSettings) => {
  const response = await generateWithRetry({
    model: MODEL,
    contents: buildPrompt(examSettings),
    config: {
      responseMimeType: 'application/json'
    }
  });

  return JSON.parse(response.text);
};


const generateFeedback = async (performanceData) => {
  const response = await generateWithRetry({
    model: MODEL,
    contents: buildFeedbackPrompt(performanceData),
    config: {
      responseMimeType: 'application/json'
    }
  });

  return JSON.parse(response.text);
};


module.exports = {
  generateQuestions,
  generateFeedback
};