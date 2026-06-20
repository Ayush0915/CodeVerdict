import React, { useState, useEffect, useRef } from 'react';
import PRInputForm from './components/PRInputForm';
import LoadingState from './components/LoadingState';
import FinalReviewPanel from './components/FinalReviewPanel';
import AgentFindingsCard from './components/AgentFindingsCard';
import { reviewPR } from './api/client';
import logoImg from './assets/logo.jpg';

/* ─── Data ───────────────────────────────────────────────────────────────── */

const PROFILES_DATA = {
  web: {
    icon: '🌐',
    title: 'Web Application Security',
    desc: 'Full OWASP Top 10 coverage for server-rendered and SPA apps. XSS, CSRF, SQLi, broken auth.',
    badges: ['OWASP Top 10', 'CWE Top 25'],
    detects: [
      'SQL / NoSQL injection via cross-file data-flow tracing',
      'Stored and reflected XSS across templates and responses',
      'CSRF and session fixation vulnerabilities',
      'Broken authentication and missing authorization guards',
    ],
    finding: {
      path: 'src/controllers/users.ts:47',
      title: 'SQL injection via unsanitized `id` param',
      severity: 'CRITICAL',
      ctis: '91',
      cwe: 'CWE-89',
      map: 'A03:2021',
      desc: 'Unsanitized `id` param flows from req.params into a raw SQL string with no parameterization or escaping applied.',
    },
  },
  backend: {
    icon: '⚙️',
    title: 'API / Backend Integrity',
    desc: 'Deep parsing of REST, GraphQL, and gRPC endpoints. Analyzes route parameters, headers, and request bodies.',
    badges: ['OWASP API Top 10', 'gRPC / REST'],
    detects: [
      'Mass assignment and parameter pollution vulnerabilities',
      'Broken object-level authorization (BOLA / IDOR)',
      'SSRF (Server-Side Request Forgery) in outbound HTTP clients',
      'Improper rate limiting and resource exhaustion vectors',
    ],
    finding: {
      path: 'backend/routes/billing.py:112',
      title: 'BOLA via unvalidated tenant ownership checks',
      severity: 'CRITICAL',
      ctis: '88',
      cwe: 'CWE-285',
      map: 'API01:2023',
      desc: 'The endpoint fetches billing records using path variable billing_id without verifying the requesting user belongs to the associated organization.',
    },
  },
  android: {
    icon: '📱',
    title: 'Android MOB Security',
    desc: 'Static analysis for Android applications written in Kotlin and Java. Scans intents, permissions, and local storage.',
    badges: ['OWASP Mobile Top 10', 'Android SDK'],
    detects: [
      'Insecure data storage in shared preferences and external storage',
      'Implicit intents exposing sensitive actions to malicious apps',
      'Hardcoded API credentials and cryptographic keys',
      'Insecure SSL/TLS validations and certificate pinning bypasses',
    ],
    finding: {
      path: 'android/app/src/AuthService.kt:84',
      title: 'Hardcoded cryptographic key in keystore backup',
      severity: 'HIGH',
      ctis: '84',
      cwe: 'CWE-321',
      map: 'M02:2023',
      desc: 'Cryptographic operations are initialized using a static hardcoded key string instead of retrieving it securely from the Android Keystore system.',
    },
  },
  ios: {
    icon: '🍎',
    title: 'iOS MOB Secure Coding',
    desc: 'Swift and Objective-C static analysis identifying memory safety, secure storage, and networking issues.',
    badges: ['OWASP Mobile', 'iOS Secure Coding'],
    detects: [
      'Keychain storage configured with weak accessibility flags',
      'Use of unsafe API functions (e.g. memory copies) in Swift/C bridging',
      'Local database file encryption (SQLCipher) missing or weak',
      'Arbitrary HTTP loads permitted in Info.plist (App Transport Security)',
    ],
    finding: {
      path: 'ios/Classes/SecureStorage.swift:23',
      title: 'Keychain item accessible before first user unlock',
      severity: 'MEDIUM',
      ctis: '68',
      cwe: 'CWE-522',
      map: 'M01:2023',
      desc: 'Sensitive session token stored in Keychain with kSecAttrAccessibleAfterFirstUnlock, meaning it remains accessible while the device is locked.',
    },
  },
  cloud: {
    icon: '☁️',
    title: 'Cloud & IaC Configuration',
    desc: 'Scans Terraform, CloudFormation, Helm charts, and Dockerfiles to prevent infrastructure-as-code misconfigurations.',
    badges: ['CIS Benchmarks', 'IaC Security'],
    detects: [
      'Overly permissive IAM policies and security group rules (e.g., 0.0.0.0/0)',
      'Unencrypted S3 buckets, databases, and key vaults at rest',
      'Containers configured to run as root or with privileged access',
      'Missing secret encryption keys or public resource exposure',
    ],
    finding: {
      path: 'terraform/prod/vpc.tf:63',
      title: 'Security group ingress rule allows SSH from 0.0.0.0/0',
      severity: 'MEDIUM',
      ctis: '63',
      cwe: 'CWE-732',
      map: 'CIS-5.1',
      desc: 'VPC security group rules expose SSH port 22 directly to the public internet, leaving host instances open to brute force attempts.',
    },
  },
  secrets: {
    icon: '🔑',
    title: 'Secrets & Supply Chain Guard',
    desc: 'Detects active API keys, database connection strings, SSH keys, and outdated/malicious packages in package manager registries.',
    badges: ['Secret Detection', 'SBOM Audit'],
    detects: [
      'Committed AWS, Google Cloud, Slack, Groq, and GitHub API credentials',
      'Database connection strings containing plaintext credentials',
      'Vulnerable open-source dependencies (via OSV database integration)',
      'Package confusion and dependency hijacking risks in npm/pip',
    ],
    finding: {
      path: 'mobile/AuthManager.kt:84',
      title: 'Committed plain-text JWT sign secret key',
      severity: 'HIGH',
      ctis: '84',
      cwe: 'CWE-798',
      map: 'A07:2021',
      desc: 'Plain-text JWT token signing secret key was committed directly to source control, compromising all security parameters.',
    },
  },
  ai: {
    icon: '🤖',
    title: 'Agentic AI Safety Gate',
    desc: 'Reviews prompts, model integrations, RAG injection guards, and tool execution boundaries in agentic systems.',
    badges: ['OWASP LLM Top 10', 'Agent Security'],
    detects: [
      'Indirect prompt injection vulnerabilities in RAG data pipelines',
      'Tool calls executing shell scripts or system queries without sandboxing',
      'Over-reliance on model outputs in sensitive administrative execution paths',
      'Unbounded tool inputs leading to denial of service or arbitrary code execution',
    ],
    finding: {
      path: 'backend/agents/sql_tool.py:34',
      title: 'Arbitrary SQL execution tool exposed to LLM output',
      severity: 'CRITICAL',
      ctis: '95',
      cwe: 'CWE-89',
      map: 'LLM01:2023',
      desc: 'The database agent executes model-generated query text directly against the primary SQL server without parameter validation or safe read-only limits.',
    },
  },
};

