import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create Exam</h2>
      <Link to="/admin/dashboard">Back to Dashboard</Link>

      {success ? (
        <div>
          <p style={{ color: 'green' }}>Exam created successfully.</p>
          <p><strong>Exam Code:</strong> {success.exam_code}</p>
          <p><strong>Total Marks:</strong> {success.total_marks}</p>
          <p><strong>Status:</strong> {success.status}</p>
          <br />
          <button onClick={() => navigate(`/admin/exam/${success.id}/generate`)}>
            Generate Questions with AI
          </button>
          &nbsp;&nbsp;
          <button onClick={() => navigate('/admin/dashboard')}>Go to Dashboard</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Title</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div>
            <label>Stream</label>
            <input name="stream" value={form.stream} onChange={handleChange} required />
          </div>
          <div>
            <label>Subject</label>
            <input name="subject" value={form.subject} onChange={handleChange} required />
          </div>
          <div>
            <label>Topic</label>
            <input name="topic" value={form.topic} onChange={handleChange} required />
          </div>
          <div>
            <label>Difficulty</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div>
            <label>Number of Questions</label>
            <input type="number" name="question_count" value={form.question_count} onChange={handleChange} required min="1" />
          </div>
          <div>
            <label>Marks per Question</label>
            <input type="number" name="marks_per_question" value={form.marks_per_question} onChange={handleChange} required min="1" />
          </div>
          <div>
            <label>Duration (minutes)</label>
            <input type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} required min="1" />
          </div>
          <div>
            <label>Student Capacity</label>
            <input type="number" name="capacity" value={form.capacity} onChange={handleChange} required min="1" />
          </div>
          <div>
            <label>Exam Date</label>
            <input type="date" name="scheduled_date" value={form.scheduled_date} onChange={handleChange} required />
          </div>
          <div>
            <label>Start Time</label>
            <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
        </form>
      )}
    </div>
  );
};

export default CreateExam;
