import React, { useState, useEffect, useRef } from 'react';
import PRInputForm from './components/PRInputForm';
import LoadingState from './components/LoadingState';
import FinalReviewPanel from './components/FinalReviewPanel';
import AgentFindingsCard from './components/AgentFindingsCard';
import { reviewPR } from './api/client';
import logoImg from './assets/logo.jpg';

/* ─── Data ───────────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Scanner', icon: ScannerIcon },
  { id: 'about', label: 'About', icon: AboutIcon },
];

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */

function ScannerIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function AboutIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ChevronRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/* ─── Severity badge ─────────────────────────────────────────────────────── */

function SeverityBadge({ level }) {
  const map = {
    CRITICAL: 'badge-sev-critical',
    HIGH: 'badge-sev-high',
    MEDIUM: 'badge-sev-medium',
    LOW: 'badge-sev-low',
  };
  return <span className={`badge-sev ${map[level] || 'badge-sev-low'}`}>{level}</span>;
}

/* ─── Typing animation for the hero tagline ──────────────────────────────── */

function TypedText({ phrases }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const current = phrases[idx];
    if (!deleting && displayed.length < current.length) {
      timeoutRef.current = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 55);
    } else if (!deleting && displayed.length === current.length) {
      timeoutRef.current = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      timeoutRef.current = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 28);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((prev) => (prev + 1) % phrases.length);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [displayed, deleting, idx, phrases]);

  return (
    <span className="typed-text">
      {displayed}
      <span className="typed-cursor">|</span>
    </span>
  );
}

/* ─── Animated counter ───────────────────────────────────────────────────── */

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}{suffix}</>;
}

/* ─── Live scan terminal window ─────────────────────────────────────────── */

