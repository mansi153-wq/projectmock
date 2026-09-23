import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';

const FEATURES = [
  { icon: '🎓', text: 'Smart exams with AI-generated questions' },
  { icon: '📊', text: 'Instant results, rankings & AI feedback' },
  { icon: '🔒', text: 'Secure, server-controlled examinations' },
];

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student', terms: false });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) return 'Enter a valid full name.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) return 'Enter a valid email address.';
    if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.terms) return 'Please accept the Terms & Conditions.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', { name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, role: form.role });
      toast('Account created! Redirecting to login...', 'success');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo-badge">🎯</div>
          <div className="auth-brand-name">Join AI Mock Test</div>
          <div className="auth-tagline">
            Create your account and start taking intelligent, AI-powered examinations today.
          </div>
          <div className="auth-features">
            {FEATURES.map((f, i) => (
              <div key={i} className="auth-feature slide-in-left" style={{ animationDelay: `${0.1 + i * 0.15}s` }}>
                <div className="auth-feature-icon">{f.icon}</div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <div className="auth-form-title">Create your account</div>
          <div className="auth-form-sub">Join as a student or administrator</div>

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" className="form-input" placeholder="Your full name" value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <input type={showPwd ? 'text' : 'password'} name="password" className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required />
                  <button type="button" className="input-toggle" onClick={() => setShowPwd(!showPwd)}>{showPwd ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" className="form-input" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} required />
                  <button type="button" className="input-toggle" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? '🙈' : '👁️'}</button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">I am a</label>
              <select name="role" className="form-select" value={form.role} onChange={handleChange} style={{ height: 44 }}>
                <option value="student">👨‍🎓 Student</option>
                <option value="admin">👨‍🎓 Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                I agree to the Terms & Conditions
              </label>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? '⏳ Creating account...' : 'Create Account →'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
