import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../services/api';

const AvailableExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student/exams')
      .then(res => setExams(res.data.exams))
      .catch(() => setError('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <StudentLayout>
      <h1 className="page-title">Available Exams</h1>

      {loading && <div className="loading-box"><span className="loading-spinner">⏳</span><p>Loading exams...</p></div>}
      {error && <div className="error-box">{error}</div>}
      {!loading && exams.length === 0 && !error && (
        <p className="page-subtitle">No exams are currently available. Check back later.</p>
      )}

      <div className="exam-grid">
        {exams.map(exam => (
          <div key={exam.id} className="exam-card">
            <h3>{exam.title}</h3>
            <div className="exam-meta">
              <span className="tag">{exam.stream}</span>
              <span className="tag">{exam.subject}</span>
              <span className={`tag tag-difficulty-${exam.difficulty}`}>{exam.difficulty}</span>
              <span className={`status-badge status-${exam.status}`}>{exam.status.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.7' }}>
              <div>📚 Topic: <strong>{exam.topic}</strong></div>
              <div>❓ Questions: <strong>{exam.question_count}</strong> &nbsp;|&nbsp; 🎯 Marks: <strong>{exam.total_marks}</strong></div>
              <div>⏱ Duration: <strong>{exam.duration_minutes} min</strong></div>
              <div>📅 Date: <strong>{formatDate(exam.scheduled_date)}</strong> at <strong>{formatTime(exam.start_time)}</strong></div>
            </div>
            <div className="exam-card-footer">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/student/join', { state: { prefillCode: exam.exam_code } })}
              >
                Join Exam
              </button>
            </div>
          </div>
        ))}
      </div>
    </StudentLayout>
  );
};

export default AvailableExams;
