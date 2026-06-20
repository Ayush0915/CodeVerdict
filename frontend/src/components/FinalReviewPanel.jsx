import React, { useState } from 'react';

const CodeFixBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="code-fix-block">
      <div className="code-fix-header">
        <span className="code-fix-lang">proposed fix</span>
        <button type="button" className="code-copy-btn" onClick={handleCopy}>
          {copied ? (
            <span style={{ color: 'var(--accent-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Copied!
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy
            </span>
          )}
        </button>
      </div>
      <pre className="code-block">
        <code>{code}</code>
      </pre>
    </div>
  );
};


export default function FinalReviewPanel({ reviewData }) {
  const { summary, findings, pr_url } = reviewData;
  const [filter, setFilter] = useState('All');

  const getSeverityClass = (sev) => {
    switch (sev.toLowerCase()) {
      case 'critical': return 'badge-critical';
      case 'warning': return 'badge-warning';
      default: return 'badge-suggestion';
    }
  };

  const getCategoryClass = (cat) => {
    switch (cat.toLowerCase()) {
      case 'security': return 'badge-cat-security';
      case 'quality': return 'badge-cat-quality';
      case 'performance': return 'badge-cat-performance';
      default: return 'badge-cat-coverage';
    }
  };

  const calculateConfidence = (finding) => {
    const isStaticVerified = finding.description.toLowerCase().includes('bandit rule');
    if (isStaticVerified) return 98;
    
    switch (finding.severity.toLowerCase()) {
      case 'critical': return 92;
      case 'warning': return 82;
      default: return 70;
    }
  };

  const categories = ['All', 'Security', 'Quality', 'Performance', 'Coverage'];
  
  const filteredFindings = filter === 'All' 
    ? findings 
    : findings.filter(f => f.category.toLowerCase() === filter.toLowerCase());

  const isMock = pr_url.startsWith('mock://') || pr_url.startsWith('local://');

  return (
    <div className="card review-panel">
      <div className="card-header">
        <span className="main-badge">Synthesized Output</span>
        <h2>
          Final Synthesized Review
          <span className={`badge-conn-type ${isMock ? 'badge-conn-mock' : 'badge-conn-live'}`}>
            {isMock ? '⚡ Offline Simulation' : '🌐 Live GitHub'}
          </span>
        </h2>
        <p className="pr-reference-url">Target URL: <code>{pr_url}</code></p>
      </div>

      {/* Summary Box */}
      <div className="summary-box">
        <h4>Executive Summary</h4>
        <p>{summary}</p>
      </div>

      {/* Findings Header & Filter */}
      <div className="findings-header">
        <h3>Merged & Ranked Findings ({filteredFindings.length})</h3>
        
        <div className="filter-group">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`filter-btn ${filter === cat ? 'active-filter' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="empty-state">
          <span className="success-icon">✓</span>
          <h4>No synthesized findings.</h4>
          <p>The code meets all analysis gates under the selected category.</p>
        </div>
      ) : (
        <div className="synthesized-list">
          {filteredFindings.map((finding, idx) => {
            const isStaticVerified = finding.description.toLowerCase().includes('bandit rule');
            const confidenceScore = calculateConfidence(finding);
            
            const severityClass = finding.severity.toLowerCase();
            const verifiedClass = isStaticVerified ? 'verified' : severityClass;

            return (
              <div key={idx} className={`synthesized-item ${verifiedClass}`}>
                <div className="finding-top-row">
                  <div className="badges-row">
                    <span className={`badge ${getSeverityClass(finding.severity)}`}>
                      {finding.severity}
                    </span>
                    <span className={`badge ${getCategoryClass(finding.category)}`}>
                      {finding.category}
                    </span>
                    {isStaticVerified && (
                      <span className="badge-static-verified">
                        ⚡ Verified by Bandit SAST
                      </span>
                    )}
                  </div>
                  <span className="file-info">
                    <code>{finding.file}{finding.line_range ? `:L${finding.line_range}` : ''}</code>
                  </span>
                </div>

                <h4 className="synthesized-desc">{finding.description}</h4>

                {finding.suggestion && (
                  <CodeFixBlock code={finding.suggestion} />
                )}

                {/* Score Bar - Signature UI Element */}
                <div className="confidence-score-container">
                  <span className="confidence-score-label">Confidence Matrix</span>
                  <div className="confidence-score-bar-wrapper">
                    <div 
                      className={`confidence-score-bar-fill ${isStaticVerified ? 'verified' : finding.severity.toLowerCase()}`} 
                      style={{ width: `${confidenceScore}%` }} 
                    />
                  </div>
                  <span 
                    className="confidence-score-label" 
                    style={{ 
                      fontWeight: '600', 
                      color: isStaticVerified ? 'var(--accent-success)' : 'var(--text-primary)' 
                    }}
                  >
                    {confidenceScore}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
