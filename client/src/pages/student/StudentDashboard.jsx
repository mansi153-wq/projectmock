import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../services/api';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/stats')
      .then(res => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudentLayout>
      <h1 className="page-title">Dashboard</h1>

      {loading ? (
        <div className="loading-box"><span className="loading-spinner">⏳</span></div>
      ) : (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{stats?.availableExams ?? 0}</div>
            <div className="stat-label">Available Exams</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.completedExams ?? 0}</div>
            <div className="stat-label">Completed Exams</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.averageScore ?? 0}%</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.bestScore ?? 0}%</div>
            <div className="stat-label">Best Score</div>
          </div>
          {stats?.bestRank && (
            <div className="stat-card">
              <div className="stat-value">#{stats.bestRank}</div>
              <div className="stat-label">Best Rank</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link to="/student/exams">
          <button className="btn btn-primary">📋 View Available Exams</button>
        </Link>
        <Link to="/student/join">
          <button className="btn btn-success">🔑 Join Exam with Code</button>
        </Link>
        <Link to="/student/results">
          <button className="btn btn-secondary">📊 My Results</button>
        </Link>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
