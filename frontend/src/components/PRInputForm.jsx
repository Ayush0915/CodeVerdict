import React, { useState } from 'react';

export default function PRInputForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a valid Pull Request URL');
      return;
    }
    setError('');
    onSubmit(url.trim());
  };

  const handleLoadMock = () => {
    setUrl('mock://eval/dataset/vulnerable_pr.json');
    setError('');
  };

  return (
    <div className="card form-card">
      <h2>Analyze Pull Request</h2>
      <p className="card-subtitle">
        Enter a GitHub Pull Request URL or load a local mock dataset to trigger a multi-agent review.
      </p>

      <form onSubmit={handleSubmit} className="pr-form">
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
            Load Vulnerable Mock PR
          </button>
        </div>
      </form>

      <div className="spec-info">
        <span>💡 <b>Pro-Tip:</b> Using mock:// paths bypasses GitHub rate limits and runs completely offline.</span>
      </div>
    </div>
  );
}
