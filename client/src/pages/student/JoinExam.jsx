import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../services/api';

const JoinExam = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.prefillCode) {
      setCode(location.state.prefillCode);
    }
  }, [location.state]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/attempts/join', { exam_code: code.trim() });
      const { status, attemptId, examId, exam } = res.data;

      // Already submitted — go straight to result
      if (status === 'already_submitted') {
        navigate(`/student/result/${attemptId}`);
        return;
      }

      // Check if exam has started yet
      const now = new Date();
      const dateStr = new Date(exam.scheduled_date).toISOString().split('T')[0];
      const examStart = new Date(`${dateStr}T${exam.start_time}`);

      if (now < examStart) {
        navigate(`/student/waiting/${attemptId}`, { state: { exam, attemptId, examId } });
      } else {
        navigate(`/student/exam/${attemptId}`, { state: { exam, attemptId, examId } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <h1 className="page-title">Join Examination</h1>

      <div className="join-box">
        <h2>Enter Exam Code</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Ask your administrator for the exam code to join.
        </p>
        <form onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="e.g. ABC123"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={10}
            required
          />
          {error && <div className="error-box" style={{ marginBottom: '12px' }}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? '⏳ Validating...' : '🔑 Join Exam'}
          </button>
        </form>
      </div>
    </StudentLayout>
  );
};

export default JoinExam;
