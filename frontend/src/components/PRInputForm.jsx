import React, { useState } from 'react';

const MOCK_OPTIONS = [
  { value: 'mock://backend/eval/dataset/vulnerable_pr.json', label: 'Vulnerable & Style Issues PR' },
  { value: 'mock://backend/eval/dataset/performance_issue_pr.json', label: 'N+1 Database Query & Exceptions PR' },
  { value: 'mock://backend/eval/dataset/untested_code_pr.json', label: 'Untested Code (Coverage) PR' },
];

export default function PRInputForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [selectedMock, setSelectedMock] = useState(MOCK_OPTIONS[0].value);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a valid Pull Request URL or load a mock dataset');
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
    <div className="prf-root">
      <form onSubmit={handleSubmit} className="prf-form">
        {/* URL input row */}
        <div className="prf-input-row">
          <div className="prf-input-wrap" style={{ flex: 1 }}>
            <span className="prf-input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </span>
            <input
              id="pr-url-input"
              type="text"
              placeholder="https://github.com/owner/repo/pull/123"
              value={url}
              onChange={(e) => { setUrl(e.target.value); if (error) setError(''); }}
              disabled={isLoading}
              className={`prf-input ${error ? 'prf-input--error' : ''}`}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="prf-submit-btn"
          >
            {isLoading ? (
              <>
                <span className="prf-spinner" />
                Analyzing…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Scan PR
              </>
            )}
          </button>
        </div>

        {error && <span className="prf-error">{error}</span>}

        {/* Mock section */}
        <div className="prf-mock-row">
          <span className="prf-mock-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Offline mock:
          </span>
          <select
            value={selectedMock}
            onChange={(e) => setSelectedMock(e.target.value)}
            disabled={isLoading}
            className="prf-select"
          >
            {MOCK_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleLoadMock}
            disabled={isLoading}
            className="prf-mock-btn"
          >
            Load
          </button>
        </div>
      </form>
    </div>
  );
}
