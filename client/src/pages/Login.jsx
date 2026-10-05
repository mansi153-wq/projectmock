import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

const FEATURES = [
  { icon: '🤖', text: 'AI-powered MCQ generation with Google Gemini' },
  { icon: '⏱️', text: 'Server-controlled exam timing & auto-submit' },
  { icon: '🏆', text: 'Live leaderboard with real-time Socket.IO updates' },
];

const RESEND_COOLDOWN = 60;

// ── Sub-component: Forgot Password flow ─────────────
const ForgotPassword = ({ onBack }) => {
  // step: 'email' | 'otp' | 'reset' | 'done'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const toast = useToast();

  const startResendTimer = () => {
    setResendTimer(RESEND_COOLDOWN);
    const interval = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setStep('otp');
      startResendTimer();
      toast('Reset code sent to your email!', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setStep('reset');
    setError('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      setStep('done');
      toast('Password reset successfully!', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please try again.');
      setStep('otp'); // Go back to OTP step on error
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      await api.post('/auth/resend-otp', { email: email.trim().toLowerCase(), purpose: 'password_reset' });
      startResendTimer();
      toast('New reset code sent!', 'info');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    }
  };

  return (
    <>
      {step === 'email' && (
        <>
          <div className="auth-form-title">Forgot Password? 🔑</div>
          <div className="auth-form-sub">Enter your registered email and we'll send you a reset code.</div>
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="you@example.com"
                value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? '⏳ Sending...' : 'Send Reset Code →'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button type="button" onClick={onBack}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
              ← Back to Login
            </button>
          </div>
        </>
      )}

      {step === 'otp' && (
        <>
          <div className="auth-form-title">Enter Reset Code 📩</div>
          <div className="auth-form-sub">A 6-digit code was sent to <strong>{email}</strong></div>
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input type="text" className="form-input" placeholder="6-digit code"
                value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                maxLength={6}
                style={{ fontFamily: 'var(--mono)', fontSize: '1.3rem', letterSpacing: '6px', textAlign: 'center' }}
                required autoFocus />
            </div>
            <button type="submit" className="auth-submit">Continue →</button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Didn't receive it?{' '}
            {resendTimer > 0 ? (
              <span style={{ color: 'var(--text-subtle)' }}>Resend in {resendTimer}s</span>
            ) : (
              <button type="button" onClick={handleResend}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                Resend Code
              </button>
            )}
          </div>
        </>
      )}

      {step === 'reset' && (
        <>
          <div className="auth-form-title">Set New Password 🔒</div>
          <div className="auth-form-sub">Choose a strong password for your account.</div>
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-wrapper">
                <input type={showPwd ? 'text' : 'password'} className="form-input" placeholder="Min. 8 characters"
                  value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(''); }} required />
                <button type="button" className="input-toggle" onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" placeholder="Re-enter password"
                value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(''); }} required />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? '⏳ Resetting...' : 'Reset Password →'}
            </button>
          </form>
        </>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <div className="auth-form-title">Password Reset!</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '12px 0 24px' }}>
            Your password has been updated. You can now log in with your new password.
          </p>
          <button type="button" className="auth-submit" onClick={onBack}>
            Go to Login →
          </button>
        </div>
      )}
    </>
  );
};

// ── Main Login Component ─────────────────────────────
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      login(res.data.user, res.data.token);
      toast('Welcome back, ' + res.data.user.name + '!', 'success');
      navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo-badge">🎯</div>
          <div className="auth-brand-name">AI Mock Test</div>
          <div className="auth-tagline">
            The intelligent online assessment platform. Generate AI-powered exams and evaluate students in real time.
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

          {showForgot ? (
            <ForgotPassword onBack={() => setShowForgot(false)} />
          ) : (
            <>
              <div className="auth-form-title">Welcome back 👋</div>
              <div className="auth-form-sub">Sign in to your account to continue</div>

              {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="you@example.com"
                    value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Password
                    <button type="button"
                      onClick={() => setShowForgot(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                      Forgot password?
                    </button>
                  </label>
                  <div className="input-wrapper">
                    <input type={showPwd ? 'text' : 'password'} className="form-input" placeholder="••••••••"
                      value={password} onChange={e => { setPassword(e.target.value); setError(''); }} required />
                    <button type="button" className="input-toggle" onClick={() => setShowPwd(p => !p)}>
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? '⏳ Signing in...' : 'Sign In →'}
                </button>
              </form>

              <div className="auth-footer">
                Don't have an account? <Link to="/register">Create one</Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
