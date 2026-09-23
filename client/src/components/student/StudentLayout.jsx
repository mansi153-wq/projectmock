import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/student/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/student/exams',     icon: '📋', label: 'Available Exams' },
  { path: '/student/join',      icon: '🔑', label: 'Join Exam' },
  { path: '/student/reports',   icon: '📊', label: 'My Reports' },
  { path: '/student/results',   icon: '📁', label: 'My Results' },
  { path: '/student/profile',   icon: '👤', label: 'Profile' },
];

const StudentLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="dash-wrapper">
      <div className={`dash-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`dash-sidebar ${open ? 'open' : ''}`}>
        <div className="dash-brand">
          <div className="dash-brand-logo">
            <div className="dash-brand-icon">🎯</div>
            <div>
              <div className="dash-brand-name">AI Mock Test</div>
              <div className="dash-brand-sub">Student Portal</div>
            </div>
          </div>
        </div>

        <nav className="dash-nav">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`dash-nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <button
            className="btn btn-danger btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-header">
          <div className="dash-header-left">
            <button className="dash-hamburger" onClick={() => setOpen(!open)}>☰</button>
          </div>
          <div className="dash-header-right">
            <div className="dash-user-chip">
              <div className="dash-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
              <span className="dash-user-name">{user?.name}</span>
            </div>
            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
              STUDENT
            </span>
          </div>
        </header>
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
};

export default StudentLayout;
