import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { useToast } from '../../components/ui/Toast';
import api from '../../services/api';

const JoinExam = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    if (location.state?.prefillCode) setCode(location.state.prefillCode);
  }, [location.state]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);

    try {
      const res = await api.post('/attempts/join', { exam_code: code.trim() });
      const { status, attemptId, examId, exam } = res.data;

      if (status === 'already_submitted') {
        toast('You have already submitted this exam. Showing your result.', 'info');
        navigate(`/student/result/${attemptId}`);
        return;
      }

      const now = new Date();
      const dateStr = new Date(exam.scheduled_date).toISOString().split('T')[0];
      const examStart = new Date(`${dateStr}T${exam.start_time}`);

      if (now < examStart) {
        navigate(`/student/waiting/${attemptId}`, { state: { exam, attemptId, examId } });
      } else {
        navigate(`/student/exam/${attemptId}`, { state: { exam, attemptId, examId } });
      }
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast(err.response?.data?.message || 'Invalid exam code.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <StudentLayout>
      <div style={{ maxWidth: 480, margin: '40px auto' }}>
        <div className="join-card">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔑</div>
            <h2 className="join-card h2" style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Join Examination</h2>
            <p className="join-sub" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Enter the exam code provided by your administrator
            </p>
          </div>

          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Exam Code</label>
              <input
                type="text"
                className={`code-input ${shake ? 'error' : ''}`}
                placeholder="ABC123"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={10}
                required
              />
              <div className="form-hint" style={{ textAlign: 'center' }}>The code is case-insensitive</div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 48, fontSize: '0.95rem' }} disabled={loading}>
              {loading ? (
                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />Validating...</>
              ) : '🚀 Join Exam'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--primary-dark)' }}>
            💡 The exam will start at the scheduled time. If you join early, you'll see a countdown timer.
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default JoinExam;
