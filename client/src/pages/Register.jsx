import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';

const FEATURES = [
  { icon: '🎓', text: 'Smart exams with AI-generated questions' },
  { icon: '📊', text: 'Instant results, rankings & AI feedback' },
  { icon: '🔒', text: 'Secure, server-controlled examinations' },
];

const RESEND_COOLDOWN = 60;

const Register = () => {
  // Step: 'form' | 'otp'
  const [step, setStep] = useState('form');

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'student', terms: false,
  });
  const [otp, setOtp] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) return 'Enter a valid full name.';
    if (!form.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) return 'Enter a valid email address.';
    if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.terms) return 'Please accept the Terms & Conditions.';
    return '';
  };

  // Start resend countdown
  const startResendTimer = () => {
    setResendTimer(RESEND_COOLDOWN);
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });
      setStep('otp');
      startResendTimer();
      toast('Verification code sent to your email!', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally { setLoading(false); }
  };

  // Step 2: Verify OTP + create account
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) { setError('Enter the 6-digit code sent to your email.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', {
        email: form.email.trim().toLowerCase(),
        otp: otp.trim(),
        name: form.name.trim(),
        password: form.password,
        role: form.role,
      });
      toast('Account created successfully! Please log in.', 'success');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      await api.post('/auth/resend-otp', {
        email: form.email.trim().toLowerCase(),
        purpose: 'registration',
      });
      startResendTimer();
      toast('New verification code sent!', 'info');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    }
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

          {/* ── STEP 1: Registration Form ── */}
          {step === 'form' && (
            <>
              <div className="auth-form-title">Create your account</div>
              <div className="auth-form-sub">Join as a student or administrator</div>

              {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

              <form onSubmit={handleSendOtp}>
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
                      <button type="button" className="input-toggle" onClick={() => setShowPwd(p => !p)}>{showPwd ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div className="input-wrapper">
                      <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" className="form-input" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} required />
                      <button type="button" className="input-toggle" onClick={() => setShowConfirm(p => !p)}>{showConfirm ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">I am a</label>
                  <select name="role" className="form-select" value={form.role} onChange={handleChange} style={{ height: 44 }}>
                    <option value="student">👨‍🎓 Student</option>
                    <option value="admin">👨‍💼 Administrator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                    I agree to the Terms & Conditions
                  </label>
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? '⏳ Sending verification code...' : 'Continue → Verify Email'}
                </button>
              </form>

              <div className="auth-footer">
                Already have an account? <Link to="/login">Sign in</Link>
              </div>
            </>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 'otp' && (
            <>
              <div className="auth-form-title">Verify Your Email ✉️</div>
              <div className="auth-form-sub">
                We sent a 6-digit code to <strong>{form.email}</strong>
              </div>

              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                📧 Check your inbox (and spam folder). The code expires in <strong>5 minutes</strong>.
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

              <form onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label className="form-label">Verification Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    maxLength={6}
                    style={{ fontFamily: 'var(--mono)', fontSize: '1.3rem', letterSpacing: '6px', textAlign: 'center' }}
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? '⏳ Verifying...' : '✅ Verify & Create Account'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Didn't receive the code?{' '}
                {resendTimer > 0 ? (
                  <span style={{ color: 'var(--text-subtle)' }}>Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => { setStep('form'); setOtp(''); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  ← Change email address
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;
