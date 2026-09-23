import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

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
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'leaderboard'
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

  // Socket.IO for live leaderboard
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { withCredentials: true });
    socketRef.current.emit('join:exam', Number(examId));
    socketRef.current.on('leaderboard:update', (data) => {
      if (String(data.examId) === String(examId)) {
        setLeaderboard(data.leaderboard);
        setLiveUpdate(true);
        // Also refresh student list to get updated ranks/status
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

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const tabStyle = (tab) => ({
    padding: '10px 20px', border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.88rem',
    borderBottom: activeTab === tab ? '3px solid #2563eb' : '3px solid transparent',
    color: activeTab === tab ? '#2563eb' : '#64748b',
    background: 'transparent', transition: 'all 0.2s',
  });

  return (
    <AdminLayout pageName="Exam Results">
      <div className="ap-header">
        <div>
          <div className="ap-title">📊 Exam Results — {exam?.title}</div>
          <div className="ap-subtitle">{exam?.subject} · {exam?.topic} · {exam?.difficulty}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {liveUpdate && <span className="badge badge--active">🔴 LIVE</span>}
          <button className="abtn abtn--ghost" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && (
        <div className="as-grid" style={{ marginBottom: '20px' }}>
          <div className="as-card as-card--blue">
            <div className="as-icon">👥</div>
            <div className="as-value">{students.length}</div>
            <div className="as-label">Total Joined</div>
          </div>
          <div className="as-card as-card--green">
            <div className="as-icon">✅</div>
            <div className="as-value">{submitted.length}</div>
            <div className="as-label">Submitted</div>
          </div>
          <div className="as-card as-card--amber">
            <div className="as-icon">📊</div>
            <div className="as-value">{avgPct}%</div>
            <div className="as-label">Avg Score</div>
          </div>
          <div className="as-card as-card--purple">
            <div className="as-icon">🏆</div>
            <div className="as-value">{leaderboard.length}</div>
            <div className="as-label">On Leaderboard</div>
          </div>
          <div className="as-card as-card--red">
            <div className="as-icon">🎯</div>
            <div className="as-value">{exam?.total_marks}</div>
            <div className="as-label">Total Marks</div>
          </div>
        </div>
      )}

      {loading && <div className="a-loading"><div className="a-spinner" /></div>}
      {error && <div className="a-alert a-alert--error">{error}</div>}

      {/* Tabs */}
      <div className="a-card">
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 8px' }}>
          <button style={tabStyle('students')} onClick={() => setActiveTab('students')}>
            👥 Students ({students.length})
          </button>
          <button style={tabStyle('leaderboard')} onClick={() => setActiveTab('leaderboard')}>
            🏆 Live Leaderboard ({leaderboard.length})
          </button>
        </div>

        {/* Students tab */}
        {activeTab === 'students' && (
          <>
            {students.length === 0 && !loading ? (
              <div className="a-empty">
                <div className="a-empty-icon">📭</div>
                <div className="a-empty-text">No students have joined yet</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Rank', 'Student', 'Email', 'Score', '%', 'Started', 'Submitted', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', color: '#475569', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.attempt_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>{s.rank_position ? `#${s.rank_position}` : '—'}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>{s.email}</td>
                        <td style={{ padding: '12px 16px' }}>{s.score} / {s.total_marks}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, color: (s.percentage || 0) >= 60 ? '#16a34a' : '#dc2626' }}>
                            {s.percentage ?? '—'}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#64748b' }}>{formatDate(s.started_at)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#64748b' }}>{formatDate(s.submitted_at)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge badge--${['submitted', 'auto_submitted'].includes(s.status) ? 'completed' : 'scheduled'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {['submitted', 'auto_submitted'].includes(s.status) && (
                            <button className="abtn abtn--primary abtn--sm"
                              onClick={() => navigate(`/admin/report/${s.attempt_id}`)}>
                              📄 Report
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Live Leaderboard tab */}
        {activeTab === 'leaderboard' && (
          <>
            {leaderboard.length === 0 ? (
              <div className="a-empty">
                <div className="a-empty-icon">🏆</div>
                <div className="a-empty-text">No submissions yet</div>
                <div className="a-empty-sub">Leaderboard will update live as students submit</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0f172a' }}>
                      {['Rank', 'Student', 'Email', 'Score', 'Percentage', 'Submitted', 'Report'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row) => (
                      <tr key={row.attempt_id} style={{ borderBottom: '1px solid #f1f5f9', background: row.rank_position === 1 ? '#fffbeb' : row.rank_position === 2 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: '12px 16px', fontSize: '1.1rem' }}>
                          {row.rank_position <= 3 ? MEDALS[row.rank_position - 1] : `#${row.rank_position}`}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>{row.name}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>{row.email}</td>
                        <td style={{ padding: '12px 16px' }}><strong>{row.score}</strong> / {row.total_marks}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: row.percentage >= 60 ? '#16a34a' : '#dc2626' }}>
                            {row.percentage}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#64748b' }}>
                          {row.submitted_at ? new Date(row.submitted_at).toLocaleTimeString('en-IN') : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button className="abtn abtn--primary abtn--sm"
                            onClick={() => navigate(`/admin/report/${row.attempt_id}`)}>
                            📄 Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ExamStudents;
