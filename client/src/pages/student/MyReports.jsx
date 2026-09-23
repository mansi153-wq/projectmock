import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../services/api';

const MyReports = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student/my-results')
      .then(res => setResults(res.data.results))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <StudentLayout>
      <h1 className="page-title">📊 My Reports</h1>
      <p className="page-subtitle">Your performance report for every exam you've attempted.</p>

      {loading && <div className="loading-box"><span className="loading-spinner">⏳</span><p>Loading reports...</p></div>}
      {error && <div className="error-box">{error}</div>}
      {!loading && results.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
          <p>You haven't completed any exams yet.</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/student/join')}>
            Join an Exam
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {results.map(r => {
          const pct = Math.round((r.score / r.total_marks) * 100);
          const isSubmitted = r.status === 'submitted' || r.status === 'auto_submitted';
          const resultColor = pct >= 60 ? 'var(--success)' : 'var(--danger)';
          return (
            <div
              key={r.id}
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${resultColor}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>{r.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.subject} · {r.topic} · <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{r.difficulty}</span></div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '3px' }}>{formatDate(r.submitted_at)}</div>
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: resultColor }}>{r.score}/{r.total_marks}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Score</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: resultColor }}>{pct}%</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Percentage</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{r.rank_position ? `#${r.rank_position}` : '—'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rank</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {isSubmitted && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/student/result/${r.id}`)}>
                        📄 Full Report
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/student/leaderboard/${r.id}`)}>
                        🏆 Leaderboard
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </StudentLayout>
  );
};

export default MyReports;
