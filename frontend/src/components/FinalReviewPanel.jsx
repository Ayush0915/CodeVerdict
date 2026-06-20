import React, { useState } from 'react';

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

  const categories = ['All', 'Security', 'Quality', 'Performance', 'Coverage'];
  
  const filteredFindings = filter === 'All' 
    ? findings 
    : findings.filter(f => f.category.toLowerCase() === filter.toLowerCase());

  return (
    <div className="card review-panel">
      <div className="card-header">
        <span className="main-badge">Synthesized Output</span>
        <h2>Final Synthesized Review</h2>
        <p className="pr-reference-url">Target: <code>{pr_url}</code></p>
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
          <p>The code is clean under the selected category.</p>
        </div>
      ) : (
        <div className="synthesized-list">
          {filteredFindings.map((finding, idx) => (
            <div key={idx} className="synthesized-item">
              <div className="finding-top-row">
                <div className="badges-row">
                  <span className={`badge ${getSeverityClass(finding.severity)}`}>
                    {finding.severity}
                  </span>
                  <span className={`badge ${getCategoryClass(finding.category)}`}>
                    {finding.category}
                  </span>
                </div>
                <span className="file-info">
                  {finding.file}
                  {finding.line_range ? ` : L${finding.line_range}` : ''}
                </span>
              </div>

              <h4 className="synthesized-desc">{finding.description}</h4>

              {finding.suggestion && (
                <div className="synthesized-fix">
                  <h5>Actionable Code Fix:</h5>
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
  );
}
