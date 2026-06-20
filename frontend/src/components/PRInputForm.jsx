import React, { useState } from 'react';

const MOCK_OPTIONS = [
  { value: 'mock://backend/eval/dataset/vulnerable_pr.json', label: 'Vulnerable & Style Issues PR' },
  { value: 'mock://backend/eval/dataset/performance_issue_pr.json', label: 'N+1 Database Query & Exceptions PR' },
  { value: 'mock://backend/eval/dataset/untested_code_pr.json', label: 'Untested Code (Coverage) PR' }
];

export default function PRInputForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [selectedMock, setSelectedMock] = useState(MOCK_OPTIONS[0].value);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a valid Pull Request URL or select a mock PR');
      return;
    }
    setError('');
    onSubmit(url.trim());
  };

  const handleLoadMock = () => {
    setUrl(selectedMock);
    setError('');
  };

  return (
    <div className="card form-card">
      <h2>Analyze Pull Request</h2>
      <p className="card-subtitle">
        Enter a GitHub Pull Request URL or select a local mock dataset below to trigger a multi-agent review.
      </p>

      <form onSubmit={handleSubmit} className="pr-form">
        <div className="input-row">
          <div className="input-group">
            <input
              id="pr-url-input"
              type="text"
              placeholder="https://github.com/owner/repo/pull/123"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className={error ? 'input-error' : ''}
            />
            {error && <span className="error-text">{error}</span>}
          </div>
          
          <select
            value={selectedMock}
            onChange={(e) => setSelectedMock(e.target.value)}
            disabled={isLoading}
            className="mock-select-dropdown"
          >
            {MOCK_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="button-group">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Analyzing...' : 'Start Review'}
          </button>
          
          <button
            type="button"
            onClick={handleLoadMock}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Load Selected Mock
          </button>
        </div>
      </form>

      <div className="hero-stats-row">
        <div className="stat-item">
          <span className="stat-val">87.50%</span>
          <span className="stat-lbl">Overall Precision</span>
        </div>
        <div className="stat-item">
          <span className="stat-val">100.00%</span>
          <span className="stat-lbl">Overall Recall</span>
        </div>
        <div className="stat-item">
          <span className="stat-val">3 PRs</span>
          <span className="stat-lbl">Benchmark Suite</span>
        </div>
      </div>

      <div className="spec-info">
        <span>💡 <b>Pro-Tip:</b> Using mock:// paths bypasses GitHub rate limits and runs completely offline.</span>
      </div>
    </div>
  );
}
