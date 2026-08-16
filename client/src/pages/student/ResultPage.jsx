import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../services/api';

const ResultPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState(location.state?.result || null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState('');
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState('');

  useEffect(() => {
    if (result) return;
    api.get(`/attempts/${attemptId}/result`)
      .then(res => setResult(res.data.result))
      .catch(err => setError(err.response?.data?.message || 'Failed to load result'))
      .finally(() => setLoading(false));
  }, [attemptId, result]);

  useEffect(() => {
    // Poll for AI feedback (generated async)
    let attempts = 0;
    const maxAttempts = 6;
    const poll = async () => {
      try {
        const res = await api.get(`/attempts/${attemptId}/feedback`);
        setFeedback(res.data.feedback);
        setFeedbackLoading(false);
      } catch (err) {
        attempts++;
        if (err.response?.data?.code === 'NOT_READY' && attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setFeedbackError('AI feedback could not be generated right now.');
          setFeedbackLoading(false);
        }
      }
    };
    setTimeout(poll, 3000);
  }, [attemptId]);

  if (loading) return (
    <StudentLayout>
      <div className="loading-box"><span className="loading-spinner">⏳</span><p>Loading result...</p></div>
    </StudentLayout>
  );
  if (error) return (
    <StudentLayout><div className="error-box">{error}</div></StudentLayout>
  );
  if (!result) return null;

  const percentage = result.percentage ?? Math.round((result.score / result.totalMarks) * 100);
  const correct = result.answers?.filter(a => a.is_correct).length ?? 0;
  const incorrect = result.answers?.filter(a => !a.is_correct && a.selected_answer).length ?? 0;
  const unanswered = result.answers
    ? (result.answers.length - result.answers.filter(a => a.selected_answer).length)
    : 0;

  return (
    <StudentLayout>
      {/* Hero */}
      <div className="result-hero">
        <h1>🎉 Exam Completed!</h1>
        <p style={{ color: '#94a3b8', margin: '0 0 12px' }}>{result.title}</p>
        <div className="result-score">{result.score} / {result.totalMarks}</div>
        <div style={{ fontSize: '1.1rem', color: '#a3e635', marginTop: '4px' }}>{percentage}%</div>
      </div>

      {/* Stats */}
      <div className="result-stats-grid">
        <div className="result-stat-card">
          <div className="val" style={{ color: '#16a34a' }}>{correct}</div>
          <div className="lbl">Correct</div>
        </div>
        <div className="result-stat-card">
          <div className="val" style={{ color: '#dc2626' }}>{incorrect}</div>
          <div className="lbl">Incorrect</div>
        </div>
        <div className="result-stat-card">
          <div className="val" style={{ color: '#d97706' }}>{unanswered}</div>
          <div className="lbl">Unanswered</div>
        </div>
        {result.rank && (
          <div className="result-stat-card">
            <div className="val">#{result.rank}</div>
            <div className="lbl">Your Rank</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <button className="btn btn-primary" onClick={() => navigate(`/student/leaderboard/${attemptId}`)}>
          🏆 View Leaderboard
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/student/results')}>
          📊 All My Results
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/student/dashboard')}>
          🏠 Dashboard
        </button>
      </div>

      {/* AI Feedback */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>🤖 AI Performance Feedback</h2>
      {feedbackLoading ? (
        <div className="loading-box">
          <span className="loading-spinner">🔄</span>
          <p>Generating your personalized feedback...</p>
        </div>
      ) : feedbackError ? (
        <div className="error-box">
          {feedbackError}
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: '12px' }}
            onClick={async () => {
              setFeedbackError('');
              setFeedbackLoading(true);
              try {
                await api.post(`/attempts/${attemptId}/feedback/retry`);
              } catch (e) { /* ignore */ }
              // Poll again after triggering retry
              setTimeout(() => {
                let tries = 0;
                const poll = async () => {
                  try {
                    const r = await api.get(`/attempts/${attemptId}/feedback`);
                    setFeedback(r.data.feedback);
                    setFeedbackLoading(false);
                  } catch (e) {
                    tries++;
                    if (tries < 6) setTimeout(poll, 5000);
                    else { setFeedbackError('Still unavailable. Try again in a few minutes.'); setFeedbackLoading(false); }
                  }
                };
                poll();
              }, 3000);
            }}
          >
            Try Again
          </button>
        </div>
      ) : feedback ? (
        <>
          <div className="feedback-card">
            <h3>Overall Feedback</h3>
            <p style={{ color: '#374151', lineHeight: 1.7 }}>{feedback.overallFeedback}</p>
          </div>
          <div className="feedback-card">
            <h3>✅ Strengths</h3>
            <ul className="feedback-list">
              {feedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="feedback-card">
            <h3>⚠️ Weaknesses</h3>
            <ul className="feedback-list">
              {feedback.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
          <div className="feedback-card">
            <h3>💡 Recommendations</h3>
            <ul className="feedback-list">
              {feedback.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </>
      ) : null}

      {/* Answer breakdown */}
      {result.answers && result.answers.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '28px 0 12px' }}>📋 Answer Breakdown</h2>
          <div className="answer-breakdown">
            {result.answers.map((a, i) => {
              const status = !a.selected_answer ? 'unanswered' : a.is_correct ? 'correct' : 'incorrect';
              return (
                <div key={a.question_id} className={`answer-item ${status}`}>
                  <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>
                    Q{i + 1}. {a.question_text}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Your answer: <strong>{a.selected_answer || 'Not answered'}</strong>
                    {!a.is_correct && a.selected_answer && (
                      <> &nbsp;|&nbsp; Correct: <strong style={{ color: '#16a34a' }}>{a.correct_answer}</strong></>
                    )}
                    &nbsp;|&nbsp;
                    <span style={{ color: a.is_correct ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                      {a.is_correct ? `+${a.marks_awarded} marks` : '0 marks'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </StudentLayout>
  );
};

export default ResultPage;
