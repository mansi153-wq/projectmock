import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { useToast } from '../components/ui/Toast';
import api from '../services/api';

const CreateExam = () => {
  const [form, setForm] = useState({
    title: '', stream: '', subject: '', topic: '', difficulty: 'Medium',
    question_count: '', marks_per_question: '',
    duration_minutes: '', capacity: '',
    scheduled_date: '', start_time: ''
  });
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const totalMarks = form.question_count && form.marks_per_question
    ? Number(form.question_count) * Number(form.marks_per_question)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/exams', {
        ...form,
        question_count: Number(form.question_count),
        marks_per_question: Number(form.marks_per_question),
        duration_minutes: Number(form.duration_minutes),
        capacity: Number(form.capacity),
      });
      toast('Exam created successfully!', 'success');
      setSuccess(res.data.exam);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create exam', 'error');
    } finally { setLoading(false); }
  };

  if (success) return (
    <AdminLayout pageName="Create Exam">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="alert alert-success" style={{ marginBottom: 24, fontSize: '1rem', padding: '16px 20px' }}>
          🎉 Exam created successfully!
        </div>
        <div className="card scale-in">
          <div className="card-header">
            <span className="card-title">{success.title}</span>
            <span className={`badge badge-${success.status}`}>{success.status}</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 22 }}>
              {[['Total Marks', success.total_marks], ['Questions', success.question_count], ['Duration', `${success.duration_minutes} min`]].map(([l, v]) => (
                <div key={l} style={{ textAlign: 'center', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', padding: '12px 8px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{v}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="exam-code-box" style={{ marginBottom: 22 }}>
              <div>
                <div className="exam-code-label">Exam Code — share with students</div>
                <div className="exam-code-value">{success.exam_code}</div>
              </div>
              <span style={{ fontSize: '1.5rem' }}>🔑</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-accent btn-lg" onClick={() => navigate(`/admin/exam/${success.id}/generate`)}>
                ✨ Generate Questions with AI
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout pageName="Create Exam">
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <div className="page-title slide-up">➕ Create New Exam</div>
            <div className="page-subtitle slide-up stagger-1">Configure settings — AI generates questions in the next step</div>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="card slide-up stagger-1" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">📝 Basic Information</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Exam Title *</label>
                <input className="form-input" name="title" placeholder="e.g. JavaScript Arrays Mock Test" value={form.title} onChange={handleChange} required />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Stream *</label>
                  <input className="form-input" name="stream" placeholder="e.g. Computer Science" value={form.stream} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input className="form-input" name="subject" placeholder="e.g. JavaScript" value={form.subject} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Topic *</label>
                  <input className="form-input" name="topic" placeholder="e.g. Arrays and Methods" value={form.topic} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Difficulty *</label>
                  <select className="form-select" name="difficulty" value={form.difficulty} onChange={handleChange} style={{ height: 44 }}>
                    <option value="Easy">🟢 Easy</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Hard">🔴 Hard</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="card slide-up stagger-2" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">❓ Question Configuration</span></div>
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Number of Questions *</label>
                  <input type="number" className="form-input" name="question_count" placeholder="e.g. 10" value={form.question_count} onChange={handleChange} required min="1" max="50" />
                  <div className="form-hint">AI will generate exactly this many MCQs</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Marks per Question *</label>
                  <input type="number" className="form-input" name="marks_per_question" placeholder="e.g. 2" value={form.marks_per_question} onChange={handleChange} required min="1" />
                </div>
              </div>
              {totalMarks !== null && (
                <div className="alert alert-info slide-up">
                  📊 Total Marks = <strong>{form.question_count}</strong> × <strong>{form.marks_per_question}</strong> = <strong style={{ fontSize: '1.1rem' }}>{totalMarks}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="card slide-up stagger-3" style={{ marginBottom: 24 }}>
            <div className="card-header"><span className="card-title">⚙️ Exam Configuration</span></div>
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Duration (minutes) *</label>
                  <input type="number" className="form-input" name="duration_minutes" placeholder="e.g. 30" value={form.duration_minutes} onChange={handleChange} required min="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Student Capacity *</label>
                  <input type="number" className="form-input" name="capacity" placeholder="e.g. 100" value={form.capacity} onChange={handleChange} required min="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Date *</label>
                  <input type="date" className="form-input" name="scheduled_date" value={form.scheduled_date} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input type="time" className="form-input" name="start_time" value={form.start_time} onChange={handleChange} required />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-xl slide-up stagger-4" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Creating...</> : '✅ Create Exam & Continue →'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default CreateExam;
