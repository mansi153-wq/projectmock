import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/exams/my-exams');
        setExams(res.data.exams);
      } catch (err) {
        setError('Failed to load exams');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Logout</button>
      <br /><br />
      <Link to="/admin/create-exam">+ Create New Exam</Link>

      <h3>My Exams</h3>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && exams.length === 0 && <p>No exams created yet.</p>}

      <ul>
        {exams.map((exam) => (
          <li key={exam.id}>
            <strong>{exam.title}</strong> — {exam.subject} / {exam.topic} ({exam.difficulty})
            <br />
            Code: {exam.exam_code} | Status: {exam.status} | Marks: {exam.total_marks}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;
