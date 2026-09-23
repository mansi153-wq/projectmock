import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = user?.name || 'Student';
  const firstLetter = userName.charAt(0).toUpperCase();

  return (
    <StudentLayout>
      <div className="profile-page">

        {/* Page Header */}
        <div className="profile-header">
          <div>
            <h1 className="profile-title">Profile</h1>
            <p className="profile-subtitle">
              Your learning space <span>✨</span>
            </p>
          </div>

          <div className="profile-message">
            Keep going,
            <br />
            You got this! <span>♥</span>
          </div>
        </div>

        {/* Main Profile Card */}
        <div className="profile-card">

          {/* Decorative Background */}
          <div className="profile-decoration decoration-top-left"></div>
          <div className="profile-decoration decoration-top-right"></div>
          <div className="profile-decoration decoration-bottom-left"></div>

          <div className="paper-plane">➤</div>

          {/* Avatar */}
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {firstLetter}
            </div>
          </div>

          {/* User Information */}
          <h2 className="profile-name">{userName}</h2>

          <p className="profile-email">
            {user?.email || 'No email available'}
          </p>

          {/* Role Badge */}
          <div className="profile-role">
            <span className="role-icon">🎓</span>
            <span>
              {user?.role
                ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                : 'Student'}
            </span>
          </div>

          {/* Information Section */}
          <div className="profile-info">

            {/* Full Name */}
            <div className="profile-info-row">
              <div className="info-icon info-blue">
                👤
              </div>

              <div className="info-content">
                <span className="info-label">Full Name</span>
                <span className="info-value">
                  {user?.name || 'Not available'}
                </span>
              </div>

              <span className="info-arrow">›</span>
            </div>

            {/* Email */}
            <div className="profile-info-row">
              <div className="info-icon info-pink">
                ✉
              </div>

              <div className="info-content">
                <span className="info-label">Email Address</span>
                <span className="info-value">
                  {user?.email || 'Not available'}
                </span>
              </div>

              <span className="info-arrow">›</span>
            </div>

            {/* Role */}
            <div className="profile-info-row">
              <div className="info-icon info-green">
                🎓
              </div>

              <div className="info-content">
                <span className="info-label">Role</span>
                <span className="info-value">
                  {user?.role
                    ? user.role.charAt(0).toUpperCase() +
                      user.role.slice(1)
                    : 'Student'}
                </span>
              </div>

              <span className="info-arrow">›</span>
            </div>

          </div>

          {/* Logout */}
          <button
            className="profile-logout"
            onClick={handleLogout}
          >
            <span>⇥</span>
            Logout
          </button>

          {/* Decorative Books */}
          <div className="books-decoration">
            <div className="book book-one"></div>
            <div className="book book-two"></div>
            <div className="book book-three"></div>
            <span className="book-heart">♥</span>
          </div>

        </div>
      </div>
    </StudentLayout>
  );
};

export default Profile;