import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/student.css';

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

  const timerRef = useRef(null);
  const examEndRef = useRef(null);

  // Load questions on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/attempts/${attemptId}/questions`);
        setQuestions(res.data.questions);
        setAnswers(res.data.savedAnswers || {});

        // Set timer from server
        const examEnd = new Date(res.data.examEnd);
        examEndRef.current = examEnd;
        const now = new Date(res.data.serverTime);
        const remaining = Math.max(0, Math.floor((examEnd - now) / 1000));
        setTimeLeft(remaining);

        // Store exam info if not already
        if (!exam && res.data) {
          setExam({ title: 'Examination' });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

  // Countdown timer
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
    setSubmitting(true);
    try {
      const res = await api.post(`/attempts/${attemptId}/submit`);
      navigate(`/student/result/${attemptId}`, { state: { result: res.data.result } });
    } catch (err) {
      // Even if submit fails, show result page
      navigate(`/student/result/${attemptId}`);
    }
  };

  const handleManualSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const res = await api.post(`/attempts/${attemptId}/submit`);
      navigate(`/student/result/${attemptId}`, { state: { result: res.data.result } });
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setSubmitting(false);
    }
  };

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
      <div className="exam-page">

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

        {/* Save status */}
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
                  onClick={() => handleSelect(currentQ.id, currentQ[key])}
                >
                  <input
                    type="radio"
                    readOnly
                    checked={answers[currentQ.id] === currentQ[key]}
                  />
                  {currentQ[key]}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div className="question-nav-row">
          <button
            className="btn btn-secondary"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(i => i - 1)}
          >
            ← Previous
          </button>
          {currentIdx < questions.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setCurrentIdx(i => i + 1)}>
              Next →
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
            >
              ✅ Submit Exam
            </button>
          )}
        </div>

        {/* Submit from any question */}
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
