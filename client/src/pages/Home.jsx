import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/home.css';

const FEATURES = [
  { icon: '🤖', color: 'blue',   title: 'AI-Generated Questions',    desc: 'Google Gemini generates unique, accurate MCQs tailored to your subject, topic, and difficulty level instantly.' },
  { icon: '📝', color: 'purple', title: 'Custom Mock Tests',         desc: 'Admins configure every detail — stream, subject, topic, number of questions, marks, duration, and capacity.' },
  { icon: '⚡', color: 'green',  title: 'Instant Evaluation',        desc: 'Answers are evaluated automatically the moment you submit. No waiting, no manual checking.' },
  { icon: '🏆', color: 'amber',  title: 'Live Leaderboard',          desc: 'Real-time rankings update via Socket.IO as students submit. See where you stand the moment results are in.' },
  { icon: '📊', color: 'red',    title: 'Performance Analytics',     desc: 'Detailed breakdown of correct, incorrect, and unanswered questions with marks awarded per question.' },
  { icon: '💡', color: 'teal',   title: 'AI-Powered Feedback',       desc: 'Gemini analyzes your performance and generates personalized strengths, weaknesses, and study recommendations.' },
];

const STEPS = [
  { num: 1, icon: '⚙️', title: 'Choose Exam',         desc: 'Enter the exam code provided by your admin to join a scheduled test.' },
  { num: 2, icon: '📝', title: 'Take the Test',        desc: 'Answer MCQ questions with a server-controlled countdown timer.' },
  { num: 3, icon: '⚡', title: 'Get Instant Results',  desc: 'View your score, rank, and complete answer breakdown immediately.' },
  { num: 4, icon: '💡', title: 'Improve with AI',      desc: 'Read personalized AI feedback and recommendations to do better next time.' },
];

const WHY_REASONS = [
  { title: 'Saves Exam Preparation Time',       desc: 'No manual question setting — AI generates a full question paper in seconds.' },
  { title: 'Automatically Generated Papers',    desc: 'Each exam is unique. Gemini creates fresh questions every time.' },
  { title: 'Real-Time Exam Experience',          desc: 'Server-controlled timer, auto-save, and auto-submit mirror real exam conditions.' },
  { title: 'Instant Results',                   desc: 'Score, rank, and breakdown appear the moment you submit.' },
  { title: 'Personalized Performance Feedback', desc: 'AI identifies your weak areas and tells you exactly what to study next.' },
];

const CATEGORIES = [
  { icon: '💻', title: 'Programming',       count: 'C, Java, Python' },
  { icon: '🗄️', title: 'Database',          count: 'SQL, DBMS' },
  { icon: '🌐', title: 'Web Development',   count: 'HTML, CSS, JS' },
  { icon: '🔢', title: 'Data Structures',   count: 'Arrays, Trees, Graphs' },
  { icon: '🔗', title: 'Computer Networks', count: 'TCP/IP, OSI' },
  { icon: '⚙️', title: 'Operating Systems', count: 'Processes, Memory' },
];

const METRICS = [
  { label: 'DBMS Concepts',    pct: 88 },
  { label: 'SQL Queries',      pct: 72 },
  { label: 'Normalization',    pct: 54 },
  { label: 'Transactions',     pct: 61 },
];

