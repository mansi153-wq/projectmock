import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/student.css';

/* ─────────────────────────────────────────────────────────
   Warning Modal — shown on first violation
───────────────────────────────────────────────────────── */
const ViolationWarningModal = ({ onReturn }) => (
  <div style={{
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.65)',
    zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  }}>
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      padding: '32px 28px',
      maxWidth: '440px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      borderTop: '5px solid #d97706',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>⚠️</div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
        Warning 1 of 2
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
        You have left the exam window. Please return to the exam.<br /><br />
        <strong style={{ color: '#dc2626' }}>
          If you leave the exam again, your exam will be submitted automatically.
        </strong>
      </p>
      <button
        onClick={onReturn}
        style={{
          width: '100%',
          padding: '12px',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Return to Exam
      </button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   Auto-submitted Modal — shown on second violation
───────────────────────────────────────────────────────── */
const AutoSubmittedModal = () => (
  <div style={{
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  }}>
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      padding: '32px 28px',
      maxWidth: '440px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      borderTop: '5px solid #dc2626',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>🚫</div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
        Exam Automatically Submitted
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
        You have left the exam window twice.<br />
        Your exam has been submitted automatically.
      </p>
      <div style={{ marginTop: '16px' }}>
        <div style={{
          display: 'inline-block',
          width: '32px', height: '32px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spinSlow 0.8s linear infinite',
        }} />
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '10px' }}>
          Redirecting to your result...
        </p>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   Main ExamPage Component
───────────────────────────────────────────────────────── */
const ExamPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [exam, setExam] = useState(location.state?.exam || null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Anti-cheat state
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [showAutoSubmitted, setShowAutoSubmitted] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  const timerRef = useRef(null);
  const examEndRef = useRef(null);
  // Prevent double-firing of visibility events
  const violationInProgressRef = useRef(false);
  // Track whether exam is actively in progress
  const examActiveRef = useRef(false);
  // Track violation count in a ref so the event handler always sees current value
  const violationCountRef = useRef(0);

  // ── Load questions ─────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/attempts/${attemptId}/questions`);
        setQuestions(res.data.questions);
        setAnswers(res.data.savedAnswers || {});

        const examEnd = new Date(res.data.examEnd);
        examEndRef.current = examEnd;
        const now = new Date(res.data.serverTime);
        const remaining = Math.max(0, Math.floor((examEnd - now) / 1000));
        setTimeLeft(remaining);

        if (!exam && res.data) {
          setExam({ title: 'Examination' });
        }

        // Mark exam as active — start monitoring
        examActiveRef.current = true;
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    load();

    // Cleanup on unmount
    return () => {
      examActiveRef.current = false;
    };
  }, [attemptId]);

  // ── Anti-cheat: visibilitychange listener ──────────
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Only trigger when page becomes hidden
      if (document.visibilityState !== 'hidden') return;

      // Don't trigger if exam not active, already submitted, or violation already processing
      if (!examActiveRef.current) return;
      if (violationInProgressRef.current) return;
      if (submitting) return;

      // Debounce: ignore if same event fires within 300ms
      violationInProgressRef.current = true;
      setTimeout(() => { violationInProgressRef.current = false; }, 300);

      try {
        const res = await api.post(`/attempts/${attemptId}/violation`);

        if (res.data.status === 'warning') {
          // First violation
          const newCount = res.data.violationCount;
          violationCountRef.current = newCount;
          setViolationCount(newCount);
          setShowViolationWarning(true);
        } else if (res.data.status === 'auto_submitted') {
          // Second violation — exam submitted
          examActiveRef.current = false;
          violationCountRef.current = 2;
          setViolationCount(2);
          setShowViolationWarning(false);
          setShowAutoSubmitted(true);
          setSubmitting(true);

          // Redirect after 3 seconds
          setTimeout(() => {
            navigate(`/student/result/${attemptId}`);
          }, 3000);
        } else if (res.data.status === 'already_submitted') {
          // Exam was already submitted (race condition with timer)
          examActiveRef.current = false;
        }
      } catch (err) {
        // Network error — don't block the exam
        console.error('Violation API error:', err.message);
        violationInProgressRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptId, navigate, submitting]);

  // ── Countdown timer ────────────────────────────────
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timerClass = () => {
    if (timeLeft === null) return 'timer';
    if (timeLeft <= 60) return 'timer timer-critical';
    if (timeLeft <= 300) return 'timer timer-warning';
    return 'timer';
  };

  const saveAnswer = useCallback(async (questionId, selectedAnswer) => {
    setSaveStatus('Saving...');
    try {
      await api.post(`/attempts/${attemptId}/answers`, { questionId, selectedAnswer });
      setSaveStatus('Saved ✓');
    } catch {
      setSaveStatus('Save failed');
    }
    setTimeout(() => setSaveStatus(''), 2000);
  }, [attemptId]);

  const handleSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    saveAnswer(questionId, option);
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    examActiveRef.current = false; // Stop violation monitoring
    setSubmitting(true);
    try {
      const res = await api.post(`/attempts/${attemptId}/submit`);
      navigate(`/student/result/${attemptId}`, { state: { result: res.data.result } });
    } catch {
      navigate(`/student/result/${attemptId}`);
    }
  };

  const handleManualSubmit = async () => {
    setShowConfirm(false);
    examActiveRef.current = false; // Stop violation monitoring
    setSubmitting(true);
    try {
      const res = await api.post(`/attempts/${attemptId}/submit`);
      navigate(`/student/result/${attemptId}`, { state: { result: res.data.result } });
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setSubmitting(false);
      examActiveRef.current = true; // Re-enable if submission failed
    }
  };

  // ── Loading / Error states ─────────────────────────
  if (loading) return (
    <div className="loading-box" style={{ padding: '80px', textAlign: 'center' }}>
      <span className="loading-spinner">⏳</span>
      <p>Loading examination...</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="error-box">{error}</div>
      <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => navigate('/student/dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter(k => answers[k]).length;

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '16px' }}>

      {/* ── Violation Warning Modal (1st violation) ── */}
      {showViolationWarning && (
        <ViolationWarningModal onReturn={() => setShowViolationWarning(false)} />
      )}

      {/* ── Auto-submitted Modal (2nd violation) ── */}
      {showAutoSubmitted && <AutoSubmittedModal />}

      <div className="exam-page">
        {/* Violation counter indicator */}
        {violationCount === 1 && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '8px 14px',
            marginBottom: '12px',
            fontSize: '0.82rem',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            ⚠️ <strong>Warning 1/2:</strong> You left the exam window once. Leaving again will auto-submit your exam.
          </div>
        )}

        {/* Top bar */}
        <div className="exam-top-bar">
          <h2>{exam?.title || 'Examination'}</h2>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginRight: '8px' }}>
              {answeredCount}/{questions.length} answered
            </span>
            <span className={timerClass()}>⏱ {formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question navigator */}
        <div className="q-navigator">
          {questions.map((q, i) => (
            <button
              key={q.id}
              className={`q-nav-btn ${answers[q.id] ? 'answered' : ''} ${i === currentIdx ? 'current' : ''}`}
              onClick={() => setCurrentIdx(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {saveStatus && <div className="save-status">{saveStatus}</div>}

        {/* Question card */}
        {currentQ && (
          <div className="question-card">
            <div className="question-number">Question {currentIdx + 1} of {questions.length}</div>
            <div className="question-text">{currentQ.question_text}</div>
            <ul className="options-list">
              {['option_a', 'option_b', 'option_c', 'option_d'].map((key) => (
                <li
                  key={key}
                  className={`option-item ${answers[currentQ.id] === currentQ[key] ? 'selected' : ''}`}
                  onClick={() => !submitting && handleSelect(currentQ.id, currentQ[key])}
                >
                  <input type="radio" readOnly checked={answers[currentQ.id] === currentQ[key]} />
                  {currentQ[key]}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div className="question-nav-row">
          <button className="btn btn-secondary" disabled={currentIdx === 0 || submitting} onClick={() => setCurrentIdx(i => i - 1)}>
            ← Previous
          </button>
          {currentIdx < questions.length - 1 ? (
            <button className="btn btn-primary" disabled={submitting} onClick={() => setCurrentIdx(i => i + 1)}>
              Next →
            </button>
          ) : (
            <button className="btn btn-success" onClick={() => setShowConfirm(true)} disabled={submitting}>
              ✅ Submit Exam
            </button>
          )}
        </div>

        {currentIdx < questions.length - 1 && (
          <div style={{ textAlign: 'right', marginTop: '16px' }}>
            <button className="btn btn-danger btn-sm" onClick={() => setShowConfirm(true)} disabled={submitting}>
              Submit Exam
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Submit Examination?</h3>
            <p>You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.</p>
            <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>
              You will not be able to change your answers after submission.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleManualSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
