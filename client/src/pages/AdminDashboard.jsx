import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../services/api';

const STATUS_ORDER = ['draft', 'generating', 'generation_failed', 'ready', 'scheduled', 'active', 'completed'];

const AdminDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/exams/my-exams')
      .then(res => setExams(res.data.exams))
      .catch(() => setError('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: exams.length,
    scheduled: exams.filter(e => e.status === 'scheduled').length,
    active: exams.filter(e => e.status === 'active').length,
    completed: exams.filter(e => e.status === 'completed').length,
    draft: exams.filter(e => ['draft', 'generation_failed', 'ready'].includes(e.status)).length,
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatTime = t => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <AdminLayout pageName="Dashboard">
      {/* Page header */}
      <div className="ap-header">
        <div>
          <div className="ap-title">📊 Dashboard</div>
          <div className="ap-subtitle">Manage your examinations and monitor activity</div>
        </div>
        <button className="abtn abtn--primary abtn--lg" onClick={() => navigate('/admin/create-exam')}>
          ➕ Create New Exam
        </button>
      </div>

      {/* Stat cards */}
      <div className="as-grid">
        <div className="as-card as-card--blue">
          <div className="as-icon">📋</div>
          <div className="as-value">{stats.total}</div>
          <div className="as-label">Total Exams</div>
        </div>
        <div className="as-card as-card--amber">
          <div className="as-icon">⏳</div>
          <div className="as-value">{stats.draft}</div>
          <div className="as-label">Pending Setup</div>
        </div>
        <div className="as-card as-card--purple">
          <div className="as-icon">📅</div>
          <div className="as-value">{stats.scheduled}</div>
          <div className="as-label">Scheduled</div>
        </div>
        <div className="as-card as-card--green">
          <div className="as-icon">🟢</div>
          <div className="as-value">{stats.active}</div>
          <div className="as-label">Live Now</div>
        </div>
        <div className="as-card as-card--red">
          <div className="as-icon">✅</div>
          <div className="as-value">{stats.completed}</div>
          <div className="as-label">Completed</div>
        </div>
      </div>

      {/* Exams list */}
      <div className="a-card">
        <div className="a-card-header">
          <span className="a-card-title">My Examinations</span>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{exams.length} total</span>
        </div>
        <div className="a-card-body" style={{ padding: '0' }}>
          {loading && (
            <div className="a-loading"><div className="a-spinner" /><span>Loading exams...</span></div>
          )}
          {error && (
            <div style={{ padding: '20px' }}><div className="a-alert a-alert--error">{error}</div></div>
          )}
          {!loading && exams.length === 0 && !error && (
            <div className="a-empty">
              <div className="a-empty-icon">📭</div>
              <div className="a-empty-text">No exams created yet</div>
              <div className="a-empty-sub">Click "Create New Exam" to get started</div>
            </div>
          )}

          <div className="ae-grid" style={{ padding: exams.length > 0 ? '20px' : '0' }}>
            {exams.map(exam => (
              <div key={exam.id} className="ae-card">
                <div className="ae-card-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div className="ae-card-title">{exam.title}</div>
                    <span className={`badge badge--${exam.status}`}>{exam.status}</span>
                  </div>
                  <div className="ae-tags">
                    <span className="ae-tag ae-tag--stream">{exam.stream}</span>
                    <span className="ae-tag ae-tag--subject">{exam.subject}</span>
                    <span className={`ae-tag ae-tag--${exam.difficulty?.toLowerCase()}`}>{exam.difficulty}</span>
                  </div>
                </div>

                <div className="ae-card-body">
                  <div className="ae-meta-row">
                    <div className="ae-meta-item">❓ <strong>{exam.question_count}</strong> questions</div>
                    <div className="ae-meta-item">🎯 <strong>{exam.total_marks}</strong> marks</div>
                    <div className="ae-meta-item">⏱ <strong>{exam.duration_minutes}</strong> min</div>
                    <div className="ae-meta-item">👥 <strong>{exam.capacity}</strong> capacity</div>
                  </div>
                  <div className="ae-meta-item" style={{ marginBottom: '10px' }}>
                    📅 {formatDate(exam.scheduled_date)} at {formatTime(exam.start_time)}
                  </div>

                  <div className="ae-code-box">
                    <div>
                      <div className="ae-code-label">Exam Code</div>
                      <div className="ae-code">{exam.exam_code}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Share with students</span>
                  </div>
                </div>

                <div className="ae-card-footer">
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {exam.id}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(exam.status === 'draft' || exam.status === 'generation_failed') && (
                      <button className="abtn abtn--purple abtn--sm"
                        onClick={() => navigate(`/admin/exam/${exam.id}/generate`)}>
                        ✨ Generate Questions
                      </button>
                    )}
                    {exam.status === 'ready' && (
                      <button className="abtn abtn--ghost abtn--sm"
                        onClick={() => navigate(`/admin/exam/${exam.id}/generate`)}>
                        👁 Preview / Republish
                      </button>
                    )}
                    {(exam.status === 'scheduled' || exam.status === 'active' || exam.status === 'completed') && (
                      <button className="abtn abtn--ghost abtn--sm"
                        onClick={() => navigate(`/admin/exam/${exam.id}/generate`)}>
                        👁 View Questions
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
