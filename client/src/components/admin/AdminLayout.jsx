import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

const NAV = [
  { path: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/admin/create-exam', icon: '➕', label: 'Create Exam' },
];

const AdminLayout = ({ children, pageName }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="al-wrapper">
      {open && <div className="al-overlay" onClick={() => setOpen(false)} />}

      <aside className={`al-sidebar ${open ? 'al-sidebar--open' : ''}`}>
        <div className="al-brand">
          <div className="al-brand-title">🎯 AI Mock Test</div>
          <div className="al-brand-sub">Admin Panel</div>
        </div>
        <nav className="al-nav">
          {NAV.map(n => (
            <Link
              key={n.path} to={n.path}
              className={`al-nav-link ${location.pathname === n.path ? 'al-nav-link--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="al-nav-icon">{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <div className="al-sidebar-footer">
          <button className="al-logout" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      <div className="al-main">
        <header className="al-header">
          <div className="al-header-left">
            <button className="al-hamburger" onClick={() => setOpen(!open)}>☰</button>
            <span className="al-page-name">{pageName || 'Dashboard'}</span>
          </div>
          <div className="al-header-right">
            <div className="al-user-chip">
              <div className="al-user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
              <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>{user?.name}</span>
            </div>
          </div>
        </header>
        <main className="al-content">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
