import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const GenerateQuestions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingExam, setLoadingExam] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch exam details on mount
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await api.get(`/exams/${examId}`);
        setExam(res.data.exam);
        // If already ready, also load existing questions
        if (res.data.exam.status === 'ready') {
          const qRes = await api.get(`/exams/${examId}/questions-admin`);
          setQuestions(qRes.data.questions);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load exam details');
      } finally {
        setLoadingExam(false);
      }
    };
    fetchExam();
  }, [examId]);

  const handleGenerate = async () => {
    setError('');
    setSuccessMsg('');
    setGenerating(true);
    setQuestions([]);

    try {
      const res = await api.post(`/exams/${examId}/generate`);
      setSuccessMsg(res.data.message);

      // Fetch the generated questions for preview
      const qRes = await api.get(`/exams/${examId}/questions-admin`);
      setQuestions(qRes.data.questions);

      // Refresh exam status
      const examRes = await api.get(`/exams/${examId}`);
      setExam(examRes.data.exam);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    setError('');
    try {
      await api.post(`/exams/${examId}/publish`);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish exam');
    }
  };

  if (loadingExam) return <p>Loading exam...</p>;
  if (!exam && !loadingExam) return <p style={{ color: 'red' }}>{error || 'Exam not found'}</p>;

  return (
    <div>
      <Link to="/admin/dashboard">← Back to Dashboard</Link>
      <h2>Generate Questions — {exam?.title}</h2>

      {exam && (
        <div style={{ background: '#f5f5f5', padding: '12px', marginBottom: '16px', borderRadius: '6px' }}>
          <p><strong>Subject:</strong> {exam.subject} &nbsp;|&nbsp; <strong>Topic:</strong> {exam.topic}</p>
          <p><strong>Difficulty:</strong> {exam.difficulty} &nbsp;|&nbsp; <strong>Questions:</strong> {exam.question_count} &nbsp;|&nbsp; <strong>Marks each:</strong> {exam.marks_per_question}</p>
          <p><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{exam.status}</span></p>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

      <button onClick={handleGenerate} disabled={generating}>
        {generating
          ? '⏳ Generating with AI... (this may take 10–30 seconds)'
          : questions.length > 0
          ? '🔄 Regenerate Questions'
          : '✨ Generate Questions with AI'}
      </button>

      {questions.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3>Preview — {questions.length} Questions Generated</h3>
          <p style={{ color: '#666' }}>Review the questions below. If you are satisfied, click "Publish Exam".</p>

          {questions.map((q, i) => (
            <div
              key={q.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                background: '#fff',
              }}
            >
              <p><strong>Q{i + 1}.</strong> {q.question_text}</p>
              <ul style={{ listStyle: 'none', paddingLeft: '8px' }}>
                <li style={{ color: q.correct_answer === q.option_a ? 'green' : 'inherit' }}>
                  A) {q.option_a} {q.correct_answer === q.option_a && '✓'}
                </li>
                <li style={{ color: q.correct_answer === q.option_b ? 'green' : 'inherit' }}>
                  B) {q.option_b} {q.correct_answer === q.option_b && '✓'}
                </li>
                <li style={{ color: q.correct_answer === q.option_c ? 'green' : 'inherit' }}>
                  C) {q.option_c} {q.correct_answer === q.option_c && '✓'}
                </li>
                <li style={{ color: q.correct_answer === q.option_d ? 'green' : 'inherit' }}>
                  D) {q.option_d} {q.correct_answer === q.option_d && '✓'}
                </li>
              </ul>
              <p style={{ color: '#555', fontSize: '0.9em' }}>
                <strong>Explanation:</strong> {q.explanation}
              </p>
            </div>
          ))}

          <button
            onClick={handlePublish}
            style={{ background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1em' }}
          >
            ✅ Publish Exam
          </button>
          &nbsp;&nbsp;
          <button onClick={handleGenerate} disabled={generating}>
            🔄 Regenerate
          </button>
        </div>
      )}
    </div>
  );
};

export default GenerateQuestions;
