import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../services/api';

/* ── Marksheet download (print-to-PDF) ─────────────── */
const downloadMarksheet = (result, feedback, correct, incorrect, unanswered, percentage) => {
  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }) : '—';

  const answersHtml = result.answers?.map((a, i) => {
    const status = !a.selected_answer ? 'unanswered' : a.is_correct ? 'correct' : 'incorrect';
    const colors = { correct: '#15803d', incorrect: '#dc2626', unanswered: '#d97706' };
    const bg = { correct: '#f0fdf4', incorrect: '#fef2f2', unanswered: '#fffbeb' };
    const border = { correct: '#16a34a', incorrect: '#dc2626', unanswered: '#d97706' };
    return `
      <div style="border:1px solid #e2e8f0;border-left:4px solid ${border[status]};border-radius:6px;padding:12px 14px;margin-bottom:10px;background:${bg[status]};">
        <div style="font-weight:600;margin-bottom:4px;font-size:13px;">Q${i + 1}. ${a.question_text}</div>
        <div style="font-size:12px;color:#475569;">
          Your answer: <strong>${a.selected_answer || 'Not answered'}</strong>
          ${!a.is_correct && a.selected_answer ? ` &nbsp;|&nbsp; Correct: <strong style="color:#15803d;">${a.correct_answer}</strong>` : ''}
          &nbsp;|&nbsp;
          <span style="font-weight:700;color:${colors[status]};">${a.is_correct ? `+${a.marks_awarded} marks` : '0 marks'}</span>
        </div>
      </div>`;
  }).join('') || '';

  const feedbackHtml = feedback ? `
    <div style="margin-top:24px;">
      <h3 style="font-size:15px;color:#1e293b;margin-bottom:8px;">🤖 AI Performance Feedback</h3>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-bottom:12px;">
        <p style="font-size:13px;line-height:1.7;color:#1e293b;">${feedback.overallFeedback}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">
          <div style="font-weight:700;color:#16a34a;margin-bottom:6px;font-size:12px;">✅ STRENGTHS</div>
          <ul style="padding-left:16px;font-size:12px;line-height:1.8;color:#374151;">${feedback.strengths?.map(s => `<li>${s}</li>`).join('') || ''}</ul>
        </div>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;">
          <div style="font-weight:700;color:#dc2626;margin-bottom:6px;font-size:12px;">⚠️ WEAKNESSES</div>
          <ul style="padding-left:16px;font-size:12px;line-height:1.8;color:#374151;">${feedback.weaknesses?.map(w => `<li>${w}</li>`).join('') || ''}</ul>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;">
          <div style="font-weight:700;color:#2563eb;margin-bottom:6px;font-size:12px;">💡 RECOMMENDATIONS</div>
          <ul style="padding-left:16px;font-size:12px;line-height:1.8;color:#374151;">${feedback.recommendations?.map(r => `<li>${r}</li>`).join('') || ''}</ul>
        </div>
      </div>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Marksheet — ${result.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #fff; color: #1e293b; padding: 32px; font-size: 13px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="text-align:center;border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:24px;">
    <div style="font-size:22px;font-weight:800;color:#2563eb;">🎯 AI Mock Test Platform</div>
    <div style="font-size:16px;font-weight:700;margin-top:6px;color:#1e293b;">MARKSHEET / RESULT REPORT</div>
    <div style="font-size:12px;color:#64748b;margin-top:4px;">Generated on ${new Date().toLocaleString('en-IN')}</div>
  </div>

  <!-- Student + Exam Info -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;">
      <div style="font-weight:700;color:#2563eb;margin-bottom:10px;font-size:13px;">EXAM DETAILS</div>
      <table style="width:100%;font-size:12px;">
        <tr><td style="color:#64748b;padding:3px 0;width:110px;">Exam Title</td><td style="font-weight:600;">${result.title}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0;">Subject</td><td style="font-weight:600;">${result.subject}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0;">Topic</td><td style="font-weight:600;">${result.topic}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0;">Difficulty</td><td style="font-weight:600;">${result.difficulty}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0;">Submitted</td><td style="font-weight:600;">${formatDate(result.submittedAt)}</td></tr>
      </table>
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;">
      <div style="font-weight:700;color:#2563eb;margin-bottom:10px;font-size:13px;">PERFORMANCE SUMMARY</div>
      <table style="width:100%;font-size:12px;">
        <tr><td style="color:#64748b;padding:3px 0;width:110px;">Score</td><td style="font-weight:700;font-size:15px;color:#1e293b;">${result.score} / ${result.totalMarks}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0;">Percentage</td><td style="font-weight:700;font-size:15px;color:${percentage >= 60 ? '#16a34a' : '#dc2626'};">${percentage}%</td></tr>
        <tr><td style="color:#64748b;padding:3px 0;">Rank</td><td style="font-weight:700;">${result.rank ? '#' + result.rank : '—'}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0;">Correct</td><td style="color:#16a34a;font-weight:600;">${correct}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0;">Incorrect</td><td style="color:#dc2626;font-weight:600;">${incorrect}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0;">Unanswered</td><td style="color:#d97706;font-weight:600;">${unanswered}</td></tr>
      </table>
    </div>
  </div>

  <!-- Score bar -->
  <div style="margin-bottom:24px;">
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:4px;">
      <span>Score: ${result.score} / ${result.totalMarks}</span><span>${percentage}%</span>
    </div>
    <div style="background:#e2e8f0;border-radius:20px;height:10px;overflow:hidden;">
      <div style="background:${percentage >= 60 ? '#16a34a' : '#dc2626'};height:10px;width:${percentage}%;border-radius:20px;"></div>
    </div>
  </div>

  ${feedbackHtml}

  <!-- Answer Breakdown -->
  <div style="margin-top:24px;">
    <h3 style="font-size:15px;color:#1e293b;margin-bottom:12px;">📋 Answer Breakdown</h3>
    ${answersHtml}
  </div>

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;">
    This is a computer-generated marksheet from AI Mock Test Platform. Attempt ID: ${result.attemptId}
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
};

/* ── Component ─────────────────────────────────────── */
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
        <button
          className="btn btn-success"
          onClick={() => downloadMarksheet(result, feedback, correct, incorrect, unanswered, percentage)}
        >
          ⬇️ Download Marksheet
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
              try { await api.post(`/attempts/${attemptId}/feedback/retry`); } catch (e) { }
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
            <ul className="feedback-list">{feedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div className="feedback-card">
            <h3>⚠️ Weaknesses</h3>
            <ul className="feedback-list">{feedback.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
          <div className="feedback-card">
            <h3>💡 Recommendations</h3>
            <ul className="feedback-list">{feedback.recommendations?.map((r, i) => <li key={i}>{r}</li>)}</ul>
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
