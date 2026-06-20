import React, { useState } from 'react';

export default function AgentFindingsCard({ agentBreakdowns }) {
  const agentNames = Object.keys(agentBreakdowns);
  const [activeTab, setActiveTab] = useState(agentNames[0] || '');

  if (!agentNames.length) return null;

  const activeFindings = agentBreakdowns[activeTab] || [];

  const getSeverityClass = (sev) => {
    switch (sev.toLowerCase()) {
      case 'critical': return 'badge-critical';
      case 'warning': return 'badge-warning';
      default: return 'badge-suggestion';
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

  return (
    <div className="card findings-card">
      <div className="card-header">
        <h3>Specialist Agent Reviews</h3>
        <p className="card-subtitle">Detailed breakdown of findings from each individual AI specialist.</p>
      </div>

      {/* Tabs list */}
      <div className="tabs-container">
        {agentNames.map((name) => {
          const count = agentBreakdowns[name]?.length || 0;
          return (
            <button
              key={name}
              className={`tab-btn ${activeTab === name ? 'active-tab' : ''}`}
              onClick={() => setActiveTab(name)}
            >
              {name}
              <span className={`tab-badge ${count > 0 ? 'has-findings' : 'no-findings'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Findings List */}
      <div className="tab-content">
        {activeFindings.length === 0 ? (
          <div className="empty-state">
            <span className="success-icon">✓</span>
            <h4>No findings reported by this agent.</h4>
            <p>Code meets all criteria checked by the {activeTab}.</p>
          </div>
        ) : (
          <div className="findings-list">
            {activeFindings.map((finding, idx) => {
              const isStaticVerified = finding.description.toLowerCase().includes('bandit rule');
              const confidenceScore = calculateConfidence(finding);

              const severityClass = finding.severity.toLowerCase();
              const verifiedClass = isStaticVerified ? 'verified' : severityClass;

              return (
                <div key={idx} className={`finding-item ${verifiedClass}`}>
                  <div className="finding-meta">
                    <div className="badges-row">
                      <span className={`badge ${getSeverityClass(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      {isStaticVerified && (
                        <span className="badge-static-verified">
                          ⚡ Verified by Bandit SAST
                        </span>
                      )}
                    </div>
                    <span className="finding-file-path">
                      <code>{finding.file}{finding.line_range ? `:L${finding.line_range}` : ''}</code>
                    </span>
                  </div>
                  
                  <h4 className="finding-title">{finding.description}</h4>
                  
                  {finding.suggestion && (
                    <div className="finding-suggestion">
                      <h5>Proposed Fix:</h5>
                      <pre className="code-block">
                        <code>{finding.suggestion}</code>
                      </pre>
                    </div>
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
    </div>
  );
}
