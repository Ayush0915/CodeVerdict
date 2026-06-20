import React, { useState } from 'react';
import PRInputForm from './components/PRInputForm';
import LoadingState from './components/LoadingState';
import FinalReviewPanel from './components/FinalReviewPanel';
import AgentFindingsCard from './components/AgentFindingsCard';
import { reviewPR } from './api/client';

export default function App() {
  const [reviewData, setReviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReviewSubmit = async (url) => {
    setIsLoading(true);
    setError(null);
    setReviewData(null);

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

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-group">
            <span className="logo-icon">🛡️</span>
            <h1>CodeVerdict</h1>
          </div>
          <p>Multi-Agent Code Review & Security Gate</p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        <PRInputForm onSubmit={handleReviewSubmit} isLoading={isLoading} />

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
            {/* Final Merged Review */}
            <FinalReviewPanel reviewData={reviewData} />

            {/* Individual Agent Details */}
            <AgentFindingsCard agentBreakdowns={reviewData.agent_breakdowns} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 CodeVerdict. Built for Technical Review Portfolio.</p>
      </footer>
    </div>
  );
}
