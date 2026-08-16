import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../services/api';

const CreateExam = () => {
  const [form, setForm] = useState({
    title: '', stream: '', subject: '', topic: '', difficulty: 'Medium',
    question_count: '', marks_per_question: '',
    duration_minutes: '', capacity: '',
    scheduled_date: '', start_time: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(null); setLoading(true);
    try {
      const res = await api.post('/exams', {
        ...form,
        question_count: Number(form.question_count),
        marks_per_question: Number(form.marks_per_question),
        duration_minutes: Number(form.duration_minutes),
        capacity: Number(form.capacity),
      });
      setSuccess(res.data.exam);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <AdminLayout pageName="Create Exam">
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="a-alert a-alert--success" style={{ marginBottom: '24px', fontSize: '1rem', padding: '16px 20px' }}>
            🎉 Exam created successfully!
          </div>

          <div className="a-card">
            <div className="a-card-header">
              <span className="a-card-title">{success.title}</span>
              <span className={`badge badge--${success.status}`}>{success.status}</span>
            </div>
            <div className="a-card-body">
              <div className="aei-grid" style={{ marginBottom: '20px' }}>
                <div className="aei-item"><div className="aei-label">Total Marks</div><div className="aei-value">{success.total_marks}</div></div>
                <div className="aei-item"><div className="aei-label">Questions</div><div className="aei-value">{success.question_count}</div></div>
                <div className="aei-item"><div className="aei-label">Duration</div><div className="aei-value">{success.duration_minutes} min</div></div>
              </div>

              <div className="ae-code-box" style={{ marginBottom: '24px' }}>
                <div>
                  <div className="ae-code-label">Exam Code (share with students)</div>
                  <div className="ae-code" style={{ fontSize: '1.4rem', letterSpacing: '4px' }}>{success.exam_code}</div>
                </div>
                <span style={{ fontSize: '1.5rem' }}>🔑</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="abtn abtn--purple abtn--lg"
                  onClick={() => navigate(`/admin/exam/${success.id}/generate`)}>
                  ✨ Generate Questions with AI
                </button>
                <button className="abtn abtn--ghost"
                  onClick={() => navigate('/admin/dashboard')}>
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageName="Create Exam">
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="ap-header">
          <div>
            <div className="ap-title">➕ Create New Exam</div>
            <div className="ap-subtitle">Configure examination settings — AI will generate questions in the next step</div>
          </div>
          <button className="abtn abtn--ghost" onClick={() => navigate('/admin/dashboard')}>
            ← Dashboard
          </button>
        </div>

        {error && <div className="a-alert a-alert--error">⚠️ {error}</div>}

        <div className="a-card">
          <form onSubmit={handleSubmit} className="a-form">
            <div className="a-card-header">
              <span className="a-card-title">📝 Basic Information</span>
            </div>
            <div className="a-card-body">
              <div className="a-field">
                <label>Exam Title *</label>
                <input name="title" placeholder="e.g. JavaScript Arrays Mock Test" value={form.title} onChange={handleChange} required />
              </div>
              <div className="a-form-grid">
                <div className="a-field">
                  <label>Stream *</label>
                  <input name="stream" placeholder="e.g. Computer Science" value={form.stream} onChange={handleChange} required />
                </div>
                <div className="a-field">
                  <label>Subject *</label>
                  <input name="subject" placeholder="e.g. JavaScript" value={form.subject} onChange={handleChange} required />
                </div>
                <div className="a-field">
                  <label>Topic *</label>
                  <input name="topic" placeholder="e.g. Arrays and Methods" value={form.topic} onChange={handleChange} required />
                </div>
                <div className="a-field">
                  <label>Difficulty *</label>
                  <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                    <option value="Easy">🟢 Easy</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Hard">🔴 Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="a-card-header" style={{ borderTop: '1px solid #f1f5f9' }}>
              <span className="a-card-title">❓ Question Configuration</span>
            </div>
            <div className="a-card-body">
              <div className="a-form-grid">
                <div className="a-field">
                  <label>Number of Questions *</label>
                  <input type="number" name="question_count" placeholder="e.g. 10" value={form.question_count} onChange={handleChange} required min="1" max="50" />
                  <div className="a-field-hint">AI will generate exactly this many MCQs</div>
                </div>
                <div className="a-field">
                  <label>Marks per Question *</label>
                  <input type="number" name="marks_per_question" placeholder="e.g. 2" value={form.marks_per_question} onChange={handleChange} required min="1" />
                </div>
              </div>
              {form.question_count && form.marks_per_question && (
                <div className="a-alert a-alert--info">
                  📊 Total marks: <strong>{Number(form.question_count) * Number(form.marks_per_question)}</strong>
                </div>
              )}
            </div>

            <div className="a-card-header" style={{ borderTop: '1px solid #f1f5f9' }}>
              <span className="a-card-title">⚙️ Exam Configuration</span>
            </div>
            <div className="a-card-body">
              <div className="a-form-grid">
                <div className="a-field">
                  <label>Duration (minutes) *</label>
                  <input type="number" name="duration_minutes" placeholder="e.g. 30" value={form.duration_minutes} onChange={handleChange} required min="1" />
                </div>
                <div className="a-field">
                  <label>Student Capacity *</label>
                  <input type="number" name="capacity" placeholder="e.g. 100" value={form.capacity} onChange={handleChange} required min="1" />
                </div>
                <div className="a-field">
                  <label>Exam Date *</label>
                  <input type="date" name="scheduled_date" value={form.scheduled_date} onChange={handleChange} required />
                </div>
                <div className="a-field">
                  <label>Start Time *</label>
                  <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <div className="a-card-body" style={{ paddingTop: '0' }}>
              <button type="submit" className="abtn abtn--primary abtn--lg" disabled={loading}>
                {loading ? '⏳ Creating...' : '✅ Create Exam & Continue →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateExam;
