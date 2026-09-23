import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

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

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  if (loading) return <AdminLayout pageName="Student Report"><div className="a-loading"><div className="a-spinner" /></div></AdminLayout>;
  if (error) return <AdminLayout pageName="Student Report"><div className="a-alert a-alert--error">{error}</div></AdminLayout>;
  if (!report) return null;

  return (
    <AdminLayout pageName="Student Report">
      <div className="ap-header">
        <div>
          <div className="ap-title">📄 Student Report</div>
          <div className="ap-subtitle">{report.studentName} — {report.examTitle}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="abtn abtn--ghost" onClick={() => navigate(`/admin/exam/${report.examId}/leaderboard`)}>
            🏆 Leaderboard
          </button>
          <button className="abtn abtn--ghost" onClick={() => navigate(`/admin/exam/${report.examId}/students`)}>
            👥 All Students
          </button>
          <button className="abtn abtn--ghost" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
        </div>
      </div>

      {/* Student + Exam Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="a-card">
          <div className="a-card-header"><span className="a-card-title">👤 Student Info</span></div>
          <div className="a-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[['Name', report.studentName], ['Email', report.studentEmail]].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="a-card">
          <div className="a-card-header"><span className="a-card-title">📋 Exam Info</span></div>
          <div className="a-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[['Subject', report.subject], ['Topic', report.topic], ['Difficulty', report.difficulty], ['Total Marks', report.totalMarks]].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Score Summary */}
      <div className="as-grid" style={{ marginBottom: '24px' }}>
        <div className="as-card as-card--blue">
          <div className="as-icon">🎯</div>
          <div className="as-value">{report.score}/{report.totalMarks}</div>
          <div className="as-label">Score</div>
        </div>
        <div className="as-card as-card--purple">
          <div className="as-icon">📊</div>
          <div className="as-value">{report.percentage}%</div>
          <div className="as-label">Percentage</div>
        </div>
        <div className="as-card as-card--amber">
          <div className="as-icon">🏆</div>
          <div className="as-value">{report.rank ? `#${report.rank}` : '—'}</div>
          <div className="as-label">Rank</div>
        </div>
        <div className="as-card as-card--green">
          <div className="as-icon">✅</div>
          <div className="as-value">{report.correct}</div>
          <div className="as-label">Correct</div>
        </div>
        <div className="as-card as-card--red">
          <div className="as-icon">❌</div>
          <div className="as-value">{report.incorrect}</div>
          <div className="as-label">Incorrect</div>
        </div>
        <div className="as-card" style={{ borderLeftColor: '#d97706' }}>
          <div className="as-icon">⏭</div>
          <div className="as-value">{report.unanswered}</div>
          <div className="as-label">Unanswered</div>
        </div>
      </div>

      {/* Time & Submission info */}
      <div className="a-card" style={{ marginBottom: '24px' }}>
        <div className="a-card-header"><span className="a-card-title">⏱ Timing</span></div>
        <div className="a-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '16px' }}>
            {[['Submitted At', formatDate(report.submittedAt)], ['Time Taken', report.timeTaken || '—'], ['Status', report.status]].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Feedback */}
      {report.feedback && (
        <div className="a-card" style={{ marginBottom: '24px' }}>
          <div className="a-card-header"><span className="a-card-title">🤖 AI Performance Feedback</span></div>
          <div className="a-card-body">
            <p style={{ lineHeight: 1.7, marginBottom: '16px' }}>{report.feedback.overallFeedback}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: '8px' }}>✅ Strengths</div>
                <ul style={{ paddingLeft: '16px', lineHeight: 1.8, color: '#374151', fontSize: '0.88rem' }}>
                  {report.feedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>⚠️ Weaknesses</div>
                <ul style={{ paddingLeft: '16px', lineHeight: 1.8, color: '#374151', fontSize: '0.88rem' }}>
                  {report.feedback.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: '8px' }}>💡 Recommendations</div>
                <ul style={{ paddingLeft: '16px', lineHeight: 1.8, color: '#374151', fontSize: '0.88rem' }}>
                  {report.feedback.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Breakdown */}
      {report.answers?.length > 0 && (
        <div className="a-card">
          <div className="a-card-header"><span className="a-card-title">📋 Answer Breakdown</span></div>
          <div className="a-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {report.answers.map((a, i) => {
              const status = !a.selected_answer ? 'unanswered' : a.is_correct ? 'correct' : 'incorrect';
              const colors = { correct: '#16a34a', incorrect: '#dc2626', unanswered: '#d97706' };
              return (
                <div key={a.question_id} style={{ border: `1px solid #e2e8f0`, borderLeft: `4px solid ${colors[status]}`, borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>Q{i + 1}. {a.question_text}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Student answered: <strong>{a.selected_answer || 'Not answered'}</strong>
                    {!a.is_correct && a.selected_answer && (
                      <> &nbsp;|&nbsp; Correct: <strong style={{ color: '#16a34a' }}>{a.correct_answer}</strong></>
                    )}
                    &nbsp;|&nbsp;
                    <span style={{ color: colors[status], fontWeight: 600 }}>
                      {a.is_correct ? `+${a.marks_awarded} marks` : '0 marks'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default StudentReport;
