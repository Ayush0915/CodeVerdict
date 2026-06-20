import React, { useState } from 'react';

/* ── Reuse the same CodeFixBlock from FinalReviewPanel ── */
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

/* ── Severity map matching FinalReviewPanel ── */
const SEV_CLS = {
  critical: 'rp-sev rp-sev--critical',
  warning:  'rp-sev rp-sev--warning',
  info:     'rp-sev rp-sev--info',
};

const calcConfidence = (finding) => {
  if (finding.description.toLowerCase().includes('bandit rule')) return 98;
  switch (finding.severity.toLowerCase()) {
    case 'critical': return 92;
    case 'warning':  return 82;
    default:         return 70;
  }
};

export default function AgentFindingsCard({ agentBreakdowns }) {
  const agentNames = Object.keys(agentBreakdowns);
  const [activeTab, setActiveTab] = useState(agentNames[0] || '');

  if (!agentNames.length) return null;

  const activeFindings = agentBreakdowns[activeTab] || [];

  return (
    <div className="afc-root">
      {/* Header */}
      <div className="afc-header">
        <h3 className="afc-title">Specialist Agent Reviews</h3>
        <p className="afc-subtitle">Detailed breakdown of findings from each individual AI specialist.</p>
      </div>

      {/* Agent tabs */}
      <div className="afc-tabs">
        {agentNames.map((name) => {
          const count = agentBreakdowns[name]?.length || 0;
          return (
            <button
              key={name}
              className={`afc-tab ${activeTab === name ? 'afc-tab--active' : ''}`}
              onClick={() => setActiveTab(name)}
            >
              {name}
              <span className={`afc-tab-count ${count > 0 ? 'afc-tab-count--has' : ''}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Findings */}
      <div className="afc-body">
        {activeFindings.length === 0 ? (
          <div className="rp-empty">
            <div className="rp-empty-icon">✓</div>
            <h4>No findings reported by this agent</h4>
            <p>Code meets all criteria checked by the {activeTab}.</p>
          </div>
        ) : (
          <div className="rp-findings-list">
            {activeFindings.map((finding, idx) => {
              const isStaticVerified = finding.description.toLowerCase().includes('bandit rule');
              const confidence = calcConfidence(finding);
              const sevKey = finding.severity.toLowerCase();

              return (
                <div key={idx} className={`rp-finding-card rp-finding-card--${sevKey}`}>

                  {/* Top row */}
                  <div className="rp-finding-top">
                    <div className="rp-finding-badges">
                      <span className={SEV_CLS[sevKey] || 'rp-sev rp-sev--info'}>
                        {finding.severity}
                      </span>
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

                  {/* Confidence bar */}
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
    </div>
  );
}
