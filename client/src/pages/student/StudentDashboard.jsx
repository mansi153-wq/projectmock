import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { SkeletonStatCard } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student/stats')
      .then(res => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudentLayout>
      {/* Welcome banner */}
      <div className="welcome-banner">
        <div className="welcome-title slide-up">
          Hey, {user?.name?.split(' ')[0]} 👋
        </div>
        <div className="welcome-sub slide-up stagger-1">
          Ready to test your knowledge today? Join an exam or view your progress.
        </div>
        <div className="welcome-actions slide-up stagger-2">
          <button className="btn-white-solid" onClick={() => navigate('/student/join')}>
            🔑 Join Exam
          </button>
          <button className="btn-white" onClick={() => navigate('/student/exams')}>
            📋 Browse Exams
          </button>
          <button className="btn-white" onClick={() => navigate('/student/reports')}>
            📊 My Reports
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {loading ? (
          [1,2,3,4,5].map(i => <SkeletonStatCard key={i} />)
        ) : (
          <>
            {[
              { label: 'Available Exams', value: stats?.availableExams ?? 0, icon: '📋', cls: 'stat-card--blue', delay: 'stagger-1' },
              { label: 'Completed', value: stats?.completedExams ?? 0, icon: '✅', cls: 'stat-card--green', delay: 'stagger-2' },
              { label: 'Average Score', value: `${stats?.averageScore ?? 0}%`, icon: '📊', cls: 'stat-card--amber', delay: 'stagger-3' },
              { label: 'Best Score', value: `${stats?.bestScore ?? 0}%`, icon: '🌟', cls: 'stat-card--purple', delay: 'stagger-4' },
              ...(stats?.bestRank ? [{ label: 'Best Rank', value: `#${stats.bestRank}`, icon: '🏆', cls: 'stat-card--red', delay: 'stagger-5' }] : []),
            ].map(s => (
              <div key={s.label} className={`stat-card ${s.cls} slide-up ${s.delay}`}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="card slide-up stagger-4">
        <div className="card-header"><span className="card-title">Quick Actions</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {[
              { icon: '🔑', title: 'Join Exam', sub: 'Enter exam code', path: '/student/join', cls: 'btn-primary' },
              { icon: '📋', title: 'Available Exams', sub: 'Browse upcoming tests', path: '/student/exams', cls: 'btn-ghost' },
              { icon: '📊', title: 'My Reports', sub: 'View performance analysis', path: '/student/reports', cls: 'btn-ghost' },
              { icon: '📁', title: 'My Results', sub: 'All past attempts', path: '/student/results', cls: 'btn-ghost' },
            ].map(a => (
              <button key={a.path}
                className={`btn ${a.cls}`}
                style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px', height: 'auto', gap: 4, textAlign: 'left' }}
                onClick={() => navigate(a.path)}
              >
                <span style={{ fontSize: '1.3rem' }}>{a.icon}</span>
                <span style={{ fontWeight: 700 }}>{a.title}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 400 }}>{a.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
