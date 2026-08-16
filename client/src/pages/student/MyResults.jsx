import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../services/api';

const MyResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student/my-results')
      .then(res => setResults(res.data.results))
      .catch(() => setError('Failed to load results'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudentLayout>
      <h1 className="page-title">My Results</h1>

      {loading && <div className="loading-box"><span className="loading-spinner">⏳</span><p>Loading results...</p></div>}
      {error && <div className="error-box">{error}</div>}
      {!loading && results.length === 0 && !error && (
        <p className="page-subtitle">You haven't completed any exams yet.</p>
      )}

      {results.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="results-table">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Subject / Topic</th>
                <th>Score</th>
                <th>%</th>
                <th>Rank</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => {
                const pct = Math.round((r.score / r.total_marks) * 100);
                return (
                  <tr key={r.id}>
                    <td><strong>{r.title}</strong></td>
                    <td>{r.subject} / {r.topic}</td>
                    <td>{r.score} / {r.total_marks}</td>
                    <td>{pct}%</td>
                    <td>{r.rank_position ? `#${r.rank_position}` : '—'}</td>
                    <td>
                      <span className={`status-badge status-${r.status === 'submitted' || r.status === 'auto_submitted' ? 'completed' : 'scheduled'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/student/result/${r.id}`)}>
                        View Result
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </StudentLayout>
  );
};

export default MyResults;
