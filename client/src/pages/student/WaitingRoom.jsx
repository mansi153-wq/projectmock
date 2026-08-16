import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import api from '../../services/api';

const WaitingRoom = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [exam, setExam] = useState(location.state?.exam || null);
  const [countdown, setCountdown] = useState('');
  const [started, setStarted] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!exam) {
      // Reload exam data if navigated directly
      api.get('/student/stats').catch(() => {});
    }
  }, [exam]);

  useEffect(() => {
    if (!exam) return;

    const tick = async () => {
      try {
        // Ping server to get accurate time
        const res = await api.get(`/attempts/${attemptId}/questions`).catch(e => {
          // If server says exam started, go to exam page
          if (e.response?.data?.examStart) {
            const serverNow = new Date(e.response.data.serverTime);
            const examStart = new Date(e.response.data.examStart);
            if (serverNow >= examStart) {
              clearInterval(intervalRef.current);
              setStarted(true);
              navigate(`/student/exam/${attemptId}`, { state: { exam, attemptId, examId: exam.id } });
            }
          }
          return null;
        });
        if (res) {
          // Questions are available — exam has started
          clearInterval(intervalRef.current);
          navigate(`/student/exam/${attemptId}`, { state: { exam, attemptId, examId: exam.id } });
        }
      } catch (e) { /* ignore */ }
    };

    // Calculate countdown from exam start time
    const updateCountdown = () => {
      const now = new Date();
      const dateStr = exam.scheduled_date
        ? new Date(exam.scheduled_date).toISOString().split('T')[0]
        : '';
      const examStart = new Date(`${dateStr}T${exam.start_time}`);
      const diff = examStart - now;

      if (diff <= 0) {
        setCountdown('00:00:00');
        clearInterval(intervalRef.current);
        navigate(`/student/exam/${attemptId}`, { state: { exam, attemptId, examId: exam.id } });
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    updateCountdown();
    intervalRef.current = setInterval(updateCountdown, 1000);

    // Poll server every 15s to verify start
    const pollInterval = setInterval(tick, 15000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(pollInterval);
    };
  }, [exam, attemptId, navigate]);

  if (!exam) return (
    <StudentLayout>
      <div className="loading-box"><span className="loading-spinner">⏳</span><p>Loading...</p></div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="countdown-box">
        <h2>{exam.title}</h2>
        <p style={{ color: '#64748b' }}>{exam.subject} · {exam.topic} · {exam.difficulty}</p>
        <p>Exam starts in:</p>
        <div className="countdown-timer">{countdown}</div>
        <p className="countdown-note">
          Please stay on this page. The exam will begin automatically when the scheduled time arrives.
        </p>
        <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#94a3b8' }}>
          <div>⏱ Duration: {exam.duration_minutes} minutes</div>
          <div>❓ Questions: {exam.question_count}</div>
          <div>🎯 Total Marks: {exam.total_marks}</div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default WaitingRoom;
