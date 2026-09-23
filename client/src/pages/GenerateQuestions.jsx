import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { useToast } from '../components/ui/Toast';
import api from '../services/api';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_KEYS   = ['option_a', 'option_b', 'option_c', 'option_d'];
const GEN_MESSAGES  = ['Analyzing topic...', 'Crafting questions...', 'Generating options...', 'Validating answers...', 'Almost done...'];

const GenerateQuestions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingExam, setLoadingExam] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState('');

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
        toast(err.response?.data?.message || 'Failed to load exam', 'error');
      } finally { setLoadingExam(false); }
    };
    load();
  }, [examId]);

  const handleGenerate = async () => {
    setGenerating(true); setQuestions([]);
    let msgIdx = 0;
    setGenMsg(GEN_MESSAGES[0]);
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % GEN_MESSAGES.length;
      setGenMsg(GEN_MESSAGES[msgIdx]);
    }, 4000);

    try {
      await api.post(`/exams/${examId}/generate`);
      const qRes = await api.get(`/exams/${examId}/questions-admin`);
      setQuestions(qRes.data.questions);
      const eRes = await api.get(`/exams/${examId}`);
      setExam(eRes.data.exam);
      toast(`${qRes.data.questions.length} questions generated!`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Generation failed. Try again.', 'error');
    } finally {
      clearInterval(msgInterval);
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    try {
      await api.post(`/exams/${examId}/publish`);
      toast('Exam published and scheduled!', 'success');
      setTimeout(() => navigate('/admin/dashboard'), 1000);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to publish', 'error');
    }
  };

  if (loadingExam) return (
    <AdminLayout pageName="Generate Questions">
      <div className="loading-page"><div className="spinner" /></div>
    </AdminLayout>
  );

  const isPublished = ['scheduled', 'active', 'completed'].includes(exam?.status);

  return (
    <AdminLayout pageName="Generate Questions">
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <div className="page-title slide-up">✨ Generate Questions</div>
            <div className="page-subtitle slide-up stagger-1">{exam?.title}</div>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
        </div>

        {/* Exam info — glass card */}
        {exam && (
          <div className="card-glass slide-up stagger-2" style={{ padding: '18px 22px', marginBottom: 22 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 14 }}>
              {[['Subject', exam.subject], ['Topic', exam.topic], ['Difficulty', exam.difficulty], ['Questions', exam.question_count], ['Marks each', exam.marks_per_question], ['Status', exam.status]].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-subtle)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {label === 'Status' ? <span className={`badge badge-${val}`}>{val}</span> : val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isPublished && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <button
              className="btn btn-accent btn-lg"
              onClick={handleGenerate}
              disabled={generating}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {generating ? (
                <><div className="dots-loader"><span/><span/><span/></div> Generating...</>
              ) : questions.length > 0 ? '🔄 Regenerate' : '✨ Generate with AI'}
            </button>
            {questions.length > 0 && (
              <button className="btn btn-success btn-lg" onClick={handlePublish}>
                🚀 Publish Exam
              </button>
            )}
          </div>
        )}

        {/* Generating animation */}
        {generating && (
          <div className="generating-box" style={{ marginBottom: 24 }}>
            <div className="dots-loader" style={{ justifyContent: 'center' }}><span/><span/><span/></div>
            <div className="generating-msg">{genMsg}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: 8 }}>
              This usually takes 10–30 seconds
            </div>
          </div>
        )}

        {/* Questions preview */}
        {questions.length > 0 && (
          <>
            <div className="card-header" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: '16px 22px' }}>
              <span className="card-title">📋 {questions.length} Questions Preview</span>
              {isPublished && <span className={`badge badge-${exam?.status}`}>{exam?.status}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {questions.map((q, i) => (
                <div key={q.id} className="qp-card slide-up"
                  style={{ animationDelay: `${i * 0.05}s`, borderRadius: i === questions.length - 1 ? '0 0 var(--radius-lg) var(--radius-lg)' : 0, borderTop: i === 0 ? '1px solid var(--border)' : 'none' }}>
                  <div className="qp-num">Question {i + 1} of {questions.length}</div>
                  <div className="qp-text">{q.question_text}</div>
                  <div className="qp-options">
                    {OPTION_KEYS.map((key, idx) => (
                      <div key={key} className={`qp-option ${q.correct_answer === q[key] ? 'correct' : ''}`}>
                        <span className="qp-option-label">{OPTION_LABELS[idx]}</span>
                        {q[key]}
                        {q.correct_answer === q[key] && <span style={{ marginLeft: 'auto' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                  <div className="qp-explanation">
                    <span>💡</span>
                    <span><strong>Explanation:</strong> {q.explanation}</span>
                  </div>
                </div>
              ))}
            </div>

            {!isPublished && (
              <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                <button className="btn btn-success btn-lg" onClick={handlePublish}>🚀 Publish Exam</button>
                <button className="btn btn-ghost" onClick={handleGenerate} disabled={generating}>🔄 Regenerate</button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default GenerateQuestions;
