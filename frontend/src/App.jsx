import React, { useState } from 'react';
import PRInputForm from './components/PRInputForm';
import LoadingState from './components/LoadingState';
import FinalReviewPanel from './components/FinalReviewPanel';
import AgentFindingsCard from './components/AgentFindingsCard';
import { reviewPR } from './api/client';

const PROFILES_DATA = {
  web: {
    title: "Web Application Security",
    desc: "Full OWASP Top 10 coverage for server-rendered and SPA apps. XSS, CSRF, SQLi, broken auth.",
    badges: ["OWASP Top 10", "CWE Top 25"],
    detects: [
      "SQL / NoSQL injection via cross-file data-flow tracing",
      "Stored and reflected XSS across templates and responses",
      "CSRF and session fixation vulnerabilities",
      "Broken authentication and missing authorization guards"
    ],
    finding: {
      path: "src/controllers/users.ts:47",
      title: "SQL injection via unsanitized `id` param",
      severity: "CRITICAL",
      ctis: "91",
      cwe: "CWE-89",
      map: "A03:2021",
      desc: "Unsanitized `id` param flows from req.params into a raw SQL string with no parameterization or escaping applied."
    }
  },
  backend: {
    title: "API / Backend Integrity",
    desc: "Deep parsing of REST, GraphQL, and gRPC endpoints. Analyzes route parameters, headers, and request bodies for validation and access control flaws.",
    badges: ["OWASP API Top 10", "gRPC / REST"],
    detects: [
      "Mass assignment and parameter pollution vulnerabilities",
      "Broken object-level authorization (BOLA / IDOR)",
      "SSRF (Server-Side Request Forgery) in outbound HTTP clients",
      "Improper rate limiting and resource exhaustion vectors"
    ],
    finding: {
      path: "backend/routes/billing.py:112",
      title: "BOLA via unvalidated tenant ownership checks",
      severity: "CRITICAL",
      ctis: "88",
      cwe: "CWE-285",
      map: "API01:2023",
      desc: "The endpoint fetches billing records using path variable billing_id without verifying the requesting user belongs to the associated organization."
    }
  },
  android: {
    title: "Android MOB Security",
    desc: "Static analysis for Android applications written in Kotlin and Java. Scans intents, permissions, and local storage configurations.",
    badges: ["OWASP Mobile Top 10", "Android SDK"],
    detects: [
      "Insecure data storage in shared preferences and external storage",
      "Implicit intents exposing sensitive actions to malicious apps",
      "Hardcoded API credentials and cryptographic keys",
      "Insecure SSL/TLS validations and certificate pinning bypasses"
    ],
    finding: {
      path: "android/app/src/AuthService.kt:84",
      title: "Hardcoded cryptographic key in keystore backup",
      severity: "HIGH",
      ctis: "84",
      cwe: "CWE-321",
      map: "M02:2023",
      desc: "Cryptographic operations are initialized using a static hardcoded key string instead of retrieving it securely from the Android Keystore system."
    }
  },
  ios: {
    title: "iOS MOB Secure Coding",
    desc: "Swift and Objective-C static analysis identifying memory safety, secure storage, and networking issues.",
    badges: ["OWASP Mobile", "iOS Secure Coding"],
    detects: [
      "Keychain storage configured with weak accessibility flags",
      "Use of unsafe API functions (e.g. memory copies) in Swift/C bridging",
      "Local database file encryption (SQLCipher) missing or weak",
      "Arbitrary HTTP loads permitted in Info.plist (App Transport Security)"
    ],
    finding: {
      path: "ios/Classes/SecureStorage.swift:23",
      title: "Keychain item accessible before first user unlock",
      severity: "MEDIUM",
      ctis: "68",
      cwe: "CWE-522",
      map: "M01:2023",
      desc: "Sensitive session token stored in Keychain with kSecAttrAccessibleAfterFirstUnlock, meaning it remains accessible while the device is locked."
    }
  },
  cloud: {
    title: "Cloud & IaC Configuration",
    desc: "Scans Terraform, CloudFormation, Helm charts, and Dockerfiles to prevent infrastructure-as-code misconfigurations.",
    badges: ["CIS Benchmarks", "IaC Security"],
    detects: [
      "Overly permissive IAM policies and security group rules (e.g., 0.0.0.0/0)",
      "Unencrypted S3 buckets, databases, and key vaults at rest",
      "Containers configured to run as root or with privileged access",
      "Missing secret encryption keys or public resource exposure"
    ],
    finding: {
      path: "terraform/prod/vpc.tf:63",
      title: "Security group ingress rule allows SSH from 0.0.0.0/0",
      severity: "MEDIUM",
      ctis: "63",
      cwe: "CWE-732",
      map: "CIS-5.1",
      desc: "VPC security group rules expose SSH port 22 directly to the public internet, leaving host instances open to brute force attempts."
    }
  },
  secrets: {
    title: "Secrets & Supply Chain Guard",
    desc: "Detects active API keys, database connection strings, SSH keys, and outdated/malicious packages in package manager registries.",
    badges: ["Secret Detection", "SBOM Audit"],
    detects: [
      "Committed AWS, Google Cloud, Slack, Groq, and GitHub API credentials",
      "Database connection strings containing plaintext credentials",
      "Vulnerable open-source dependencies (via OSV database integration)",
      "Package confusion and dependency hijacking risks in npm/pip"
    ],
    finding: {
      path: "mobile/AuthManager.kt:84",
      title: "Committed plain-text JWT sign secret key",
      severity: "HIGH",
      ctis: "84",
      cwe: "CWE-798",
      map: "A07:2021",
      desc: "Plain-text JWT token signing secret key was committed directly to source control, compromising all security parameters."
    }
  },
  ai: {
    title: "Agentic AI Safety Gate",
    desc: "Reviews prompts, model integrations, RAG injection guards, and tool execution boundaries in agentic systems.",
    badges: ["OWASP LLM Top 10", "Agent Security"],
    detects: [
      "Indirect prompt injection vulnerabilities in RAG data pipelines",
      "Tool calls executing shell scripts or system queries without sandboxing",
      "Over-reliance on model outputs in sensitive administrative execution paths",
      "Unbounded tool inputs leading to denial of service or arbitrary code execution"
    ],
    finding: {
      path: "backend/agents/sql_tool.py:34",
      title: "Arbitrary SQL execution tool exposed to LLM output",
      severity: "CRITICAL",
      ctis: "95",
      cwe: "CWE-89",
      map: "LLM01:2023",
      desc: "The database agent executes model-generated query text directly against the primary SQL server without parameter validation or safe read-only limits."
    }
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [reviewData, setReviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Profile page state
  const [activeProfileTab, setActiveProfileTab] = useState('web');

  // Remediation step active
  const [activeRemStep, setActiveRemStep] = useState(1);

  const handleReviewSubmit = async (url) => {
    setIsLoading(true);
    setError(null);
    setReviewData(null);
    setCurrentView('dashboard'); // Switch back to scanner viewport to show results

    try {
      const result = await reviewPR(url);
      setReviewData(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during review.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeProfile = PROFILES_DATA[activeProfileTab];

  return (
    <div className="app-layout">
      
      {/* SIDEBAR CONSOLE NAVIGATION - Customized Design, Dark Sidebar */}
      <aside className="sidebar-console">
        <div className="sidebar-brand" onClick={() => { setCurrentView('dashboard'); setReviewData(null); setError(null); }} style={{ cursor: 'pointer' }}>
          <svg className="sidebar-logo-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <h2>CodeVerdict</h2>
        </div>
        
        <nav className="sidebar-menu">
          <button className={`sidebar-menu-btn ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
            <svg className="menu-btn-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className="menu-btn-text">Scanner Console</span>
          </button>
          
          <button className={`sidebar-menu-btn ${currentView === 'profiles' ? 'active' : ''}`} onClick={() => setCurrentView('profiles')}>
            <svg className="menu-btn-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <circle cx="12" cy="11" r="3"></circle>
            </svg>
            <span className="menu-btn-text">Active Profiles</span>
          </button>
          
          <button className={`sidebar-menu-btn ${currentView === 'pipeline' ? 'active' : ''}`} onClick={() => setCurrentView('pipeline')}>
            <svg className="menu-btn-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"></line>
              <circle cx="18" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <path d="M18 9a9 9 0 0 1-9 9"></path>
            </svg>
            <span className="menu-btn-text">Consensus Pipeline</span>
          </button>
          
          <button className={`sidebar-menu-btn ${currentView === 'remediation' ? 'active' : ''}`} onClick={() => setCurrentView('remediation')}>
            <svg className="menu-btn-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span className="menu-btn-text">Remediation Console</span>
          </button>
          
          <button className={`sidebar-menu-btn ${currentView === 'memory' ? 'active' : ''}`} onClick={() => setCurrentView('memory')}>
            <svg className="menu-btn-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
              <rect x="9" y="9" width="6" height="6"></rect>
              <line x1="9" y1="1" x2="9" y2="4"></line>
              <line x1="15" y1="1" x2="15" y2="4"></line>
              <line x1="9" y1="20" x2="9" y2="23"></line>
              <line x1="15" y1="20" x2="15" y2="23"></line>
              <line x1="20" y1="9" x2="23" y2="9"></line>
              <line x1="20" y1="15" x2="23" y2="15"></line>
              <line x1="1" y1="9" x2="4" y2="9"></line>
              <line x1="1" y1="15" x2="4" y2="15"></line>
            </svg>
            <span className="menu-btn-text">Knowledge Memory</span>
          </button>
        </nav>
        
        {/* Sidebar statistics row - Grounded performance stats */}
        <div className="sidebar-stats">
          <div className="sidebar-stat-row">
            <span className="sidebar-stat-lbl">Overall Precision</span>
            <span className="sidebar-stat-val">87.50%</span>
          </div>
          <div className="sidebar-stat-row">
            <span className="sidebar-stat-lbl">Overall Recall</span>
            <span className="sidebar-stat-val">100.00%</span>
          </div>
          <div className="sidebar-stat-row" style={{ border: 'none', paddingBottom: 0 }}>
            <span className="sidebar-stat-lbl">Benchmark Suite</span>
            <span className="sidebar-stat-val">3 PRs</span>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN VIEWPORT - Slate White Background */}
      <div className="main-viewport">
        
        {/* Viewport Topbar */}
        <header className="viewport-topbar">
          <div className="topbar-left">
            <span className="topbar-status-dot green" />
            <span className="topbar-status-lbl">Offline Mock Sandbox Active</span>
          </div>
          <div className="topbar-actions">
            <span className="sign-in-btn">Sign in</span>
            <button className="btn btn-primary start-free-header" onClick={() => { setCurrentView('dashboard'); setReviewData(null); setError(null); }}>
              Start free →
            </button>
          </div>
        </header>

        {/* Viewport Dynamic Content */}
        <main className="viewport-content">
          
          {/* VIEW 1: SCANNER CONSOLE */}
          {currentView === 'dashboard' && (
            <div className="section-wrapper">
              
              {/* Split Hero layout when no analysis is running or showing */}
              {!reviewData && !isLoading && (
                <div className="split-hero-container">
                  <div className="hero-left-pane">
                    <span className="hero-glow-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.12)' }}>
                      <span className="live-scan-pulse" style={{ marginRight: '6px' }} />
                      Thinks like a hacker. Fixes like an engineer. | offense → defense
                    </span>
                    <h2 className="hero-title" style={{ fontSize: '2.4rem', textAlign: 'left', margin: '0 0 1rem 0' }}>
                      The calm security layer for <span className="gradient-text">fast shipping teams</span>.
                    </h2>
                    <p className="hero-subtitle" style={{ textAlign: 'left', margin: '0 0 2rem 0' }}>
                      CodeVerdict reviews every PR like a senior AppSec engineer — it traces real exploit paths and ranks what's actually dangerous. Then it ships verified fix PRs and threat models, with zero process drag.
                    </p>
                    
                    {/* PR Input Form goes right in the hero section */}
                    <PRInputForm onSubmit={handleReviewSubmit} isLoading={isLoading} />
                  </div>

                  {/* Right side: Mock PR live scan window mockup */}
                  <div className="hero-right-pane">
                    <div className="live-scan-window">
                      <div className="live-scan-title-bar">
                        <div className="mac-dots">
                          <span className="mac-dot red" />
                          <span className="mac-dot yellow" />
                          <span className="mac-dot green" />
                        </div>
                        <span className="live-scan-title">
                          <span className="live-scan-pulse" />
                          Live PR scan
                        </span>
                      </div>

                      <div className="live-scan-content">
                        {/* Active Exploit Box */}
                        <div className="exploit-path-box">
                          <div className="exploit-path-header">
                            <span className="exploit-path-title">EXPLOIT PATH CWE-89</span>
                            <span className="badge-active-exploit">Active Exploit</span>
                          </div>
                          <div className="exploit-path-flow">
                            <span className="exploit-flow-step code-var">req.params.id</span>
                            <span className="exploit-flow-arrow">→</span>
                            <span className="exploit-flow-step code-func">db.raw</span>
                            <span className="exploit-flow-arrow">→</span>
                            <span className="exploit-flow-step code-query">SELECT * FROM users</span>
                          </div>
                          <div className="exploitability-gauge">
                            <div className="exploitability-gauge-header">
                              <span>EXPLOITABILITY</span>
                              <span className="gauge-val">91/100</span>
                            </div>
                            <div className="exploitability-gauge-bar">
                              <div className="exploitability-gauge-fill" />
                            </div>
                          </div>
                        </div>

                        {/* Mock vulnerability list */}
                        <div className="scan-list">
                          <div className="scan-list-item selected">
                            <div className="scan-item-info">
                              <span className="scan-item-path">github.com/acme/api</span>
                              <span className="scan-item-flow">req.params.id → raw SQL</span>
                            </div>
                            <div className="scan-item-meta">
                              <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>Critical</span>
                              <div className="scan-item-score-bar-wrapper">
                                <div className="scan-item-score-bar-fill critical" />
                              </div>
                              <span className="scan-item-score-text">91</span>
                            </div>
                          </div>

                          <div className="scan-list-item" onClick={() => setCurrentView('profiles')}>
                            <div className="scan-item-info">
                              <span className="scan-item-path">mobile/AuthManager.kt</span>
                              <span className="scan-item-flow">JWT_SECRET → committed source</span>
                            </div>
                            <div className="scan-item-meta">
                              <span className="badge badge-warning" style={{ fontSize: '0.65rem', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.2)' }}>High</span>
                              <div className="scan-item-score-bar-wrapper">
                                <div className="scan-item-score-bar-fill high" />
                              </div>
                              <span className="scan-item-score-text">84</span>
                            </div>
                          </div>

                          <div className="scan-list-item" onClick={() => setCurrentView('profiles')}>
                            <div className="scan-item-info">
                              <span className="scan-item-path">terraform/prod/vpc.tf</span>
                              <span className="scan-item-flow">0.0.0.0/0 → admin port</span>
                            </div>
                            <div className="scan-item-meta">
                              <span className="badge badge-suggestion" style={{ fontSize: '0.65rem', color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.2)' }}>Medium</span>
                              <div className="scan-item-score-bar-wrapper">
                                <div className="scan-item-score-bar-fill medium" />
                              </div>
                              <span className="scan-item-score-text">63</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="card error-card">
                  <h4>⚠️ Analysis Failed</h4>
                  <p>{error}</p>
                  <p className="error-tip">Verify that your backend server is running and the GROQ_API_KEY environment variable is configured.</p>
                </div>
              )}

              {isLoading && <LoadingState />}

              {reviewData && (
                <div className="review-results-container">
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <button className="btn btn-secondary" onClick={() => { setReviewData(null); setError(null); }} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                      ← Start Another Scan
                    </button>
                  </div>
                  {/* Final Merged Review */}
                  <FinalReviewPanel reviewData={reviewData} />

                  {/* Individual Agent Details */}
                  <AgentFindingsCard agentBreakdowns={reviewData.agent_breakdowns} />
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: ACTIVE PROFILES (Custom layout, Light-Hybrid Showcase) */}
          {currentView === 'profiles' && (
            <div className="section-wrapper">
              <div className="section-header">
                <span className="section-tag">7 Purpose-Built Scan Profiles</span>
                <h2 className="section-title">Every codebase type. Every major framework.</h2>
                <p className="section-desc">
                  Web apps, REST/GraphQL APIs, Android, iOS, Cloud & IaC, supply chain, and agentic AI integrations — specialized detectors, compliance mappings, and live findings tuned for each attack surface.
                </p>
              </div>

              {/* Profile Tab Buttons */}
              <div className="tabs-container" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
                <button className={`tab-btn ${activeProfileTab === 'web' ? 'active-tab' : ''}`} onClick={() => setActiveProfileTab('web')}>
                  🌐 Web Application
                </button>
                <button className={`tab-btn ${activeProfileTab === 'backend' ? 'active-tab' : ''}`} onClick={() => setActiveProfileTab('backend')}>
                  💻 API / Backend
                </button>
                <button className={`tab-btn ${activeProfileTab === 'android' ? 'active-tab' : ''}`} onClick={() => setActiveProfileTab('android')}>
                  📱 Android MOB
                </button>
                <button className={`tab-btn ${activeProfileTab === 'ios' ? 'active-tab' : ''}`} onClick={() => setActiveProfileTab('ios')}>
                  🍎 iOS MOB
                </button>
                <button className={`tab-btn ${activeProfileTab === 'cloud' ? 'active-tab' : ''}`} onClick={() => setActiveProfileTab('cloud')}>
                  ☁️ Cloud & IaC
                </button>
                <button className={`tab-btn ${activeProfileTab === 'secrets' ? 'active-tab' : ''}`} onClick={() => setActiveProfileTab('secrets')}>
                  🔑 Secrets & Supply Chain
                </button>
                <button className={`tab-btn ${activeProfileTab === 'ai' ? 'active-tab' : ''}`} onClick={() => setActiveProfileTab('ai')}>
                  🤖 Agentic AI
                </button>
              </div>

              {/* Split Showcase Grid */}
              <div className="card detects-split-container">
                <div className="detects-left-pane">
                  <span className="main-badge" style={{ alignSelf: 'flex-start' }}>Profile Details</span>
                  <h3>{activeProfile.title}</h3>
                  <p>{activeProfile.desc}</p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.25rem 0' }}>
                    {activeProfile.badges.map((b, i) => (
                      <span key={i} className="badge badge-suggestion" style={{ color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.2)' }}>{b}</span>
                    ))}
                  </div>

                  <div className="detects-list">
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '0.75rem' }}>Detects</h4>
                    {activeProfile.detects.map((d, i) => (
                      <div key={i} className="detects-list-item">
                        <span className="detect-check-icon">✓</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Pane: Example Finding Mockup Box (Dark Panel for High Contrast) */}
                <div className="live-scan-window" style={{ boxShadow: 'none', border: '1px solid var(--border-subtle)' }}>
                  <div className="live-scan-title-bar">
                    <span className="example-finding-header" style={{ margin: 0 }}>Example Finding</span>
                    <span className="badge badge-critical" style={{ fontSize: '0.6rem' }}>{activeProfile.finding.severity}</span>
                  </div>
                  <div className="live-scan-content">
                    <div style={{ textSelf: 'flex-start' }}>
                      <span className="file-info" style={{ color: 'var(--text-secondary)' }}>
                        <code>{activeProfile.finding.path}</code>
                      </span>
                      <h4 className="synthesized-desc" style={{ fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: '700', color: '#ffffff' }}>
                        {activeProfile.finding.title}
                      </h4>
                    </div>

                    {/* Metrics grid */}
                    <div className="finding-metrics-grid">
                      <div className="finding-metric-box" style={{ backgroundColor: '#111827', borderColor: '#1f2937' }}>
                        <span className="finding-metric-lbl">CTIS</span>
                        <span className="finding-metric-val" style={{ color: '#ffffff' }}>{activeProfile.finding.ctis}</span>
                      </div>
                      <div className="finding-metric-box" style={{ backgroundColor: '#111827', borderColor: '#1f2937' }}>
                        <span className="finding-metric-lbl">CWE</span>
                        <span className="finding-metric-val" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', color: '#ffffff' }}>{activeProfile.finding.cwe}</span>
                      </div>
                      <div className="finding-metric-box" style={{ backgroundColor: '#111827', borderColor: '#1f2937' }}>
                        <span className="finding-metric-lbl">MAP</span>
                        <span className="finding-metric-val" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', color: '#ffffff' }}>{activeProfile.finding.map}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5', margin: '0.25rem 0 0 0' }}>
                      {activeProfile.finding.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: PIPELINE WORKFLOW (Clean light graph) */}
          {currentView === 'pipeline' && (
            <div className="section-wrapper">
              <div className="section-header">
                <span className="section-tag">Consensus Pipeline</span>
                <h2 className="section-title">The intelligence behind every scan.</h2>
                <p className="section-desc">
                  Every pull request flows through code-context mapping, specialized analysis engines, multi-model reasoning with cross-model consensus, and deterministic signal refinement, then lands as a verified fix PR, triage queue, and compliance reports.
                </p>
              </div>

              <div className="pipeline-flow-container" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="pipeline-grid">
                  
                  {/* Node 1 */}
                  <div className="pipeline-node-col">
                    <div className="pipeline-node-box">
                      <span className="pipeline-node-title">📬 Pull request</span>
                      <span className="pipeline-node-sub">GitHub - GitLab - Bitbu...</span>
                    </div>
                  </div>

                  <div className="pipeline-connecting-line active" />

                  {/* Node 2 */}
                  <div className="pipeline-node-col">
                    <div className="pipeline-node-box">
                      <span className="pipeline-node-title">🌲 Codegraph</span>
                      <span className="pipeline-node-sub">Imports, impact, entry...</span>
                    </div>
                  </div>

                  <div className="pipeline-connecting-line active" />

                  {/* Node 3 */}
                  <div className="pipeline-node-col">
                    <div className="pipeline-node-box">
                      <span className="pipeline-node-title">🔒 Security pipeline</span>
                      <span className="pipeline-node-sub">22 analysis layers</span>
                    </div>
                  </div>

                  <div className="pipeline-connecting-line active" />

                  {/* Node 4 (Stack of Parallel Engines) */}
                  <div className="pipeline-node-col">
                    <div className="pipeline-node-box" style={{ borderLeft: '3px solid var(--accent-critical)' }}>
                      <span className="pipeline-node-title">🤖 AI code review</span>
                      <span className="pipeline-node-sub">Critical files first</span>
                    </div>
                    <div className="pipeline-node-box" style={{ borderLeft: '3px solid var(--accent-warning)' }}>
                      <span className="pipeline-node-title">💧 Cross-file taint</span>
                      <span className="pipeline-node-sub">Source → sink</span>
                    </div>
                    <div className="pipeline-node-box" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
                      <span className="pipeline-node-title">🌳 Tree-sitter AST</span>
                      <span className="pipeline-node-sub">Data-flow tracing</span>
                    </div>
                    <div className="pipeline-node-box" style={{ borderLeft: '3px solid var(--accent-success)' }}>
                      <span className="pipeline-node-title">📦 Dependency CVE</span>
                      <span className="pipeline-node-sub">OSV.dev advisories</span>
                    </div>
                    <div className="pipeline-node-box" style={{ borderLeft: '3px solid var(--cat-quality)' }}>
                      <span className="pipeline-node-title">📈 Threat modeling</span>
                      <span className="pipeline-node-sub">STRIDE - ASI Top 10</span>
                    </div>
                  </div>

                  <div className="pipeline-connecting-line" />

                  {/* Node 5 */}
                  <div className="pipeline-node-col">
                    <div className="pipeline-node-box">
                      <span className="pipeline-node-title">🧠 AI engines + consensus</span>
                      <span className="pipeline-node-sub">Flash - Turbo - Deep</span>
                    </div>
                  </div>

                  <div className="pipeline-connecting-line" />

                  {/* Node 6 */}
                  <div className="pipeline-node-col">
                    <div className="pipeline-node-box">
                      <span className="pipeline-node-title">🎛️ Signal refinement</span>
                      <span className="pipeline-node-sub">FP filter - confidence</span>
                    </div>
                  </div>

                  <div className="pipeline-connecting-line" />

                  {/* Node 7 (Stack of Outputs) */}
                  <div className="pipeline-node-col">
                    <div className="pipeline-node-box" style={{ borderRight: '3px solid var(--accent-success)' }}>
                      <span className="pipeline-node-title">🚀 Verified fix PR</span>
                      <span className="pipeline-node-sub">Re-scanned & closed</span>
                    </div>
                    <div className="pipeline-node-box" style={{ borderRight: '3px solid var(--accent-warning)' }}>
                      <span className="pipeline-node-title">📋 Triage dashboard</span>
                      <span className="pipeline-node-sub">Review & approve</span>
                    </div>
                    <div className="pipeline-node-box" style={{ borderRight: '3px solid var(--accent-primary)' }}>
                      <span className="pipeline-node-title">📊 Compliance reports</span>
                      <span className="pipeline-node-sub">SARIF - PDF</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: REMEDIATION CONSOLE */}
          {currentView === 'remediation' && (
            <div className="section-wrapper">
              <div className="section-header">
                <span className="section-tag">Remediation Console</span>
                <h2 className="section-title">From repo install to verified patch PR.</h2>
                <p className="section-desc">
                  A fast path for teams that want security to feel native to engineering — not like a meeting, spreadsheet or another portal to babysit.
                </p>
              </div>

              <div className="remediation-split-container">
                
                {/* Left Column: Interactive Steps */}
                <div className="remediation-steps-col">
                  <div className={`remediation-step-item ${activeRemStep === 1 ? 'active' : ''}`} onClick={() => setActiveRemStep(1)} style={{ cursor: 'pointer' }}>
                    <span className="remediation-step-badge">Connect</span>
                    <h4 className="remediation-step-title">Install once</h4>
                    <p className="remediation-step-desc">
                      Connect GitHub, GitLab or Bitbucket. Select repos and start scanning without YAML configurations or CI pipeline rewrites.
                    </p>
                    {activeRemStep === 1 && <div className="remediation-step-progress-bar" style={{ width: '100%' }} />}
                  </div>

                  <div className={`remediation-step-item ${activeRemStep === 2 ? 'active' : ''}`} onClick={() => setActiveRemStep(2)} style={{ cursor: 'pointer' }}>
                    <span className="remediation-step-badge">Analyze</span>
                    <h4 className="remediation-step-title">Audit every change</h4>
                    <p className="remediation-step-desc">
                      Every PR receives a full codebase graph security scan, dynamic exploitability scoring, and thorough source-to-sink vulnerability explanation.
                    </p>
                    {activeRemStep === 2 && <div className="remediation-step-progress-bar" style={{ width: '100%' }} />}
                  </div>

                  <div className={`remediation-step-item ${activeRemStep === 3 ? 'active' : ''}`} onClick={() => setActiveRemStep(3)} style={{ cursor: 'pointer' }}>
                    <span className="remediation-step-badge">Fix</span>
                    <h4 className="remediation-step-title">Ship verified patches</h4>
                    <p className="remediation-step-desc">
                      Automatically generate a localized remediation PR, execute pipeline re-scans, and merge the resolved checks with cryptographic evidence.
                    </p>
                    {activeRemStep === 3 && <div className="remediation-step-progress-bar" style={{ width: '100%' }} />}
                  </div>
                </div>

                {/* Right Column: Code Remediation Display Card (Dark styled) */}
                <div className="remediation-code-card">
                  <div className="remediation-code-header">
                    <span className="remediation-code-title">Verified Remediation</span>
                    <span className="remediation-code-status">
                      <span className="live-scan-pulse" />
                      Auto-fix PR opened
                    </span>
                  </div>
                  <div className="remediation-code-body">
                    <div className="remediation-code-row" style={{ backgroundColor: '#111827' }}>
                      <span className="remediation-code-label">diff</span>
                      <span className="remediation-code-val">+ db.where(eq(users.id, userId))</span>
                    </div>
                    <div className="remediation-code-row" style={{ backgroundColor: '#111827' }}>
                      <span className="remediation-code-label">guard</span>
                      <span className="remediation-code-val">+ assertTenantAccess(session.orgId)</span>
                    </div>
                    <div className="remediation-code-row" style={{ backgroundColor: '#111827' }}>
                      <span className="remediation-code-label">test</span>
                      <span className="remediation-code-val">+ rejects cross-tenant object access</span>
                    </div>
                    <div className="remediation-code-row" style={{ backgroundColor: 'rgba(52, 211, 153, 0.08)', borderColor: 'rgba(52, 211, 153, 0.2)' }}>
                      <span className="remediation-code-label" style={{ color: 'var(--accent-success)' }}>scan</span>
                      <span className="remediation-code-val" style={{ color: 'var(--accent-success)' }}>✓ source-to-sink path closed</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW 5: KNOWLEDGE MEMORY */}
          {currentView === 'memory' && (
            <div className="section-wrapper">
              <div className="section-header">
                <span className="section-tag">Knowledge Memory</span>
                <h2 className="section-title">AI that learns, remembers, and improves.</h2>
                <p className="section-desc">
                  CodeVerdict builds a living memory graph of your codebase — learning architecture, suppressing noise, and applying your team's decisions automatically on every future scan.
                </p>
              </div>

              <div className="intel-grid-container">
                <div className="intel-grid">
                  
                  {/* Card 1 */}
                  <div className="intel-card">
                    <div className="intel-card-icon-box">🌳</div>
                    <h4>Codegraph</h4>
                    <p>
                      Maps every file, import, and dependency. Calculates impact scores so AI prioritizes high-traffic, high-risk files automatically.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="intel-card">
                    <div className="intel-card-icon-box">⚙️</div>
                    <h4>Audit Config</h4>
                    <p>
                      Set scan depth, severity thresholds, custom suppression rules, and path-specific policies.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="intel-card">
                    <div className="intel-card-icon-box">🏢</div>
                    <h4>Business Context</h4>
                    <p>
                      Feed README, architecture notes, or role definitions so AI catches domain-specific business logic flaws.
                    </p>
                  </div>

                  {/* Card 4 */}
                  <div className="intel-card">
                    <div className="intel-card-icon-box">🧠</div>
                    <h4>Memory Graph</h4>
                    <p>
                      Persistent knowledge across scans. CodeVerdict remembers architecture, suppressions, and team decisions.
                    </p>
                  </div>

                </div>

                {/* Bottom Banner */}
                <div className="intel-banner" style={{ backgroundColor: 'rgba(16, 185, 129, 0.04)', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
                  <div className="intel-banner-icon-box">📈</div>
                  <div className="intel-banner-text-box">
                    <span className="intel-banner-title">AI learns from every scan</span>
                    <span className="intel-banner-desc" style={{ color: 'var(--text-secondary)' }}>
                      The memory graph persists across every scan, remembers your architecture, learns false-positive patterns in your codebase, and improves signal-to-noise automatically over time.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Viewport Footer */}
          <footer className="viewport-footer" style={{ marginTop: '3.5rem', background: 'transparent' }}>
            <p>© 2026 CodeVerdict. Built for Technical Review Portfolio.</p>
          </footer>

        </main>
      </div>

    </div>
  );
}
