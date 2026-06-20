import React, { useState } from 'react';

/* ── Code fix block ──────────────────────────────────────── */
const CodeFixBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="cfb-root">
      <div className="cfb-header">
        <div className="cfb-header-left">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
          </svg>
          <span>PROPOSED FIX</span>
        </div>
        <button type="button" className="cfb-copy-btn" onClick={handleCopy}>
          {copied ? (
            <span className="cfb-copied">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </span>
          ) : (
            <span className="cfb-copy-label">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </span>
          )}
        </button>
      </div>
      <pre className="cfb-code"><code>{code}</code></pre>
    </div>
  );
};

/* ── Severity / category helpers ─────────────────────────── */
const SEV_MAP = {
  critical: { cls: 'rp-sev rp-sev--critical', label: 'Critical' },
  warning:  { cls: 'rp-sev rp-sev--warning',  label: 'Warning'  },
  info:     { cls: 'rp-sev rp-sev--info',     label: 'Info'     },
};

const CAT_MAP = {
  security:    'rp-cat rp-cat--security',
  quality:     'rp-cat rp-cat--quality',
  performance: 'rp-cat rp-cat--performance',
  coverage:    'rp-cat rp-cat--coverage',
};

const calcConfidence = (finding) => {
  if (finding.description.toLowerCase().includes('bandit rule')) return 98;
  switch (finding.severity.toLowerCase()) {
    case 'critical': return 92;
    case 'warning':  return 82;
    default:         return 70;
  }
};

/* ── Main component ──────────────────────────────────────── */
export default function FinalReviewPanel({ reviewData }) {
  const { summary, findings, pr_url } = reviewData;
  const [filter, setFilter] = useState('All');

  const isMock = pr_url.startsWith('mock://') || pr_url.startsWith('local://');
  const categories = ['All', 'Security', 'Quality', 'Performance', 'Coverage'];

  const filteredFindings = filter === 'All'
    ? findings
    : findings.filter(f => f.category.toLowerCase() === filter.toLowerCase());

  return (
    <div className="rp-root">
      {/* ── Header ── */}
      <div className="rp-header">
        <div className="rp-header-top">
          <span className="rp-badge-label">Synthesized Output</span>
          <span className={`rp-mode-badge ${isMock ? 'rp-mode-badge--mock' : 'rp-mode-badge--live'}`}>
            {isMock ? '⚡ Offline Simulation' : '🌐 Live GitHub'}
          </span>
        </div>
        <h2 className="rp-title">Final Synthesized Review</h2>
        <p className="rp-url">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
          <code>{pr_url}</code>
        </p>
      </div>

      {/* ── Executive Summary ── */}
      <div className="rp-summary">
        <div className="rp-summary-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Executive Summary
        </div>
        <p className="rp-summary-text">{summary}</p>
      </div>

      {/* ── Findings header + filter ── */}
      <div className="rp-findings-header">
        <h3 className="rp-findings-title">
          Merged &amp; Ranked Findings
          <span className="rp-findings-count">{filteredFindings.length}</span>
        </h3>
        <div className="rp-filter-row">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rp-filter-btn ${filter === cat ? 'rp-filter-btn--active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Findings list ── */}
      {filteredFindings.length === 0 ? (
        <div className="rp-empty">
          <div className="rp-empty-icon">✓</div>
          <h4>No findings in this category</h4>
          <p>The code meets all analysis gates for the selected filter.</p>
        </div>
      ) : (
        <div className="rp-findings-list">
          {filteredFindings.map((finding, idx) => {
            const isStaticVerified = finding.description.toLowerCase().includes('bandit rule');
            const confidence = calcConfidence(finding);
            const sevKey = finding.severity.toLowerCase();
            const catKey = finding.category.toLowerCase();
            const { cls: sevCls } = SEV_MAP[sevKey] || SEV_MAP.info;

            return (
              <div key={idx} className={`rp-finding-card rp-finding-card--${sevKey}`}>

                {/* Top row: badges + file */}
                <div className="rp-finding-top">
                  <div className="rp-finding-badges">
                    <span className={sevCls}>{finding.severity}</span>
                    <span className={CAT_MAP[catKey] || 'rp-cat'}>{finding.category}</span>
                    {isStaticVerified && (
                      <span className="rp-verified-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Verified by Bandit SAST
                      </span>
                    )}
                  </div>
                  <code className="rp-finding-file">
                    {finding.file}{finding.line_range ? `:L${finding.line_range}` : ''}
                  </code>
                </div>

                {/* Description */}
                <p className="rp-finding-desc">{finding.description}</p>

                {/* Proposed fix */}
                {finding.suggestion && <CodeFixBlock code={finding.suggestion} />}

                {/* Confidence row */}
                <div className="rp-confidence">
                  <span className="rp-confidence-label">Confidence</span>
                  <div className="rp-confidence-bar">
                    <div
                      className={`rp-confidence-fill rp-confidence-fill--${isStaticVerified ? 'verified' : sevKey}`}
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                  <span className={`rp-confidence-val ${isStaticVerified ? 'rp-confidence-val--verified' : ''}`}>
                    {confidence}%
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