const PIPELINE_NODES = [
  { id: 'pr', icon: '⬢', label: 'Pull Request', sub: 'GitHub · GitLab · Bitbucket', color: '#6366f1' },
  { id: 'graph', icon: '⬡', label: 'Codegraph', sub: 'Imports · impact · entry-points', color: '#8b5cf6' },
  { id: 'security', icon: '⬢', label: 'Security Pipeline', sub: '22 analysis layers', color: '#ec4899' },
  { id: 'engines', icon: '⬡', label: 'AI Engines', sub: 'Flash · Turbo · Deep consensus', color: '#f59e0b', stacked: true },
  { id: 'refinement', icon: '⬢', label: 'Signal Refinement', sub: 'FP filter · confidence scoring', color: '#10b981' },
  { id: 'output', icon: '⬡', label: 'Verified Output', sub: 'Fix PR · Triage · Reports', color: '#0ea5e9', stacked: true },
];

const MEMORY_CARDS = [
  { icon: '🌲', title: 'Codegraph Mapping', desc: 'Maps every file, import, and dependency. Calculates impact scores so AI prioritizes high-traffic, high-risk files.' },
  { icon: '⚙️', title: 'Audit Configuration', desc: 'Set scan depth, severity thresholds, custom suppression rules, and path-specific policies per repository.' },
  { icon: '🏢', title: 'Business Context', desc: 'Feed README, architecture notes, or role definitions so AI catches domain-specific business logic flaws.' },
  { icon: '🧠', title: 'Persistent Memory', desc: 'Remembers architecture, suppressions, and team decisions — improving signal-to-noise on every future scan.' },
];

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Scanner', icon: ScannerIcon },
  { id: 'profiles', label: 'Profiles', icon: ProfilesIcon },
  { id: 'pipeline', label: 'Pipeline', icon: PipelineIcon },
  { id: 'remediation', label: 'Remediation', icon: RemediationIcon },
  { id: 'memory', label: 'Memory', icon: MemoryIcon },
];

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */

function ScannerIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function ProfilesIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function PipelineIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" /><line x1="12" y1="8" x2="12" y2="16" />
      <circle cx="12" cy="19" r="3" /><line x1="6" y1="11" x2="18" y2="11" />
    </svg>
  );
}

function RemediationIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function MemoryIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
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

function LiveScanWindow({ onProfileClick }) {
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
        {/* Exploit path */}
        <div className="exploit-card">
          <div className="exploit-card-header">
            <div>
              <span className="exploit-label">EXPLOIT PATH</span>
              <span className="exploit-cwe">CWE-89</span>
            </div>
            <span className="exploit-pill">Active Exploit</span>
          </div>
          <div className="exploit-trace">
            <code className="trace-node trace-source">req.params.id</code>
            <span className="trace-arrow">→</span>
            <code className="trace-node trace-func">db.raw()</code>
            <span className="trace-arrow">→</span>
            <code className="trace-node trace-sink">SELECT * FROM users</code>
          </div>
          <div className="exploit-score-row">
            <span className="exploit-score-label">EXPLOITABILITY</span>
            <div className="exploit-score-bar">
              <div className="exploit-score-fill" style={{ width: '91%' }} />
            </div>
            <span className="exploit-score-num">91/100</span>
          </div>
        </div>

        {/* Findings list */}
        <div className="findings-list">
          <div className="findings-list-item findings-list-item--active">
            <div className="fi-left">
              <SeverityBadge level="CRITICAL" />
              <div className="fi-text">
                <span className="fi-path">github.com/acme/api</span>
                <span className="fi-desc">req.params.id → raw SQL</span>
              </div>
            </div>
            <div className="fi-score">
              <div className="fi-bar-wrap"><div className="fi-bar fi-bar--critical" style={{ width: '91%' }} /></div>
              <span className="fi-num">91</span>
            </div>
          </div>

          <div className="findings-list-item" style={{ cursor: 'pointer' }} onClick={onProfileClick}>
            <div className="fi-left">
              <SeverityBadge level="HIGH" />
              <div className="fi-text">
                <span className="fi-path">mobile/AuthManager.kt</span>
                <span className="fi-desc">JWT_SECRET → committed source</span>
              </div>
            </div>
            <div className="fi-score">
              <div className="fi-bar-wrap"><div className="fi-bar fi-bar--high" style={{ width: '84%' }} /></div>
              <span className="fi-num">84</span>
            </div>
          </div>

          <div className="findings-list-item" style={{ cursor: 'pointer' }} onClick={onProfileClick}>
            <div className="fi-left">
              <SeverityBadge level="MEDIUM" />
              <div className="fi-text">
                <span className="fi-path">terraform/prod/vpc.tf</span>
                <span className="fi-desc">0.0.0.0/0 → admin port</span>
              </div>
            </div>
            <div className="fi-score">
              <div className="fi-bar-wrap"><div className="fi-bar fi-bar--medium" style={{ width: '63%' }} /></div>
              <span className="fi-num">63</span>
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
  const [activeProfileTab, setActiveProfileTab] = useState('web');
  const [activeRemStep, setActiveRemStep] = useState(1);
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

  const activeProfile = PROFILES_DATA[activeProfileTab];

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
              <img src={logoImg} alt="CodeSentry Logo" className="cs-logo-img" />
            </div>
            <span className="cs-brand-name">CodeSentry</span>
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
              <span className="cs-breadcrumb-root">CodeSentry</span>
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
                        offense → defense · Thinks like a hacker. Fixes like an engineer.
                      </div>

                      <h1 className="cs-hero-title">
                        The calm security layer for{' '}
                        <span className="cs-gradient-text">
                          <TypedText phrases={['fast shipping teams.', 'modern engineering.', 'production codebases.', 'every PR you push.']} />
                        </span>
                      </h1>

                      <p className="cs-hero-sub">
                        CodeSentry reviews every PR like a senior AppSec engineer — it traces real exploit paths, ranks what's actually dangerous, then ships verified fix PRs and threat models with zero process drag.
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
                          <span className="cs-hstat-num">22</span>
                          <span className="cs-hstat-lbl">Analysis Layers</span>
                        </div>
                      </div>

                      <PRInputForm onSubmit={handleReviewSubmit} isLoading={isLoading} />
                    </div>

                    <div className="cs-hero-right">
                      <LiveScanWindow onProfileClick={() => setCurrentView('profiles')} />
                    </div>
                  </div>

                  {/* Trust strip */}
                  <div className="cs-trust-strip">
                    <span className="cs-trust-label">TRUSTED ANALYSIS STANDARDS</span>
                    {['OWASP Top 10', 'CWE Top 25', 'OWASP API Top 10', 'STRIDE', 'CIS Benchmarks', 'SARIF 2.1', 'OSV.dev'].map(t => (
                      <span key={t} className="cs-trust-pill">{t}</span>
                    ))}
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

          {/* ── VIEW: PROFILES ────────────────────────────────── */}
          {currentView === 'profiles' && (
            <div className="cs-page">
              <div className="cs-page-header">
                <span className="cs-page-tag">7 Purpose-Built Scan Profiles</span>
                <h2 className="cs-page-title">Every codebase type. Every major framework.</h2>
                <p className="cs-page-desc">
                  Web apps, REST/GraphQL APIs, Android, iOS, Cloud & IaC, supply chain, and agentic AI integrations — specialized detectors, compliance mappings, and live findings tuned for each attack surface.
                </p>
              </div>

              {/* Profile tabs */}
              <div className="cs-profile-tabs">
                {Object.entries(PROFILES_DATA).map(([key, val]) => (
                  <button
                    key={key}
                    className={`cs-profile-tab ${activeProfileTab === key ? 'cs-profile-tab--active' : ''}`}
                    onClick={() => setActiveProfileTab(key)}
                  >
                    <span>{val.icon}</span>
                    <span>{val.title.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Profile detail split */}
              <div className="cs-profile-split">
                {/* Left */}
                <div className="cs-profile-left">
                  <div className="cs-profile-icon-large">{activeProfile.icon}</div>
                  <h3 className="cs-profile-title">{activeProfile.title}</h3>
                  <p className="cs-profile-desc">{activeProfile.desc}</p>

                  <div className="cs-profile-badges">
                    {activeProfile.badges.map((b, i) => (
                      <span key={i} className="cs-badge-pill cs-badge-pill--indigo">{b}</span>
                    ))}
                  </div>

                  <div className="cs-detects">
                    <div className="cs-detects-header">What it detects</div>
                    {activeProfile.detects.map((d, i) => (
                      <div key={i} className="cs-detect-row">
                        <span className="cs-detect-check">✓</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: example finding */}
                <div className="cs-finding-card">
                  <div className="cs-finding-card-header">
                    <span className="cs-finding-label">Example Finding</span>
                    <SeverityBadge level={activeProfile.finding.severity} />
                  </div>
                  <div className="cs-finding-body">
                    <code className="cs-finding-path">{activeProfile.finding.path}</code>
                    <h4 className="cs-finding-title">{activeProfile.finding.title}</h4>

                    <div className="cs-finding-metrics">
                      <div className="cs-fm-box">
                        <span className="cs-fm-lbl">CTIS Score</span>
                        <span className="cs-fm-val cs-fm-val--big">{activeProfile.finding.ctis}</span>
                      </div>
                      <div className="cs-fm-box">
                        <span className="cs-fm-lbl">CWE ID</span>
                        <span className="cs-fm-val">{activeProfile.finding.cwe}</span>
                      </div>
                      <div className="cs-fm-box">
                        <span className="cs-fm-lbl">Framework Map</span>
                        <span className="cs-fm-val">{activeProfile.finding.map}</span>
                      </div>
                    </div>

                    <p className="cs-finding-desc">{activeProfile.finding.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW: PIPELINE ────────────────────────────────── */}
          {currentView === 'pipeline' && (
            <div className="cs-page">
              <div className="cs-page-header">
                <span className="cs-page-tag">Consensus Pipeline</span>
                <h2 className="cs-page-title">The intelligence behind every scan.</h2>
                <p className="cs-page-desc">
                  Every pull request flows through code-context mapping, specialized analysis engines, multi-model reasoning with cross-model consensus, and deterministic signal refinement — landing as a verified fix PR, triage queue, and compliance reports.
                </p>
              </div>

              {/* Horizontal pipeline */}
              <div className="cs-pipeline-wrapper">
                <div className="cs-pipeline-track">
                  {/* PR input */}
                  <PipelineNode
                    icon="📬" label="Pull Request" sub="GitHub · GitLab · Bitbucket"
                    color="#6366f1" active />
                  <PipelineArrow active />
                  <PipelineNode
                    icon="🌲" label="Codegraph" sub="Imports · impact · entry-points"
                    color="#8b5cf6" active />
                  <PipelineArrow active />
                  <PipelineNode
                    icon="🔒" label="Security Pipeline" sub="22 analysis layers"
                    color="#ec4899" active />
                  <PipelineArrow active />

                  {/* Stacked engines */}
                  <div className="cs-pipeline-stack">
                    {[
                      { icon: '🤖', label: 'AI Code Review', sub: 'Critical files first', c: '#f43f5e' },
                      { icon: '💧', label: 'Cross-file Taint', sub: 'Source → sink', c: '#f59e0b' },
                      { icon: '🌳', label: 'Tree-sitter AST', sub: 'Data-flow tracing', c: '#6366f1' },
                      { icon: '📦', label: 'Dependency CVE', sub: 'OSV.dev advisories', c: '#10b981' },
                      { icon: '📈', label: 'Threat Modeling', sub: 'STRIDE · ASI Top 10', c: '#7c3aed' },
                    ].map((e, i) => (
                      <div key={i} className="cs-pipeline-stack-node" style={{ borderLeft: `3px solid ${e.c}` }}>
                        <span className="cs-stack-icon">{e.icon}</span>
                        <div>
                          <span className="cs-pnode-label">{e.label}</span>
                          <span className="cs-pnode-sub">{e.sub}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <PipelineArrow />
                  <PipelineNode icon="🧠" label="AI Consensus" sub="Flash · Turbo · Deep" color="#0ea5e9" />
                  <PipelineArrow />
                  <PipelineNode icon="🎛️" label="Signal Refinement" sub="FP filter · confidence" color="#10b981" />
                  <PipelineArrow />

                  {/* Stacked outputs */}
                  <div className="cs-pipeline-stack">
                    {[
                      { icon: '🚀', label: 'Verified Fix PR', sub: 'Re-scanned & merged', c: '#10b981' },
                      { icon: '📋', label: 'Triage Dashboard', sub: 'Review & approve', c: '#f59e0b' },
                      { icon: '📊', label: 'Compliance Reports', sub: 'SARIF · PDF', c: '#6366f1' },
                    ].map((e, i) => (
                      <div key={i} className="cs-pipeline-stack-node" style={{ borderRight: `3px solid ${e.c}`, borderLeft: 'none', textAlign: 'right' }}>
                        <div>
                          <span className="cs-pnode-label">{e.label}</span>
                          <span className="cs-pnode-sub">{e.sub}</span>
                        </div>
                        <span className="cs-stack-icon">{e.icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="cs-pipeline-stats">
                {[
                  { val: '22', lbl: 'Analysis Layers' },
                  { val: '3', lbl: 'Consensus Models' },
                  { val: '<45s', lbl: 'Avg. Scan Time' },
                  { val: '0', lbl: 'CI Pipeline Changes' },
                ].map((s, i) => (
                  <div key={i} className="cs-pstat">
                    <span className="cs-pstat-val">{s.val}</span>
                    <span className="cs-pstat-lbl">{s.lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── VIEW: REMEDIATION ────────────────────────────── */}
          {currentView === 'remediation' && (
            <div className="cs-page">
              <div className="cs-page-header">
                <span className="cs-page-tag">Remediation Console</span>
                <h2 className="cs-page-title">From repo install to verified patch PR.</h2>
                <p className="cs-page-desc">
                  A fast path for teams that want security to feel native to engineering — not like a meeting, spreadsheet or another portal to babysit.
                </p>
              </div>

              <div className="cs-rem-split">
                {/* Steps */}
                <div className="cs-rem-steps">
                  {[
                    {
                      step: 1, tag: 'Connect', title: 'Install once',
                      desc: 'Connect GitHub, GitLab or Bitbucket. Select repos and start scanning without YAML configurations or CI pipeline rewrites.',
                    },
                    {
                      step: 2, tag: 'Analyze', title: 'Audit every change',
                      desc: 'Every PR receives a full codebase graph security scan, dynamic exploitability scoring, and thorough source-to-sink vulnerability explanation.',
                    },
                    {
                      step: 3, tag: 'Fix', title: 'Ship verified patches',
                      desc: 'Automatically generate a localized remediation PR, execute pipeline re-scans, and merge the resolved checks with cryptographic evidence.',
                    },
                  ].map(({ step, tag, title, desc }) => (
                    <div
                      key={step}
                      className={`cs-rem-step ${activeRemStep === step ? 'cs-rem-step--active' : ''}`}
                      onClick={() => setActiveRemStep(step)}
                    >
                      <div className="cs-rem-step-number">{step < 10 ? `0${step}` : step}</div>
                      <div className="cs-rem-step-content">
                        <span className="cs-rem-tag">{tag}</span>
                        <h4 className="cs-rem-title">{title}</h4>
                        <p className="cs-rem-desc">{desc}</p>
                        {activeRemStep === step && <div className="cs-rem-progress" />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Code panel */}
                <div className="cs-rem-code-panel">
                  <div className="cs-rem-code-header">
                    <div>
                      <span className="cs-rem-code-title">Verified Remediation</span>
                      <span className="cs-rem-code-sub">Auto-generated patch PR</span>
                    </div>
                    <span className="cs-rem-code-status">
                      <span className="cs-status-dot cs-status-dot--live" />
                      Auto-fix PR opened
                    </span>
                  </div>
                  <div className="cs-rem-diff">
                    {[
                      { type: 'del', code: '- const query = `SELECT * FROM users WHERE id = ${id}`;' },
                      { type: 'add', code: '+ const query = db.where(eq(users.id, userId));' },
                      { type: 'neutral', code: '  // Guard: verify tenant access' },
                      { type: 'add', code: '+ assertTenantAccess(session.orgId, userId);' },
                      { type: 'neutral', code: '' },
                      { type: 'info', code: '  // Test: rejects cross-tenant object access' },
                      { type: 'add', code: '+ expect(fetchUser(otherOrgUserId)).rejects(ForbiddenError);' },
                    ].map((line, i) => (
                      <div key={i} className={`cs-diff-line cs-diff-line--${line.type}`}>
                        <code>{line.code}</code>
                      </div>
                    ))}
                  </div>
                  <div className="cs-rem-verify-row">
                    <span className="cs-verify-icon">✓</span>
                    <span className="cs-verify-text">Source-to-sink path closed · Re-scan passed · PR merged</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW: MEMORY ─────────────────────────────────── */}
          {currentView === 'memory' && (
            <div className="cs-page">
              <div className="cs-page-header">
                <span className="cs-page-tag">Knowledge Memory</span>
                <h2 className="cs-page-title">AI that learns, remembers, and improves.</h2>
                <p className="cs-page-desc">
                  CodeSentry builds a living memory graph of your codebase — learning architecture, suppressing noise, and applying your team's decisions automatically on every future scan.
                </p>
              </div>

              <div className="cs-memory-grid">
                {MEMORY_CARDS.map((card, i) => (
                  <div key={i} className="cs-mem-card">
                    <div className="cs-mem-card-icon">{card.icon}</div>
                    <h4 className="cs-mem-card-title">{card.title}</h4>
                    <p className="cs-mem-card-desc">{card.desc}</p>
                  </div>
                ))}
              </div>

              <div className="cs-memory-banner">
                <div className="cs-mem-banner-icon">📈</div>
                <div className="cs-mem-banner-content">
                  <span className="cs-mem-banner-title">AI learns from every scan</span>
                  <span className="cs-mem-banner-desc">
                    The memory graph persists across every scan, remembers your architecture, learns false-positive patterns in your codebase, and improves signal-to-noise automatically over time. No manual tuning required.
                  </span>
                </div>
                <button className="cs-mem-banner-cta" onClick={() => navigateTo('dashboard')}>
                  Try a scan →
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="cs-footer">
            <span>© 2026 CodeSentry</span>
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

/* ─── Pipeline helper components ─────────────────────────────────────────── */

function PipelineNode({ icon, label, sub, color, active }) {
  return (
    <div className={`cs-pnode ${active ? 'cs-pnode--active' : ''}`} style={{ '--pnode-color': color }}>
      <div className="cs-pnode-icon" style={{ background: `${color}18`, borderColor: `${color}30`, color }}>{icon}</div>
      <span className="cs-pnode-label">{label}</span>
      <span className="cs-pnode-sub">{sub}</span>
    </div>
  );
}

function PipelineArrow({ active }) {
  return (
    <div className={`cs-parrow ${active ? 'cs-parrow--active' : ''}`}>
      <div className="cs-parrow-line" />
      <div className="cs-parrow-head" />
    </div>
  );
}
