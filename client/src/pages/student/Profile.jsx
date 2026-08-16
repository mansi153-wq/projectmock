import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <StudentLayout>
      <h1 className="page-title">Profile</h1>
      <div className="profile-card">
        <div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
        <div className="profile-field">
          <label>Full Name</label>
          <span>{user?.name}</span>
        </div>
        <div className="profile-field">
          <label>Email Address</label>
          <span>{user?.email}</span>
        </div>
        <div className="profile-field">
          <label>Role</label>
          <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
        </div>
        <button className="btn btn-danger" style={{ marginTop: '8px' }} onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </StudentLayout>
  );
};

export default Profile;
