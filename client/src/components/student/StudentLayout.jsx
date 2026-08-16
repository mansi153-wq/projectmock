import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/student.css';

const NAV_ITEMS = [
  { path: '/student/dashboard', label: '🏠 Dashboard' },
  { path: '/student/exams', label: '📋 Available Exams' },
  { path: '/student/results', label: '📊 My Results' },
  { path: '/student/profile', label: '👤 Profile' },
];

const StudentLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sl-wrapper">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sl-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sl-sidebar ${sidebarOpen ? 'sl-sidebar--open' : ''}`}>
        <div className="sl-brand">AI Mock Test</div>
        <nav className="sl-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sl-nav-link ${location.pathname === item.path ? 'sl-nav-link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="sl-logout-btn" onClick={handleLogout}>🚪 Logout</button>
      </aside>

      {/* Main area */}
      <div className="sl-main">
        <header className="sl-header">
          <button className="sl-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <span className="sl-header-title">Welcome, {user?.name}</span>
          <span className="sl-role-badge">Student</span>
        </header>
        <main className="sl-content">{children}</main>
      </div>
    </div>
  );
};

export default StudentLayout;
