import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

const MEDALS = ['🥇', '🥈', '🥉'];

const ExamLeaderboard = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveUpdate, setLiveUpdate] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get(`/admin/exams/${examId}/leaderboard`)
      .then(res => { setLeaderboard(res.data.leaderboard); setExam(res.data.exam); })
      .catch(() => setError('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [examId]);

  // Live updates via Socket.IO
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { withCredentials: true });
    socketRef.current.emit('join:exam', Number(examId));
    socketRef.current.on('leaderboard:update', (data) => {
      if (String(data.examId) === String(examId)) {
        setLeaderboard(data.leaderboard);
        setLiveUpdate(true);
        setTimeout(() => setLiveUpdate(false), 2000);
      }
    });
    return () => socketRef.current?.disconnect();
  }, [examId]);

  return (
    <AdminLayout pageName="Exam Leaderboard">
      <div className="ap-header">
        <div>
          <div className="ap-title">🏆 Leaderboard — {exam?.title}</div>
          <div className="ap-subtitle">{exam?.subject} · {exam?.topic} · {exam?.difficulty}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {liveUpdate && <span className="badge badge--active">🔴 LIVE</span>}
          <button className="abtn abtn--ghost" onClick={() => navigate(`/admin/exam/${examId}/students`)}>
            👥 View Students
          </button>
          <button className="abtn abtn--ghost" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
        </div>
      </div>

      {loading && <div className="a-loading"><div className="a-spinner" /></div>}
      {error && <div className="a-alert a-alert--error">{error}</div>}

      {!loading && leaderboard.length === 0 && (
        <div className="a-empty">
          <div className="a-empty-icon">📭</div>
          <div className="a-empty-text">No students have submitted yet</div>
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="a-card">
          <div className="a-card-header">
            <span className="a-card-title">Rankings</span>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{leaderboard.length} students</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Rank', 'Student', 'Email', 'Score', 'Percentage', 'Status', 'Report'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', color: '#475569', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr key={row.attempt_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontSize: '1rem' }}>
                      {row.rank_position && row.rank_position <= 3 ? MEDALS[row.rank_position - 1] : `#${row.rank_position || '—'}`}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.name}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>{row.email}</td>
                    <td style={{ padding: '12px 16px' }}><strong>{row.score}</strong> / {row.total_marks}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 700, color: row.percentage >= 60 ? '#16a34a' : '#dc2626' }}>
                        {row.percentage}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge badge--${row.status === 'submitted' || row.status === 'auto_submitted' ? 'completed' : 'scheduled'}`}>
                        {row.status}
                      </span>
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
        </div>
      )}
    </AdminLayout>
  );
};

export default ExamLeaderboard;
