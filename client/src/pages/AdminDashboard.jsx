import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { addRipple } from '../utils/ripple';
import api from '../services/api';
import '../styles/admin-dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/exams/my-exams').then(res => {
      const exams = res.data.exams;
      setRecentExams(exams.slice(0, 5));
      setStats({
        total: exams.length,
        draft: exams.filter(e => ['draft', 'generation_failed', 'ready'].includes(e.status)).length,
        scheduled: exams.filter(e => e.status === 'scheduled').length,
        active: exams.filter(e => e.status === 'active').length,
        completed: exams.filter(e => e.status === 'completed').length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

  return (
    <AdminLayout
      pageName="Dashboard"
      pageSubtitle={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
    >
      <div className="dash-page">

        {/* Welcome banner */}
        <div className="dash-welcome">
          <div className="dash-welcome-content">
            <div className="dash-welcome-greeting">
              {timeOfDay()}, {user?.name?.split(' ')[0]} 👋
            </div>
            <div className="dash-welcome-sub">
              Here's what's happening with your exams today.
            </div>
            <div className="dash-welcome-actions">
              <button className="dash-quick-btn solid" onClick={() => navigate('/admin/create-exam')}>
                ➕ Create Exam
              </button>
              <button className="dash-quick-btn outline" onClick={() => navigate('/admin/my-exams')}>
                📋 My Exams
              </button>
              <button className="dash-quick-btn outline" onClick={() => navigate('/admin/live-leaderboard')}>
                🏆 Live Leaderboard
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="dash-stats">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="dash-stat" style={{ opacity: 0.5 }}>
                <div style={{ height: 20, width: 40, background: '#e2e8f0', borderRadius: 4, marginBottom: 10 }} />
                <div style={{ height: 36, width: 60, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 12, width: 80, background: '#e2e8f0', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="dash-stats">
            {[
              { label: 'Total Exams', value: stats?.total ?? 0, icon: '📋', cls: 'blue' },
              { label: 'Pending Setup', value: stats?.draft ?? 0, icon: '⏳', cls: 'amber' },
              { label: 'Scheduled', value: stats?.scheduled ?? 0, icon: '📅', cls: 'purple' },
              { label: 'Live Now', value: stats?.active ?? 0, icon: '🟢', cls: 'green' },
              { label: 'Completed', value: stats?.completed ?? 0, icon: '✅', cls: 'red' },
            ].map(s => (
              <div key={s.label} className={`dash-stat ${s.cls} slide-up`}>
                <div className="dash-stat-icon">{s.icon}</div>
                <div className="dash-stat-value">{s.value}</div>
                <div className="dash-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="dash-section-title">⚡ Quick Actions</div>
        <div className="dash-actions-grid" style={{ marginBottom: 28 }}>
          {[
            { icon: '➕', label: 'Create New Exam', sub: 'Set up exam & generate questions', path: '/admin/create-exam', color: 'blue' },
            { icon: '📋', label: 'My Exams', sub: 'View, reset and manage all exams', path: '/admin/my-exams', color: 'green' },
            { icon: '🏆', label: 'Live Leaderboard', sub: 'Monitor students in real time', path: '/admin/live-leaderboard', color: 'purple' },
            { icon: '📊', label: 'Exam Results', sub: 'View reports for any exam', path: '/admin/my-exams', color: 'amber' },
          ].map(a => (
            <div key={a.path + a.label} className="dash-action-card" onClick={() => navigate(a.path)}>
              <div className={`dash-action-icon ${a.color}`}>{a.icon}</div>
              <div>
                <div className="dash-action-title">{a.label}</div>
                <div className="dash-action-sub">{a.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent exams */}
        {recentExams.length > 0 && (
          <>
            <div className="dash-section-title">
              🕐 Recent Exams
              <span
                style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 500, cursor: 'pointer', marginLeft: 'auto' }}
                onClick={() => navigate('/admin/my-exams')}
              >
                View all →
              </span>
            </div>
            <div className="dash-recent-list">
              {recentExams.map(exam => (
                <div key={exam.id} className="dash-recent-item">
                  <div className={`dash-recent-dot ${exam.status}`} />
                  <div className="dash-recent-info">
                    <div className="dash-recent-title">{exam.title}</div>
                    <div className="dash-recent-meta">
                      {exam.subject} · {exam.topic} · {formatDate(exam.scheduled_date)}
                    </div>
                  </div>
                  <div className="dash-recent-actions">
                    {['scheduled', 'active', 'completed'].includes(exam.status) && (
                      <button
                        className="tbl-btn primary"
                        onClick={() => navigate(`/admin/exam/${exam.id}/students`)}
                      >
                        📊 Results
                      </button>
                    )}
                    {['draft', 'generation_failed', 'ready'].includes(exam.status) && (
                      <button
                        className="tbl-btn success"
                        onClick={() => navigate(`/admin/exam/${exam.id}/generate`)}
                      >
                        ✨ Setup
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
