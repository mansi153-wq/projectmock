import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../services/api';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_KEYS = ['option_a', 'option_b', 'option_c', 'option_d'];

const GenerateQuestions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingExam, setLoadingExam] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/exams/${examId}`);
        setExam(res.data.exam);
        if (['ready', 'scheduled', 'active', 'completed'].includes(res.data.exam.status)) {
          const qRes = await api.get(`/exams/${examId}/questions-admin`);
          setQuestions(qRes.data.questions);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load exam');
      } finally { setLoadingExam(false); }
    };
    load();
  }, [examId]);

  const handleGenerate = async () => {
    setError(''); setSuccessMsg(''); setGenerating(true); setQuestions([]);
    try {
      const res = await api.post(`/exams/${examId}/generate`);
      setSuccessMsg(res.data.message);
      const qRes = await api.get(`/exams/${examId}/questions-admin`);
      setQuestions(qRes.data.questions);
      const eRes = await api.get(`/exams/${examId}`);
      setExam(eRes.data.exam);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed. Please try again.');
    } finally { setGenerating(false); }
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

  if (loadingExam) return (
    <AdminLayout pageName="Generate Questions">
      <div className="a-loading"><div className="a-spinner" /><span>Loading exam...</span></div>
    </AdminLayout>
  );

  const isPublished = ['scheduled', 'active', 'completed'].includes(exam?.status);

  return (
    <AdminLayout pageName="Generate Questions">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="ap-header">
          <div>
            <div className="ap-title">✨ Generate Questions</div>
            <div className="ap-subtitle">{exam?.title}</div>
          </div>
          <button className="abtn abtn--ghost" onClick={() => navigate('/admin/dashboard')}>
            ← Dashboard
          </button>
        </div>

        {/* Exam info */}
        {exam && (
          <div className="aei-box">
            <div className="aei-grid">
              <div className="aei-item"><div className="aei-label">Subject</div><div className="aei-value">{exam.subject}</div></div>
              <div className="aei-item"><div className="aei-label">Topic</div><div className="aei-value">{exam.topic}</div></div>
              <div className="aei-item"><div className="aei-label">Difficulty</div><div className="aei-value">{exam.difficulty}</div></div>
              <div className="aei-item"><div className="aei-label">Questions</div><div className="aei-value">{exam.question_count}</div></div>
              <div className="aei-item"><div className="aei-label">Marks each</div><div className="aei-value">{exam.marks_per_question}</div></div>
              <div className="aei-item">
                <div className="aei-label">Status</div>
                <div className="aei-value"><span className={`badge badge--${exam.status}`}>{exam.status}</span></div>
              </div>
            </div>
          </div>
        )}

        {error   && <div className="a-alert a-alert--error">⚠️ {error}</div>}
        {successMsg && <div className="a-alert a-alert--success">✅ {successMsg}</div>}

        {/* Generate button */}
        {!isPublished && (
          <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="abtn abtn--purple abtn--lg" onClick={handleGenerate} disabled={generating}>
              {generating ? '⏳ Generating...' : questions.length > 0 ? '🔄 Regenerate Questions' : '✨ Generate Questions with AI'}
            </button>
            {questions.length > 0 && (
              <button className="abtn abtn--success abtn--lg" onClick={handlePublish}>
                🚀 Publish Exam
              </button>
            )}
          </div>
        )}

        {/* Generating animation */}
        {generating && (
          <div className="a-generating" style={{ marginBottom: '24px' }}>
            <div className="a-generating-dots">
              <span /><span /><span />
            </div>
            <div style={{ marginTop: '16px', fontWeight: 600, color: '#1d4ed8' }}>
              AI is generating {exam?.question_count} questions...
            </div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '6px' }}>
              This usually takes 10–30 seconds
            </div>
          </div>
        )}

        {/* Questions preview */}
        {questions.length > 0 && (
          <>
            <div className="a-card-header" style={{ background: '#fff', borderRadius: '12px 12px 0 0', padding: '16px 20px', border: '1px solid #e2e8f0', borderBottom: 'none' }}>
              <span className="a-card-title">📋 {questions.length} Questions Preview</span>
              {isPublished && <span className={`badge badge--${exam?.status}`}>{exam?.status}</span>}
            </div>

            {questions.map((q, i) => (
              <div key={q.id} className="aq-card" style={{ borderRadius: i === questions.length - 1 ? '0 0 12px 12px' : '0', borderTop: 'none' }}>
                <div className="aq-number">Question {i + 1} of {questions.length}</div>
                <div className="aq-text">{q.question_text}</div>
                <div className="aq-options">
                  {OPTION_KEYS.map((key, idx) => (
                    <div key={key} className={`aq-option ${q.correct_answer === q[key] ? 'aq-option--correct' : ''}`}>
                      <span className="aq-option-label">{OPTION_LABELS[idx]}</span>
                      {q[key]}
                      {q.correct_answer === q[key] && <span style={{ marginLeft: 'auto' }}>✓</span>}
                    </div>
                  ))}
                </div>
                <div className="aq-explanation">
                  💡 <strong>Explanation:</strong> {q.explanation}
                </div>
              </div>
            ))}

            {!isPublished && (
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button className="abtn abtn--success abtn--lg" onClick={handlePublish}>
                  🚀 Publish Exam
                </button>
                <button className="abtn abtn--ghost" onClick={handleGenerate} disabled={generating}>
                  🔄 Regenerate
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default GenerateQuestions;
