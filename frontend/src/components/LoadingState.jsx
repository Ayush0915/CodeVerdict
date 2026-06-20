import React, { useState, useEffect } from 'react';

const LOADING_STEPS = [
  "GitHub Client: Fetching PR details and diff files...",
  "Orchestrator: Dispatched tasks to 4 specialist agents...",
  "Security Agent: Invoking Bandit static analysis tool...",
  "Quality Agent: Performing RAG search on python-style database...",
  "Security Agent: Running RAG secure-coding semantic lookup...",
  "Performance Agent: Analyzing loop efficiency and complexity...",
  "Test Coverage Agent: Checking unit test mappings...",
  "Synthesizer Agent: Resolving conflicts, prioritizing and deduplicating...",
  "Synthesizer Agent: Generating final report summary...",
];

export default function LoadingState() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prevIndex) => (prevIndex + 1) % LOADING_STEPS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card loading-card">
      <div className="loader-container">
        <div className="spinner">
          <div className="double-bounce1"></div>
          <div className="double-bounce2"></div>
        </div>
      </div>
      <h3>Analyzing Pull Request...</h3>
      <p className="loading-step-text">{LOADING_STEPS[stepIndex]}</p>
      <p className="loading-subtext">This takes 10-15 seconds because multiple AI agents are reasoning in parallel.</p>
    </div>
  );
}
