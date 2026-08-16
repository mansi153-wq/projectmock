import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MEDALS = ['🥇', '🥈', '🥉'];

const LeaderboardPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [leaderboard, setLeaderboard] = useState([]);
  const [examId, setExamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveUpdate, setLiveUpdate] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get(`/attempts/${attemptId}/leaderboard`)
      .then(res => {
        setLeaderboard(res.data.leaderboard);
        setExamId(res.data.examId);
      })
      .catch(() => setError('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  // Connect Socket.IO for live updates
  useEffect(() => {
    if (!examId) return;

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });

    socketRef.current.emit('join:exam', examId);

    socketRef.current.on('leaderboard:update', (data) => {
      if (data.examId === examId) {
        setLeaderboard(data.leaderboard);
        setLiveUpdate(true);
        setTimeout(() => setLiveUpdate(false), 2000);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [examId]);

  if (loading) return (
    <StudentLayout>
      <div className="loading-box"><span className="loading-spinner">⏳</span><p>Loading leaderboard...</p></div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>🏆 Leaderboard</h1>
        {liveUpdate && (
          <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>
            🔴 LIVE
          </span>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      {leaderboard.length === 0 && !error && (
        <p className="page-subtitle">No results yet. Be the first to submit!</p>
      )}

      {leaderboard.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Score</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => {
                const isMe = entry.student_id === user?.id;
                const pct = Math.round((entry.score / entry.total_marks) * 100);
                return (
                  <tr key={entry.id} className={isMe ? 'me' : ''}>
                    <td>
                      <span className="rank-medal">
                        {entry.rank_position <= 3 ? MEDALS[entry.rank_position - 1] : `#${entry.rank_position}`}
                      </span>
                    </td>
                    <td>{isMe ? `👤 You (${entry.name})` : entry.name}</td>
                    <td>{entry.score} / {entry.total_marks}</td>
                    <td>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={() => navigate(`/student/result/${attemptId}`)}>
          ← Back to Result
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/student/dashboard')}>
          🏠 Dashboard
        </button>
      </div>
    </StudentLayout>
  );
};

export default LeaderboardPage;
