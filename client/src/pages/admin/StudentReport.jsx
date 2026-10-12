import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import '../../styles/admin-report.css';

const StudentReport = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/admin/attempts/${attemptId}/report`)
      .then(res => setReport(res.data.report))
      .catch(err => setError(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  if (loading) return (
    <AdminLayout pageName="Student Report">
      <div className="loading-page"><div className="spinner" /></div>
    </AdminLayout>
  );
  if (error) return (
    <AdminLayout pageName="Student Report">
      <div className="alert alert-error">{error}</div>
    </AdminLayout>
  );
  if (!report) return null;

  const statusClass = ['submitted', 'auto_submitted'].includes(report.status) ? 'submitted' : 'started';

  return (
    <AdminLayout pageName="Student Report">
      <div className="rp-page">

        {/* ── Header ── */}
        <div className="rp-header">
          <div className="rp-header-left">
            <div className="rp-title">📄 Student Report</div>
            <div className="rp-subtitle">{report.examTitle} · {report.subject} · {report.topic}</div>
          </div>
          <div className="rp-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/exam/${report.examId}/leaderboard`)}>
              🏆 Leaderboard
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/exam/${report.examId}/students`)}>
              👥 All Students
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/dashboard')}>
              ← Dashboard
            </button>
          </div>
        </div>

        {/* ── Hero Banner ── */}
        <div className="rp-hero slide-up">
          <div className="rp-hero-left">
            <div className="rp-hero-avatar">{getInitials(report.studentName)}</div>
            <div className="rp-hero-name">{report.studentName}</div>
            <div className="rp-hero-email">{report.studentEmail}</div>
            <div className="rp-hero-exam">
              <span className="rp-hero-tag">{report.subject}</span>
              <span className="rp-hero-tag">{report.topic}</span>
              <span className="rp-hero-tag">{report.difficulty}</span>
              {report.stream && <span className="rp-hero-tag">{report.stream}</span>}
            </div>
          </div>
          <div className="rp-hero-right">
            <div className="rp-score-ring">
              <div className="rp-score-ring-val">{report.percentage}%</div>
              <div className="rp-score-ring-lbl">Score</div>
            </div>
            <div className="rp-hero-mini-stats">
              <div className="rp-hero-mini-stat">
                <div className="rp-hero-mini-label">Marks</div>
                <div className="rp-hero-mini-val">{report.score} / {report.totalMarks}</div>
              </div>
              <div className="rp-hero-mini-stat">
                <div className="rp-hero-mini-label">Rank</div>
                <div className="rp-hero-mini-val">{report.rank ? `#${report.rank}` : '—'}</div>
              </div>
              <div className="rp-hero-mini-stat">
                <div className="rp-hero-mini-label">Time</div>
                <div className="rp-hero-mini-val">{report.timeTaken || '—'}</div>
              </div>
              <div className="rp-hero-mini-stat">
                <div className="rp-hero-mini-label">Status</div>
                <div className="rp-hero-mini-val">
                  <span className={`rp-status-pill ${statusClass}`}>
                    {report.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="rp-stats-grid">
          {[
            { icon: '🎯', val: `${report.score}/${report.totalMarks}`, label: 'Score',      cls: 'rp-stat-card--blue'   },
            { icon: '📊', val: `${report.percentage}%`,                label: 'Percentage', cls: 'rp-stat-card--purple' },
            { icon: '🏆', val: report.rank ? `#${report.rank}` : '—', label: 'Rank',        cls: 'rp-stat-card--amber'  },
            { icon: '✅', val: report.correct,                          label: 'Correct',    cls: 'rp-stat-card--green'  },
            { icon: '❌', val: report.incorrect,                        label: 'Incorrect',  cls: 'rp-stat-card--red'    },
            { icon: '⏭',  val: report.unanswered,                      label: 'Unanswered', cls: 'rp-stat-card--orange' },
          ].map((s, i) => (
            <div key={s.label} className={`rp-stat-card ${s.cls} slide-up stagger-${i + 1}`}>
              <div className="rp-stat-icon">{s.icon}</div>
              <div className="rp-stat-value">{s.val}</div>
              <div className="rp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Info Cards ── */}
        <div className="rp-info-grid slide-up">
          {/* Student Info */}
          <div className="rp-card">
            <div className="rp-card-header">
              <span style={{ fontSize: '1rem' }}>👤</span>
              <span className="rp-card-title">Student Info</span>
            </div>
            <div className="rp-card-body">
              <div className="rp-field">
                <div className="rp-field-label">Full Name</div>
                <div className="rp-field-value">{report.studentName}</div>
              </div>
              <div className="rp-field">
                <div className="rp-field-label">Email Address</div>
                <div className="rp-field-value" style={{ fontSize: '0.85rem', color: '#64748b' }}>{report.studentEmail}</div>
              </div>
            </div>
          </div>

          {/* Exam Info */}
          <div className="rp-card">
            <div className="rp-card-header">
              <span style={{ fontSize: '1rem' }}>📋</span>
              <span className="rp-card-title">Exam Info</span>
            </div>
            <div className="rp-card-body">
              <div className="rp-field-grid">
                {[
                  ['Subject',    report.subject],
                  ['Topic',      report.topic],
                  ['Difficulty', report.difficulty],
                  ['Total Marks', report.totalMarks],
                  ['Questions',  report.totalQuestions],
                  ['Scheduled',  formatDate(report.scheduledDate)],
                ].map(([label, val]) => (
                  <div className="rp-field" key={label}>
                    <div className="rp-field-label">{label}</div>
                    <div className="rp-field-value">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Timing ── */}
        <div className="rp-card slide-up" style={{ marginBottom: '24px' }}>
          <div className="rp-card-header">
            <span style={{ fontSize: '1rem' }}>⏱</span>
            <span className="rp-card-title">Timing & Submission</span>
          </div>
          <div className="rp-card-body">
            <div className="rp-timing-row">
              {[
                ['Submitted At', formatDate(report.submittedAt)],
                ['Time Taken',   report.timeTaken || '—'],
                ['Status',       report.status.replace('_', ' ')],
              ].map(([label, val]) => (
                <div className="rp-field" key={label}>
                  <div className="rp-field-label">{label}</div>
                  <div className="rp-field-value">{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── AI Feedback ── */}
        {report.feedback && (
          <div className="rp-ai-card slide-up">
            <div className="rp-ai-header">
              <span style={{ fontSize: '1.1rem' }}>🤖</span>
              <span className="rp-ai-header-title">AI Performance Feedback</span>
              <span className="rp-ai-header-badge">Powered by Gemini</span>
            </div>
            <div className="rp-ai-body">
              <div className="rp-ai-overall">{report.feedback.overallFeedback}</div>
              <div className="rp-ai-cols">
                <div>
                  <div className="rp-ai-col-title green">✅ Strengths</div>
                  <ul className="rp-ai-list green">
                    {report.feedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="rp-ai-col-title red">⚠️ Weaknesses</div>
                  <ul className="rp-ai-list red">
                    {report.feedback.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="rp-ai-col-title blue">💡 Recommendations</div>
                  <ul className="rp-ai-list blue">
                    {report.feedback.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Answer Breakdown ── */}
        {report.answers?.length > 0 && (
          <div className="rp-answers-card">
            <div className="rp-answers-header">
              <span className="rp-answers-header-title">📋 Answer Breakdown</span>
              <span className="rp-answers-count">{report.answers.length} questions</span>
            </div>
            <div className="rp-answers-body">
              {report.answers.map((a, i) => {
                const status = !a.selected_answer ? 'unanswered' : a.is_correct ? 'correct' : 'incorrect';
                const badgeLabel = status === 'correct' ? '✓ Correct' : status === 'incorrect' ? '✗ Wrong' : '— Skipped';
                return (
                  <div key={a.question_id} className={`rp-answer-item ${status}`} style={{ animationDelay: `${i * 0.03}s` }}>
                    <div className="rp-answer-top">
                      <div className="rp-answer-qnum">Q{i + 1}</div>
                      <div className="rp-answer-qtext">{a.question_text}</div>
                      <span className={`rp-answer-result-badge ${status}`}>{badgeLabel}</span>
                    </div>
                    <div className="rp-answer-bottom">
                      <div className="rp-answer-given">
                        Student: <strong>{a.selected_answer || 'Not answered'}</strong>
                      </div>
                      {!a.is_correct && a.selected_answer && (
                        <div className="rp-answer-correct-val">
                          Correct: <strong>{a.correct_answer}</strong>
                        </div>
                      )}
                      <div className={`rp-answer-marks ${a.is_correct ? 'plus' : 'zero'}`}>
                        {a.is_correct ? `+${a.marks_awarded} marks` : '0 marks'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default StudentReport;
