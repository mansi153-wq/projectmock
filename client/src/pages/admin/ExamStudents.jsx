import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import '../../styles/admin-report.css';

const MEDALS = ['🥇', '🥈', '🥉'];

const ExamStudents = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [exam, setExam] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveUpdate, setLiveUpdate] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const socketRef = useRef(null);

  const loadData = () => {
    Promise.all([
      api.get(`/admin/exams/${examId}/students`),
      api.get(`/admin/exams/${examId}/leaderboard`),
    ]).then(([studentsRes, lbRes]) => {
      setStudents(studentsRes.data.students);
      setExam(studentsRes.data.exam);
      setLeaderboard(lbRes.data.leaderboard);
    }).catch(() => setError('Failed to load exam data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [examId]);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { withCredentials: true });
    socketRef.current.emit('join:exam', Number(examId));
    socketRef.current.on('leaderboard:update', (data) => {
      if (String(data.examId) === String(examId)) {
        setLeaderboard(data.leaderboard);
        setLiveUpdate(true);
        api.get(`/admin/exams/${examId}/students`)
          .then(res => setStudents(res.data.students))
          .catch(() => {});
        setTimeout(() => setLiveUpdate(false), 2000);
      }
    });
    return () => socketRef.current?.disconnect();
  }, [examId]);

  const submitted = students.filter(s => ['submitted', 'auto_submitted'].includes(s.status));
  const avgPct = submitted.length > 0
    ? Math.round(submitted.reduce((sum, s) => sum + (s.percentage || 0), 0) / submitted.length)
    : 0;
  const topScore = submitted.length > 0
    ? Math.max(...submitted.map(s => s.score || 0))
    : 0;

  const formatDate = (d) => d
    ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  const formatTime = (d) => d
    ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <AdminLayout pageName="Exam Results">
      <div className="es-page">

        {/* ── Banner ── */}
        <div className="es-banner slide-up">
          <div>
            <div className="es-banner-title">📊 {exam?.title || 'Exam Results'}</div>
            <div className="es-banner-sub">
              {exam?.subject} · {exam?.topic} · {exam?.difficulty} · {exam?.question_count} questions · {exam?.total_marks} marks
            </div>
          </div>
          <div className="es-banner-right">
            {liveUpdate && (
              <div className="es-live-badge">
                <div className="es-live-dot" />
                LIVE UPDATE
              </div>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/dashboard')}>
              ← Dashboard
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        {!loading && (
          <div className="es-stats">
            {[
              { icon: '👥', val: students.length,   label: 'Total Joined',    cls: 'es-stat--blue'   },
              { icon: '✅', val: submitted.length,   label: 'Submitted',       cls: 'es-stat--green'  },
              { icon: '⏳', val: students.length - submitted.length, label: 'In Progress', cls: 'es-stat--amber' },
              { icon: '📊', val: `${avgPct}%`,       label: 'Avg Score',       cls: 'es-stat--purple' },
              { icon: '🏆', val: topScore,            label: 'Top Score',       cls: 'es-stat--red'    },
            ].map((s, i) => (
              <div key={s.label} className={`es-stat ${s.cls} slide-up stagger-${i + 1}`}>
                <div className="es-stat-icon">{s.icon}</div>
                <div className="es-stat-value">{s.val}</div>
                <div className="es-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading && <div className="loading-page"><div className="spinner" /></div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Tabs ── */}
        {!loading && (
          <div className="es-tabs-wrap slide-up stagger-2">
            {/* Tab Bar */}
            <div className="es-tab-bar">
              <button
                className={`es-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                👥 Students
                <span className="es-tab-badge">{students.length}</span>
              </button>
              <button
                className={`es-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('leaderboard')}
              >
                🏆 Live Leaderboard
                <span className="es-tab-badge">{leaderboard.length}</span>
              </button>
            </div>

            {/* ── Students Tab ── */}
            {activeTab === 'students' && (
              <>
                {students.length === 0 ? (
                  <div className="es-empty">
                    <div className="es-empty-icon">📭</div>
                    <div className="es-empty-title">No students have joined yet</div>
                    <div className="es-empty-sub">Students will appear here once they join using the exam code</div>
                  </div>
                ) : (
                  <div className="es-table-wrap">
                    <table className="es-table">
                      <thead>
                        <tr>
                          {['Rank', 'Student', 'Email', 'Score', 'Performance', 'Started', 'Submitted', 'Status', 'Actions'].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(s => {
                          const pct = s.percentage ?? 0;
                          const isSubmitted = ['submitted', 'auto_submitted'].includes(s.status);
                          return (
                            <tr key={s.attempt_id}>
                              <td>
                                <span className="es-rank">
                                  {s.rank_position ? `#${s.rank_position}` : '—'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, color: '#0f172a' }}>{s.name}</td>
                              <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{s.email}</td>
                              <td>
                                <strong>{isSubmitted ? s.score : '—'}</strong>
                                {isSubmitted && <span style={{ color: '#94a3b8' }}> / {s.total_marks}</span>}
                              </td>
                              <td>
                                {isSubmitted ? (
                                  <div className="es-score-bar-wrap">
                                    <div className="es-score-bar-bg">
                                      <div
                                        className={`es-score-bar-fill ${pct >= 60 ? 'good' : ''}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="es-score-pct">{pct}%</span>
                                  </div>
                                ) : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>}
                              </td>
                              <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{formatDate(s.started_at)}</td>
                              <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{formatDate(s.submitted_at)}</td>
                              <td>
                                <span className={`es-badge ${s.status}`}>
                                  {s.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td>
                                {isSubmitted && (
                                  <button
                                    className="es-report-btn"
                                    onClick={() => navigate(`/admin/report/${s.attempt_id}`)}
                                  >
                                    📄 Report
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── Live Leaderboard Tab ── */}
            {activeTab === 'leaderboard' && (
              <>
                {leaderboard.length === 0 ? (
                  <div className="es-empty">
                    <div className="es-empty-icon">🏆</div>
                    <div className="es-empty-title">No submissions yet</div>
                    <div className="es-empty-sub">Leaderboard updates live as students submit their answers</div>
                  </div>
                ) : (
                  <div className="es-table-wrap">
                    <table className="es-table lb">
                      <thead>
                        <tr>
                          {['Rank', 'Student', 'Email', 'Score', 'Performance', 'Submitted', 'Actions'].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((row) => {
                          const pct = row.percentage ?? Math.round((row.score / row.total_marks) * 100);
                          const rankClass = row.rank_position === 1 ? 'rank-1' : row.rank_position === 2 ? 'rank-2' : row.rank_position === 3 ? 'rank-3' : '';
                          return (
                            <tr key={row.attempt_id} className={rankClass}>
                              <td>
                                <span className={`es-rank ${row.rank_position <= 3 ? 'medal' : ''}`}>
                                  {row.rank_position <= 3 ? MEDALS[row.rank_position - 1] : `#${row.rank_position}`}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700, color: '#0f172a' }}>{row.name}</td>
                              <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{row.email}</td>
                              <td>
                                <strong>{row.score}</strong>
                                <span style={{ color: '#94a3b8' }}> / {row.total_marks}</span>
                              </td>
                              <td>
                                <div className="es-score-bar-wrap">
                                  <div className="es-score-bar-bg">
                                    <div
                                      className={`es-score-bar-fill ${pct >= 60 ? 'good' : ''}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="es-score-pct">{pct}%</span>
                                </div>
                              </td>
                              <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                {formatTime(row.submitted_at)}
                              </td>
                              <td>
                                <button
                                  className="es-report-btn"
                                  onClick={() => navigate(`/admin/report/${row.attempt_id}`)}
                                >
                                  📄 Report
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default ExamStudents;
