import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { addRipple } from '../../utils/ripple';
import '../../styles/admin-layout.css';

const NAV_ITEMS = [
  {
    path: '/admin/dashboard',
    icon: '🏠',
    label: 'Dashboard',
  },
  {
    path: '/admin/my-exams',
    icon: '📋',
    label: 'My Exams',
  },
  {
    path: '/admin/create-exam',
    icon: '➕',
    label: 'Create Exam',
  },
  {
    path: '/admin/live-leaderboard',
    icon: '🏆',
    label: 'Live Leaderboard',
  },
];


const AdminLayout = ({ children, pageName, pageSubtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="adm-wrapper">
      <div className={`adm-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className={`adm-sidebar ${open ? 'open' : ''}`}>
        <div className="adm-sidebar-brand">
          <div className="adm-sidebar-brand-icon">🎯</div>
          <div className="adm-sidebar-brand-text">
            <div className="title">AI Mock Test</div>
            <div className="sub">Admin Panel</div>
          </div>
        </div>

        <nav className="adm-nav">
          <div className="adm-nav-section-label">Main</div>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`adm-nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="adm-nav-icon">{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className={`adm-nav-badge ${item.badgeColor || ''}`}>{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-user-row">
            <div className="adm-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="adm-user-info">
              <div className="name">{user?.name}</div>
              <div className="role">Administrator</div>
            </div>
          </div>
          <button className="adm-logout-btn" onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="adm-main">
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <button className="adm-hamburger" onClick={() => setOpen(!open)}>☰</button>
            <div>
              <div className="adm-topbar-title">{pageName || 'Dashboard'}</div>
              {pageSubtitle && (
                <div className="adm-topbar-breadcrumb">{pageSubtitle}</div>
              )}
            </div>
          </div>
          <div className="adm-topbar-right">
            <button
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.8rem' }}
              onClick={() => navigate('/admin/create-exam')}
            >
              ➕ New Exam
            </button>
          </div>
        </header>

        <main className="adm-page-content">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
