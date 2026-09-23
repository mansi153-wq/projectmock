import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../components/ui/Toast';
import api from '../../services/api';
import '../../styles/admin-my-exams.css';

const MyExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resetting, setResetting] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const loadExams = () => {
    setLoading(true);
    api.get('/exams/my-exams')
      .then(res => setExams(res.data.exams))
      .catch(() => toast('Failed to load exams', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadExams(); }, []);

  const filtered = useMemo(() => {
    return exams.filter(e => {
      const matchSearch = !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.subject.toLowerCase().includes(search.toLowerCase()) ||
        e.topic.toLowerCase().includes(search.toLowerCase()) ||
        e.exam_code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [exams, search, statusFilter]);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast(`Code "${code}" copied!`, 'success', 'Copied');
  };

  const handleReset = async (examId, title) => {
    if (!window.confirm(`Reset "${title}"?\n\nThis clears ALL student attempts and sets start time to NOW.`)) return;
    setResetting(examId);
    try {
      const res = await api.post(`/exams/${examId}/reset`);
      toast(res.data.message, 'success');
      loadExams();
    } catch (err) {
      toast(err.response?.data?.message || 'Reset failed', 'error');
    } finally { setResetting(null); }
  };

  const handleDelete = async (examId, title) => {
    if (!window.confirm(`Permanently delete "${title}"?\n\nAll questions, attempts and results will be deleted. This cannot be undone.`)) return;
    try {
      await api.delete(`/exams/${examId}`);
      toast(`"${title}" deleted.`, 'success');
      loadExams();
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatTime = t => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const STATUS_OPTIONS = ['all', 'draft', 'ready', 'scheduled', 'active', 'completed', 'generation_failed'];

  return (
    <AdminLayout pageName="My Exams" pageSubtitle="Manage, reset and monitor your examinations">
      <div className="my-exams-page">

        {/* Toolbar */}
        <div className="my-exams-toolbar">
          <div className="my-exams-toolbar-left">
            <div className="my-exams-search-wrap">
              <span className="my-exams-search-icon">🔍</span>
              <input
                className="my-exams-search"
                type="text"
                placeholder="Search by title, subject, code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="my-exams-filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <span className="my-exams-count">
              {filtered.length} of {exams.length} exams
            </span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/create-exam')}
          >
            ➕ Create New Exam
          </button>
        </div>

        {/* Table */}
        <div className="my-exams-table-wrap">
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
              <div className="spinner" style={{ margin: '0 auto 12px', width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spinSlow 0.8s linear infinite' }} />
              Loading exams...
            </div>
          ) : filtered.length === 0 ? (
            <div className="my-exams-empty">
              <div className="my-exams-empty-icon">📭</div>
              <div className="my-exams-empty-title">
                {search || statusFilter !== 'all' ? 'No exams match your filter' : 'No exams yet'}
              </div>
              <div className="my-exams-empty-sub">
                {search || statusFilter !== 'all' ? 'Try adjusting the search or filter' : 'Create your first exam to get started'}
              </div>
              {!search && statusFilter === 'all' && (
                <button className="btn btn-primary" onClick={() => navigate('/admin/create-exam')}>
                  ➕ Create Exam
                </button>
              )}
            </div>
          ) : (
            <table className="my-exams-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Exam</th>
                  <th>Code</th>
                  <th>Difficulty</th>
                  <th>Questions</th>
                  <th>Marks</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exam, idx) => (
                  <tr key={exam.id}>
                    <td style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem' }}>#{exam.id}</td>
                    <td>
                      <div className="exam-title-cell">
                        <div className="title">{exam.title}</div>
                        <div className="meta">{exam.subject} · {exam.topic}</div>
                      </div>
                    </td>
                    <td>
                      <span className="exam-code-pill" onClick={() => copyCode(exam.exam_code)} title="Click to copy">
                        {exam.exam_code}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${exam.difficulty?.toLowerCase()}`}
                        style={exam.difficulty === 'Easy' ? { background: '#dcfce7', color: '#15803d' }
                          : exam.difficulty === 'Medium' ? { background: '#fef9c3', color: '#92400e' }
                          : { background: '#fee2e2', color: '#991b1b' }}>
                        {exam.difficulty}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{exam.question_count}</td>
                    <td style={{ fontWeight: 600 }}>{exam.total_marks}</td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {formatDate(exam.scheduled_date)}<br />
                      <span style={{ color: '#94a3b8' }}>{formatTime(exam.start_time)}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${exam.status}`}>{exam.status}</span>
                    </td>
                    <td>
                      <div className="exam-actions">
                        {/* Generate / Preview */}
                        {['draft', 'generation_failed'].includes(exam.status) && (
                          <button className="tbl-btn success" onClick={() => navigate(`/admin/exam/${exam.id}/generate`)}>
                            ✨ Generate
                          </button>
                        )}
                        {exam.status === 'ready' && (
                          <button className="tbl-btn primary" onClick={() => navigate(`/admin/exam/${exam.id}/generate`)}>
                            👁 Preview
                          </button>
                        )}

                        {/* Results */}
                        {['scheduled', 'active', 'completed'].includes(exam.status) && (
                          <button className="tbl-btn primary" onClick={() => navigate(`/admin/exam/${exam.id}/students`)}>
                            📊 Results
                          </button>
                        )}

                        {/* Reset */}
                        {['scheduled', 'active', 'completed'].includes(exam.status) && (
                          <button
                            className="tbl-btn warning"
                            onClick={() => handleReset(exam.id, exam.title)}
                            disabled={resetting === exam.id}
                          >
                            {resetting === exam.id ? '⏳' : '🔄'} Reset
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          className="tbl-btn danger"
                          onClick={() => handleDelete(exam.id, exam.title)}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default MyExams;