function LiveScanWindow() {
  return (
    <div className="terminal-window">
      <div className="terminal-titlebar">
        <div className="terminal-dots">
          <span className="tdot tdot-red" />
          <span className="tdot tdot-yellow" />
          <span className="tdot tdot-green" />
        </div>
        <span className="terminal-title">
          <span className="pulse-dot" />
          Live PR Scan
        </span>
        <span className="terminal-badge">Active</span>
      </div>

      <div className="terminal-body">
        {/* Finding path */}
        <div className="exploit-card">
          <div className="exploit-card-header">
            <div>
              <span className="exploit-label">VULNERABILITY PATH</span>
              <span className="exploit-cwe">CWE-89 (SQL Injection)</span>
            </div>
            <span className="exploit-pill">Flagged by Security Agent</span>
          </div>
          <div className="exploit-trace">
            <code className="trace-node trace-source">request.query</code>
            <span className="trace-arrow">→</span>
            <code className="trace-node trace-func">execute()</code>
            <span className="trace-arrow">→</span>
            <code className="trace-node trace-sink">raw SQL statement</code>
          </div>
          <div className="exploit-score-row">
            <span className="exploit-score-label">CONFIDENCE</span>
            <div className="exploit-score-bar">
              <div className="exploit-score-fill" style={{ width: '91%' }} />
            </div>
            <span className="exploit-score-num">91%</span>
          </div>
        </div>

        {/* Findings list */}
        <div className="findings-list">
          <div className="findings-list-item findings-list-item--active">
            <div className="fi-left">
              <SeverityBadge level="CRITICAL" />
              <div className="fi-text">
                <span className="fi-path">backend/app/routes/auth.py</span>
                <span className="fi-desc">query param → raw SQL format</span>
              </div>
            </div>
            <div className="fi-score">
              <div className="fi-bar-wrap"><div className="fi-bar fi-bar--critical" style={{ width: '91%' }} /></div>
              <span className="fi-num">91%</span>
            </div>
          </div>

          <div className="findings-list-item">
            <div className="fi-left">
              <SeverityBadge level="HIGH" />
              <div className="fi-text">
                <span className="fi-path">backend/app/config.py</span>
                <span className="fi-desc">hardcoded credential in fallback</span>
              </div>
            </div>
            <div className="fi-score">
              <div className="fi-bar-wrap"><div className="fi-bar fi-bar--high" style={{ width: '84%' }} /></div>
              <span className="fi-num">84%</span>
            </div>
          </div>

          <div className="findings-list-item">
            <div className="fi-left">
              <SeverityBadge level="MEDIUM" />
              <div className="fi-text">
                <span className="fi-path">backend/app/main.py</span>
                <span className="fi-desc">subprocess.run with shell=True</span>
              </div>
            </div>
            <div className="fi-score">
              <div className="fi-bar-wrap"><div className="fi-bar fi-bar--medium" style={{ width: '63%' }} /></div>
              <span className="fi-num">63%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main App ────────────────────────────────────────────────────────────── */

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [reviewData, setReviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleReviewSubmit = async (url) => {
    setIsLoading(true);
    setError(null);
    setReviewData(null);
    setCurrentView('dashboard');
    try {
      const result = await reviewPR(url);
      setReviewData(result);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during review.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateTo = (view) => {
    setCurrentView(view);
    if (view === 'dashboard') { setReviewData(null); setError(null); }
  };

  return (
    <div className={`cs-layout ${sidebarCollapsed ? 'cs-layout--collapsed' : ''}`}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="cs-sidebar">
        <div className="cs-sidebar-inner">

          {/* Brand */}
          <div className="cs-brand" onClick={() => navigateTo('dashboard')}>
            <div className="cs-brand-logo">
              <img src={logoImg} alt="CodeVerdict Logo" className="cs-logo-img" />
            </div>
            <span className="cs-brand-name">CodeVerdict</span>
          </div>

          {/* Nav */}
          <nav className="cs-nav">
            <div className="cs-nav-label">NAVIGATION</div>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`cs-nav-btn ${currentView === id ? 'cs-nav-btn--active' : ''}`}
                onClick={() => navigateTo(id)}
              >
                <span className="cs-nav-icon"><Icon size={17} /></span>
                <span className="cs-nav-label-text">{label}</span>
                {currentView === id && <span className="cs-nav-indicator" />}
              </button>
            ))}
          </nav>

          {/* Stats */}
          <div className="cs-sidebar-stats">
            <div className="cs-stat-header">LIVE METRICS</div>
            <div className="cs-stat-row">
              <span className="cs-stat-name">Precision</span>
              <span className="cs-stat-value cs-stat-value--green">87.5%</span>
            </div>
            <div className="cs-stat-row">
              <span className="cs-stat-name">Recall</span>
              <span className="cs-stat-value cs-stat-value--green">100%</span>
            </div>
            <div className="cs-stat-row">
              <span className="cs-stat-name">Benchmark PRs</span>
              <span className="cs-stat-value">3</span>
            </div>
            <div className="cs-stat-row" style={{ border: 'none' }}>
              <span className="cs-stat-name">Status</span>
              <span className="cs-stat-value cs-stat-value--pulse">
                <span className="cs-pulse-dot" />
                Sandbox
              </span>
            </div>
          </div>

          {/* Sidebar footer */}
          <div className="cs-sidebar-footer">
            <div className="cs-sidebar-footer-tag">
              <span className="cs-footer-dot" />
              Offline Mock Active
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="cs-main">

        {/* Topbar */}
        <header className="cs-topbar">
          <div className="cs-topbar-left">
            <button className="cs-collapse-btn" onClick={() => setSidebarCollapsed(p => !p)} title="Toggle sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            {/* Breadcrumb */}
            <div className="cs-breadcrumb">
              <span className="cs-breadcrumb-root">CodeVerdict</span>
              <ChevronRight />
              <span className="cs-breadcrumb-current">
                {NAV_ITEMS.find(n => n.id === currentView)?.label}
              </span>
            </div>
          </div>
          <div className="cs-topbar-right">
            <div className="cs-topbar-status">
              <span className="cs-status-dot cs-status-dot--live" />
              <span className="cs-status-text">Sandbox Active</span>
            </div>
            <button className="cs-topbar-signin">Sign in</button>
            <button className="cs-topbar-cta" onClick={() => navigateTo('dashboard')}>
              Start free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="cs-content">

          {/* ── VIEW: SCANNER / DASHBOARD ─────────────────────── */}
          {currentView === 'dashboard' && (
            <div className="cs-page">

              {!reviewData && !isLoading && (
                <>
                  {/* Hero */}
                  <div className="cs-hero">
                    <div className="cs-hero-left">
                      <div className="cs-hero-badge">
                        <span className="cs-badge-pulse" />
                        Four agents review. One verdict ships.
                      </div>

                      <h1 className="cs-hero-title">
                        The calm security layer for{' '}
                        <span className="cs-gradient-text">
                          <TypedText phrases={['fast shipping teams.', 'python projects.', 'production codebases.', 'every PR you push.']} />
                        </span>
                      </h1>

                      <p className="cs-hero-sub">
                        CodeVerdict reviews every pull request with four specialized AI agents — security, quality, performance, and test coverage — each grounded in real tooling and reference material. A final synthesis step merges their findings into one clear, ranked review.
                      </p>

                      <div className="cs-hero-stats">
                        <div className="cs-hstat">
                          <span className="cs-hstat-num"><AnimatedCounter target={87} suffix="%" /></span>
                          <span className="cs-hstat-lbl">Precision</span>
                        </div>
                        <div className="cs-hstat-divider" />
                        <div className="cs-hstat">
                          <span className="cs-hstat-num"><AnimatedCounter target={100} suffix="%" /></span>
                          <span className="cs-hstat-lbl">Recall</span>
                        </div>
                        <div className="cs-hstat-divider" />
                        <div className="cs-hstat">
                          <span className="cs-hstat-num">4</span>
                          <span className="cs-hstat-lbl">Specialist Agents</span>
                        </div>
                      </div>

                      <PRInputForm onSubmit={handleReviewSubmit} isLoading={isLoading} />
                    </div>

                    <div className="cs-hero-right">
                      <LiveScanWindow />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="cs-error-card">
                  <div className="cs-error-icon">⚠️</div>
                  <div>
                    <h4>Analysis Failed</h4>
                    <p>{error}</p>
                    <p className="cs-error-tip">Verify that your backend server is running and <code>GROQ_API_KEY</code> is configured.</p>
                  </div>
                </div>
              )}

              {isLoading && <LoadingState />}

              {reviewData && (
                <div className="cs-results-container">
                  <button className="cs-back-btn" onClick={() => { setReviewData(null); setError(null); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    New Scan
                  </button>
                  <FinalReviewPanel reviewData={reviewData} />
                  <AgentFindingsCard agentBreakdowns={reviewData.agent_breakdowns} />
                </div>
              )}
            </div>
          )}

          {/* ── VIEW: ABOUT ───────────────────────────────────── */}
          {currentView === 'about' && (
            <div className="cs-page">
              <div className="cs-page-header">
                <span className="cs-page-tag">System Architecture</span>
                <h2 className="cs-page-title">Honest Agentic Review</h2>
                <p className="cs-page-desc">
                  CodeVerdict is a stateless developer portfolio project showcasing a multi-agent review workflow for Python code.
                </p>
              </div>

              <div className="cs-about-grid">
                {/* Architecture Card */}
                <div className="cs-about-card cs-about-card--span2">
                  <div className="cs-about-card-icon">⚡</div>
                  <h3 className="cs-about-card-title">How It Works</h3>
                  <p className="cs-about-card-text" style={{ marginBottom: '1.25rem' }}>
                    CodeVerdict integrates four specialist AI agents running in parallel to analyze your pull requests, combined with a central synthesizer agent that compiles the final report.
                  </p>
                  
                  <div className="cs-about-agents-list">
                    <div className="cs-about-agent-item" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--accent-red)', paddingLeft: '0.75rem' }}>
                      <span className="cs-about-agent-name" style={{ fontWeight: '600', color: 'var(--accent-red)', display: 'block', marginBottom: '0.25rem' }}>Security Agent</span>
                      <span className="cs-about-agent-desc">Runs Bandit static analysis + Llama-3 reasoning to isolate vulnerabilities (CWE) and retrieve secure coding guidelines via local FAISS/NumPy vectors.</span>
                    </div>
                    <div className="cs-about-agent-item" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--accent-yellow)', paddingLeft: '0.75rem' }}>
                      <span className="cs-about-agent-name" style={{ fontWeight: '600', color: 'var(--accent-yellow)', display: 'block', marginBottom: '0.25rem' }}>Quality Agent</span>
                      <span className="cs-about-agent-desc">Evaluates syntax validity, PEP 8 styling conventions, missing docstrings, and overall code structural cleanliness.</span>
                    </div>
                    <div className="cs-about-agent-item" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--indigo)', paddingLeft: '0.75rem' }}>
                      <span className="cs-about-agent-name" style={{ fontWeight: '600', color: 'var(--indigo)', display: 'block', marginBottom: '0.25rem' }}>Performance Agent</span>
                      <span className="cs-about-agent-desc">Detects algorithmic bottlenecks, inefficient iterations, unoptimized database query patterns, and possible memory leaks.</span>
                    </div>
                    <div className="cs-about-agent-item" style={{ borderLeft: '3px solid var(--accent-green)', paddingLeft: '0.75rem' }}>
                      <span className="cs-about-agent-name" style={{ fontWeight: '600', color: 'var(--accent-green)', display: 'block', marginBottom: '0.25rem' }}>Coverage Agent</span>
                      <span className="cs-about-agent-desc">Inspects lines of code modified, outlines test gaps, and recommends mock tests and unit test cases.</span>
                    </div>
                  </div>
                </div>

                {/* Technology Stack Card */}
                <div className="cs-about-card">
                  <div className="cs-about-card-icon">🛠️</div>
                  <h3 className="cs-about-card-title">Technology Stack</h3>
                  <ul className="cs-about-list" style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                    <li><strong>FastAPI</strong> — High-performance Python backend server</li>
                    <li><strong>React & Vite</strong> — Single Page Application frontend</li>
                    <li><strong>Groq Cloud API</strong> — Runs Llama-3.3-70b-versatile with low latency</li>
                    <li><strong>Bandit SAST</strong> — Real static application security scanning</li>
                    <li><strong>NumPy Similarity</strong> — Lightweight vector memory fallback</li>
                  </ul>
                </div>

                {/* Project Philosophy Card */}
                <div className="cs-about-card">
                  <div className="cs-about-card-icon">⚖️</div>
                  <h3 className="cs-about-card-title">Stateless Design</h3>
                  <p className="cs-about-card-text">
                    CodeVerdict does not open auto-fix PRs, execute dynamic exploit scripts, or store history. Every analysis is executed stateless and in isolation, ensuring developers have full oversight and absolute control.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="cs-footer">
            <span>© 2026 CodeVerdict</span>
            <span>·</span>
            <span>Built for Technical Review Portfolio</span>
            <span>·</span>
            <span>Offline Mock Sandbox</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
