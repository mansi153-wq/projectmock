import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../services/api';

const statusBadgeMap = {
  scheduled: 'badge-scheduled',
  active: 'badge-active',
  completed: 'badge-completed',
  draft: 'badge-draft',
};

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Available Exams</h1>
          <p className="page-subtitle">Browse and join exams open to you right now</p>
        </div>
      </div>

      {loading && (
        <div className="loading-page">
          <div className="spinner" />
          <p>Loading exams…</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {!loading && !error && exams.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No exams available</div>
          <div className="empty-state-sub">Check back later — new exams will show up here.</div>
        </div>
      )}

      <div className="exam-grid">
        {exams.map(exam => (
          <div key={exam.id} className="exam-card">
            <div className={`exam-card-accent ${exam.difficulty}`} />

            <div className="exam-card-header">
              <div className="exam-card-title">{exam.title}</div>
              <div className="exam-card-tags">
                <span className="tag tag-stream">{exam.stream}</span>
                <span className="tag tag-subject">{exam.subject}</span>
                <span className={`tag tag-${exam.difficulty}`}>{exam.difficulty}</span>
                <span className={`badge ${statusBadgeMap[exam.status] || 'badge-draft'}`}>
                  {exam.status}
                </span>
              </div>
            </div>

            <div className="exam-card-body">
              <div className="exam-card-meta">
                <span className="exam-meta-item">📚 Topic: <strong>{exam.topic}</strong></span>
                <span className="exam-meta-item">❓ Questions: <strong>{exam.question_count}</strong></span>
                <span className="exam-meta-item">🎯 Marks: <strong>{exam.total_marks}</strong></span>
                <span className="exam-meta-item">⏱ Duration: <strong>{exam.duration_minutes} min</strong></span>
                <span className="exam-meta-item">
                  📅 <strong>{formatDate(exam.scheduled_date)}</strong> at <strong>{formatTime(exam.start_time)}</strong>
                </span>
              </div>
            </div>

            <div className="exam-card-footer">
              <span className="exam-code-label">Code: {exam.exam_code}</span>
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