export default function Home() {
  const navigate = useNavigate();
  const metricsRef = useRef(null);
  const [metricsVisible, setMetricsVisible] = useState(false);

  // One deliberate reveal: the subject-performance bars fill in once
  // the "Why Us" panel actually scrolls into view.
  useEffect(() => {
    const el = metricsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setMetricsVisible(true); }),
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Navbar scroll shadow
  useEffect(() => {
    const nav = document.querySelector('.home-nav');
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="home-page">

      {/* ── NAVBAR ── */}
      <nav className="home-nav">
        <Link to="/" className="home-nav-logo">
          <div className="home-nav-logo-icon">🎯</div>
          <div className="home-nav-logo-text">AI<span>MockTest</span></div>
        </Link>

        <ul className="home-nav-links">
          {['Home', 'Features', 'How It Works', 'About'].map(item => (
            <li key={item}>
              <a href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}>{item}</a>
            </li>
          ))}
        </ul>

        <div className="home-nav-actions">
          <Link to="/login" className="home-nav-login">Login</Link>
          <Link to="/register" className="home-nav-signup">Sign Up Free →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="home-hero" id="home">
        <div className="home-hero-inner">
          <div className="home-hero-content">
            <div className="home-hero-badge">
              <div className="home-hero-badge-dot" />
              Powered by Google Gemini AI
            </div>
            <h1 className="home-hero-heading">
              AI-powered mock tests for{' '}
              <span className="marker">
                smarter preparation
                <svg viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2,12 C60,4 240,2 298,10" stroke="#E3A21A" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.55" />
                </svg>
              </span>
            </h1>
            <p className="home-hero-desc">
              Automatically generate MCQ question papers, take real-time synchronized exams, get instant evaluation, and receive personalized AI performance feedback — all in one platform.
            </p>
            <div className="home-hero-btns">
              <Link to="/register" className="home-btn-primary">
                🚀 Get Started Free
              </Link>
              <Link to="/login" className="home-btn-secondary">
                Take a Mock Test →
              </Link>
            </div>
            <div className="home-hero-trust">
              <div className="home-hero-trust-text">Built with</div>
              <div className="home-hero-trust-badges">
                {['React', 'Node.js', 'Gemini AI', 'Socket.IO'].map(t => (
                  <span key={t} className="home-hero-trust-badge">{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="home-hero-visual">
            {/* Hand-drawn answer-sheet illustration — the paper being graded */}
            <svg className="home-hero-illustration" viewBox="0 0 480 380" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="120" y="24" width="230" height="300" rx="10" fill="#ffffff" stroke="#E7E1D3" strokeWidth="2" transform="rotate(-4 235 174)" />
              <rect x="150" y="10" width="230" height="300" rx="10" fill="#ffffff" stroke="#16213E" strokeWidth="2.5" transform="rotate(3 265 160)" />

              <g transform="rotate(3 265 160)">
                <rect x="170" y="34" width="150" height="10" rx="4" fill="#16213E" />
                <rect x="170" y="52" width="90" height="7" rx="3.5" fill="#E7E1D3" />

                {[86, 120, 154, 188, 222].map((y, i) => (
                  <g key={y}>
                    <rect x="170" y={y} width="190" height="24" rx="6"
                          fill={i === 1 ? '#FDF1EC' : i === 3 ? '#F0FAF6' : '#FAF8F3'}
                          stroke={i === 1 ? '#F3CBB8' : i === 3 ? '#BFE6D7' : '#E7E1D3'} strokeWidth="1.5" />
                    <circle cx="184" cy={y + 12} r="6" fill="none" stroke={i === 1 ? '#E4572E' : i === 3 ? '#1E8A78' : '#9AA1AE'} strokeWidth="2" />
                    {i === 3 && (
                      <path className="hero-tick-path" d="M181,196 L184,199 L189,192" stroke="#1E8A78" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    <rect x="200" y={y + 7} width={120 - i * 10} height="8" rx="4" fill="#D7D0BC" />
                  </g>
                ))}

                <rect x="170" y="262" width="190" height="34" rx="8" fill="#16213E" />
                <rect x="182" y="273" width="70" height="10" rx="5" fill="#EDE7D8" />
                <rect x="300" y="271" width="44" height="14" rx="7" fill="#E3A21A" />
              </g>

              <g className="hero-sparkle">
                <path d="M400,60 L406,76 L422,82 L406,88 L400,104 L394,88 L378,82 L394,76 Z" fill="#E3A21A" />
              </g>
              <circle cx="118" cy="298" r="7" fill="#1E8A78" opacity="0.7" />
              <circle cx="392" cy="230" r="5" fill="#E4572E" opacity="0.6" />
            </svg>

            <div className="home-hero-stats-row">
              <div className="home-hero-stat">
                <div className="home-hero-stat-val blue">92%</div>
                <div className="home-hero-stat-lbl">Accuracy</div>
              </div>
              <div className="home-hero-stat">
                <div className="home-hero-stat-val green">#2</div>
                <div className="home-hero-stat-lbl">Your Rank</div>
              </div>
              <div className="home-hero-stat">
                <div className="home-hero-stat-val purple">18/20</div>
                <div className="home-hero-stat-lbl">Score</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="home-stats-bg home-section-full">
        <div className="home-stats-grid">
          {[
            { num: '100', suffix: '+', label: 'Questions Generated' },
            { num: '50',  suffix: '+', label: 'Mock Tests Created' },
            { num: '500', suffix: '+', label: 'Students Enrolled' },
            { num: '95',  suffix: '%', label: 'Evaluation Accuracy' },
          ].map((s, i) => (
            <div key={i} className="home-stat-item">
              <div className="home-stat-number">{s.num}<span>{s.suffix}</span></div>
              <div className="home-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="home-features-bg home-section-full" id="features">
        <div className="home-section" style={{ padding: '0 0' }}>
          <div className="home-section-header center">
            <span className="home-section-label">What We Offer</span>
            <h2 className="home-section-title">Everything you need to <span>ace your exams</span></h2>
            <p className="home-section-sub">A complete assessment platform powered by AI — from question generation to personalized feedback.</p>
          </div>
          <div className="home-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="home-feature-card">
                <div className={`home-feature-icon ${f.color}`}>{f.icon}</div>
                <div className="home-feature-title">{f.title}</div>
                <div className="home-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="home-section" id="how-it-works">
        <div className="home-section-header center">
          <span className="home-section-label">Simple Process</span>
          <h2 className="home-section-title">How it <span>works</span></h2>
          <p className="home-section-sub">Four simple steps from joining an exam to improving your performance with AI.</p>
        </div>
        <div className="home-steps">
          {STEPS.map((s, i) => (
            <div key={i} className="home-step">
              <div className="home-step-number">{s.num}</div>
              <div className="home-step-icon">{s.icon}</div>
              <div className="home-step-title">{s.title}</div>
              <div className="home-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="home-features-bg home-section-full" id="about">
        <div className="home-section" style={{ padding: '0' }}>
          <div className="home-why">
            <div>
              <div className="home-section-header">
                <span className="home-section-label">Why Choose Us</span>
                <h2 className="home-section-title">Built for <span>real exam success</span></h2>
                <p className="home-section-sub">Designed to replicate real exam conditions while giving you AI-powered insights to improve.</p>
              </div>
              <div className="home-why-list">
                {WHY_REASONS.map((r, i) => (
                  <div key={i} className="home-why-item">
                    <div className="home-why-check">✓</div>
                    <div className="home-why-text">
                      <strong>{r.title}</strong>
                      {r.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="home-why-visual" ref={metricsRef}>
              <div className="home-why-visual-title">📊 Subject Performance Breakdown</div>
              <div className="home-why-metrics">
                {METRICS.map((m, i) => (
                  <div key={i} className="home-why-metric">
                    <div className="home-why-metric-label">{m.label}</div>
                    <div className="home-why-metric-bar-wrap">
                      <div
                        className={`home-why-metric-bar ${metricsVisible ? 'filled' : ''}`}
                        style={{ '--fill': `${m.pct}%`, transitionDelay: `${i * 0.1}s` }}
                      />
                    </div>
                    <div className="home-why-metric-val">{m.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="home-section">
        <div className="home-section-header center">
          <span className="home-section-label">Exam Topics</span>
          <h2 className="home-section-title">Available <span>exam categories</span></h2>
          <p className="home-section-sub">AI generates questions across all major computer science subjects.</p>
        </div>
        <div className="home-categories-grid">
          {CATEGORIES.map((c, i) => (
            <div key={i} className="home-category-card" onClick={() => navigate('/register')}>
              <div className="home-category-icon">{c.icon}</div>
              <div className="home-category-title">{c.title}</div>
              <div className="home-category-count">{c.count}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI FEEDBACK PREVIEW ── */}
      <section className="home-feedback-bg home-section-full">
        <div className="home-section" style={{ padding: '0' }}>
          <div className="home-feedback-inner">
            <div>
              <span className="home-section-label">AI Intelligence</span>
              <h2 className="home-section-title">Personalized <span>AI feedback</span></h2>
              <p className="home-section-sub" style={{ marginBottom: 24 }}>
                After every exam, Google Gemini analyzes your performance and generates personalized feedback — identifying your strengths, weaknesses, and exactly what to study next.
              </p>
              <ul style={{ paddingLeft: 20, color: '#6B7280', fontSize: '0.9rem', lineHeight: 2.2 }}>
                <li>Overall performance summary</li>
                <li>Topic-specific strengths</li>
                <li>Areas needing improvement</li>
                <li>Actionable study recommendations</li>
              </ul>
            </div>
            <div className="home-feedback-card">
              <div className="home-feedback-card-header">
                <div className="home-feedback-card-header-icon">🤖</div>
                <div className="home-feedback-card-header-title">AI Performance Feedback</div>
              </div>
              <div className="home-feedback-card-body">
                <div className="home-feedback-score-row">
                  <span className="home-feedback-score-label">Your Score</span>
                  <span className="home-feedback-score-value">78%</span>
                </div>
                <div className="home-feedback-score-bar">
                  <div className="home-feedback-score-fill" />
                </div>
                <div className="home-feedback-tags">
                  <div className="home-feedback-tag strength">
                    <div>
                      <div className="tag-label">✅ Strengths</div>
                      <div className="tag-text">Strong understanding of DBMS concepts and SQL joins</div>
                    </div>
                  </div>
                  <div className="home-feedback-tag weakness">
                    <div>
                      <div className="tag-label">⚠️ Needs Improvement</div>
                      <div className="tag-text">Normalization (3NF, BCNF) and transaction management</div>
                    </div>
                  </div>
                  <div className="home-feedback-tag tip">
                    <div>
                      <div className="tag-label">💡 AI Recommendation</div>
                      <div className="tag-text">Practice normalization forms with examples and revisit ACID properties</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="home-cta">
        <div className="home-cta-inner">
          <h2 className="home-cta-title">Ready to test your knowledge?</h2>
          <p className="home-cta-sub">
            Join the platform, take AI-generated mock tests, and get personalized feedback to improve your exam performance.
          </p>
          <div className="home-cta-btns">
            <Link to="/register" className="home-cta-btn-primary">🚀 Start Your Mock Test →</Link>
            <Link to="/login" className="home-cta-btn-outline">Already have an account? Login</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-top">
            <div>
              <div className="home-footer-brand-icon">🎯</div>
              <div className="home-footer-brand-name">AI Mock Test Platform</div>
              <p className="home-footer-brand-desc">
                An AI-powered online assessment platform that automates exam creation, evaluation, and personalized feedback using Google Gemini.
              </p>
            </div>
            <div>
              <div className="home-footer-col-title">Platform</div>
              <ul className="home-footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#about">About</a></li>
                <li><Link to="/register">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <div className="home-footer-col-title">Account</div>
              <ul className="home-footer-links">
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
                <li><Link to="/register">Admin Sign Up</Link></li>
                <li><Link to="/register">Student Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <div className="home-footer-col-title">Legal</div>
              <ul className="home-footer-links">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="home-footer-bottom">
            <div className="home-footer-copy">© 2026 AI Mock Test Platform. All rights reserved.</div>
            <div className="home-footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
