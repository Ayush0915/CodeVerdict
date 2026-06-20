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
            {activeFindings.map((finding, idx) => (
              <div key={idx} className="finding-item">
                <div className="finding-meta">
                  <span className={`badge ${getSeverityClass(finding.severity)}`}>
                    {finding.severity}
                  </span>
                  <span className="finding-file-path">
                    {finding.file}
                    {finding.line_range ? ` : L${finding.line_range}` : ''}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
