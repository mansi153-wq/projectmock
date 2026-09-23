import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../services/api';

const WaitingRoom = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [exam, setExam] = useState(location.state?.exam || null);
  const [countdown, setCountdown] = useState('--:--:--');
  const intervalRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!exam) return;

    const tick = () => {
      const now = new Date();
      const dateStr = new Date(exam.scheduled_date).toISOString().split('T')[0];
      const examStart = new Date(`${dateStr}T${exam.start_time}`);
      const diff = examStart - now;
      if (diff <= 0) {
        clearInterval(intervalRef.current);
        navigate(`/student/exam/${attemptId}`, { state: { exam, attemptId, examId: exam.id } });
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    // Poll server every 15s
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/attempts/${attemptId}/questions`);
        if (res.data.questions) {
          clearInterval(intervalRef.current);
          clearInterval(pollRef.current);
          navigate(`/student/exam/${attemptId}`, { state: { exam, attemptId, examId: exam.id } });
        }
      } catch { }
    }, 15000);

    return () => { clearInterval(intervalRef.current); clearInterval(pollRef.current); };
  }, [exam, attemptId, navigate]);

  if (!exam) return (
    <StudentLayout>
      <div className="loading-page"><div className="spinner" /></div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="countdown-wrap">
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
        <div className="countdown-title">{exam.title}</div>
        <div className="countdown-sub">{exam.subject} · {exam.topic} · {exam.difficulty}</div>

        <div className="countdown-ring">
          <div className="countdown-time">{countdown}</div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 8 }}>
          Exam starts in — please stay on this page
        </p>

        <div className="status-dots">
          <div className="status-dot" />
          <div className="status-dot" />
          <div className="status-dot" />
        </div>

        <div style={{ marginTop: 28, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '18px 22px', border: '1px solid var(--border)', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.875rem' }}>📋 Exam Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {[['⏱ Duration', `${exam.duration_minutes} min`], ['❓ Questions', exam.question_count], ['🎯 Total Marks', exam.total_marks], ['📊 Difficulty', exam.difficulty]].map(([l, v]) => (
              <div key={l}><span>{l}:</span> <strong style={{ color: 'var(--text)' }}>{v}</strong></div>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default WaitingRoom;
