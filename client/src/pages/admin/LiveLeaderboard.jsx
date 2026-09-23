import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import '../../styles/admin-live-leaderboard.css';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

const LiveLeaderboard = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [exam, setExam] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingExams, setLoadingExams] = useState(true);
  const [liveUpdate, setLiveUpdate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [examSearch, setExamSearch] = useState('');
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // Load all exams on mount
  useEffect(() => {
    api.get('/exams/my-exams')
      .then(res => setExams(res.data.exams))
      .catch(() => {})
      .finally(() => setLoadingExams(false));
  }, []);

  // Filter exam dropdown
  const filteredExams = useMemo(() => {
    if (!examSearch) return exams;
    const q = examSearch.toLowerCase();
    return exams.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      e.exam_code.toLowerCase().includes(q)
    );
  }, [exams, examSearch]);

  // Load leaderboard when exam selected
  useEffect(() => {
    if (!selectedExamId) { setExam(null); setLeaderboard([]); return; }
    setLoading(true);
    Promise.all([
      api.get(`/admin/exams/${selectedExamId}/leaderboard`),
    ]).then(([lbRes]) => {
      setLeaderboard(lbRes.data.leaderboard);
      setExam(lbRes.data.exam);
      setLastUpdated(new Date());
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedExamId]);

  // Socket.IO live updates
  useEffect(() => {
    if (!selectedExamId) {
      socketRef.current?.disconnect();
      return;
    }

    socketRef.current?.disconnect();
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    socketRef.current.emit('join:exam', Number(selectedExamId));
    socketRef.current.on('leaderboard:update', data => {
      if (String(data.examId) === String(selectedExamId)) {
        setLeaderboard(data.leaderboard);
        setLiveUpdate(true);
        setLastUpdated(new Date());
        setTimeout(() => setLiveUpdate(false), 3000);
      }
    });
    return () => socketRef.current?.disconnect();
  }, [selectedExamId]);

  const submitted = leaderboard.filter(r => ['submitted', 'auto_submitted'].includes(r.status));
  const topScore = submitted.length > 0 ? Math.max(...submitted.map(r => r.score)) : 0;
  const avgPct = submitted.length > 0
    ? Math.round(submitted.reduce((s, r) => s + (r.percentage || 0), 0) / submitted.length)
    : 0;

  return (
    <AdminLayout pageName="Live Leaderboard" pageSubtitle="Real-time student scores per examination">
      <div className="live-lb-page">

        {/* Exam selector */}
        <div className="live-lb-selector-bar">
          <div className="live-lb-selector-label">Select Exam:</div>

          <div className="live-lb-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="live-lb-search"
              placeholder="Search exams..."
              value={examSearch}
              onChange={e => setExamSearch(e.target.value)}
            />
          </div>

          <select
            className="live-lb-exam-select"
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            disabled={loadingExams}
          >
            <option value="">
              {loadingExams ? 'Loading exams...' : `— Choose an exam (${filteredExams.length} available) —`}
            </option>
            {filteredExams.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} [{e.exam_code}] · {e.status}
              </option>
            ))}
          </select>

          {selectedExamId && (
            <div className="live-indicator">
              <div className="live-dot" />
              LIVE
            </div>
          )}
        </div>

        {/* No exam selected */}
        {!selectedExamId && (
          <div className="live-lb-empty">
            <div className="live-lb-empty-icon">🏆</div>
            <div className="live-lb-empty-title">Select an exam to view the live leaderboard</div>
            <div className="live-lb-empty-sub">
              Scores update automatically as students submit their answers
            </div>
          </div>
        )}

        {/* Exam selected */}
        {selectedExamId && exam && (
          <>
            {/* Exam banner */}
            <div className="live-lb-exam-banner">
              <div>
                <div className="live-lb-exam-name">{exam.title}</div>
                <div className="live-lb-exam-meta">
                  {exam.subject} · {exam.topic} · {exam.difficulty} · {exam.question_count} questions · {exam.total_marks} marks
                </div>
              </div>
              <div className="live-lb-exam-stats">
                <div className="live-lb-stat">
                  <div className="live-lb-stat-val">{leaderboard.length}</div>
                  <div className="live-lb-stat-lbl">Joined</div>
                </div>
                <div className="live-lb-stat">
                  <div className="live-lb-stat-val">{submitted.length}</div>
                  <div className="live-lb-stat-lbl">Submitted</div>
                </div>
                <div className="live-lb-stat">
                  <div className="live-lb-stat-val">{avgPct}%</div>
                  <div className="live-lb-stat-lbl">Avg Score</div>
                </div>
                <div className="live-lb-stat">
                  <div className="live-lb-stat-val">{topScore}</div>
                  <div className="live-lb-stat-lbl">Top Score</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="live-lb-table-wrap">
              <div className="live-lb-table-header">
                <div className="live-lb-table-title">
                  🏅 Rankings
                  {liveUpdate && (
                    <span style={{ marginLeft: 10, fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                      ✓ Updated
                    </span>
                  )}
                </div>
                <div className="live-lb-updated">
                  {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString('en-IN')}`}
                </div>
              </div>

              {loading ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
              ) : leaderboard.length === 0 ? (
                <div className="live-lb-empty" style={{ padding: '48px 24px' }}>
                  <div className="live-lb-empty-icon" style={{ fontSize: '2.5rem' }}>📭</div>
                  <div className="live-lb-empty-title">No submissions yet</div>
                  <div className="live-lb-empty-sub">The leaderboard will populate as students submit</div>
                </div>
              ) : (
                <table className="live-lb-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Score</th>
                      <th>Performance</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map(row => {
                      const rankClass = row.rank_position === 1 ? 'rank-1' : row.rank_position === 2 ? 'rank-2' : row.rank_position === 3 ? 'rank-3' : '';
                      const pct = row.percentage ?? Math.round((row.score / row.total_marks) * 100);
                      return (
                        <tr key={row.attempt_id} className={rankClass}>
                          <td className="rank-cell">
                            {MEDALS[row.rank_position] || `#${row.rank_position}`}
                          </td>
                          <td style={{ fontWeight: 700 }}>{row.name}</td>
                          <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{row.email}</td>
                          <td>
                            <strong>{row.score}</strong>
                            <span style={{ color: '#94a3b8' }}> / {row.total_marks}</span>
                          </td>
                          <td style={{ minWidth: 140 }}>
                            <div className="score-bar-wrap">
                              <div className="score-bar-bg">
                                <div
                                  className={`score-bar-fill ${pct >= 60 ? 'green' : ''}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="score-pct">{pct}%</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            {row.submitted_at
                              ? new Date(row.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>
                          <td>
                            <span className={`status-pill ${row.status === 'submitted' || row.status === 'auto_submitted' ? 'completed' : 'scheduled'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td>
                            {['submitted', 'auto_submitted'].includes(row.status) && (
                              <button
                                className="tbl-btn primary"
                                onClick={() => navigate(`/admin/report/${row.attempt_id}`)}
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
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default LiveLeaderboard;
