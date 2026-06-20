import React, { useState, useEffect } from 'react';

const LOADING_PHASES = [
  { step: 0, text: "GitHub Client: Fetching PR details and unified diff files..." },
  { step: 1, text: "Orchestrator: Initialized and concurrently dispatching specialist agents..." },
  { step: 2, text: "Security Agent: Running Bandit static analyzer and RAG secure-coding semantic lookup..." },
  { step: 3, text: "Quality Agent: Executing PEP 8 style validation and code architecture audit..." },
  { step: 4, text: "Performance Agent: Inspecting loops, complexity, and resource leaks..." },
  { step: 5, text: "Test Coverage Agent: Checking unit test compliance and missing boundary tests..." },
  { step: 6, text: "Synthesizer Agent: Compiling findings, prioritizing, and deduplicating..." },
  { step: 7, text: "Synthesizer Agent: Structuring final review report..." }
];

export default function LoadingState() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [agentStatuses, setAgentStatuses] = useState({
    github: 'running',
    security: 'idle',
    quality: 'idle',
    performance: 'idle',
    coverage: 'idle',
    synthesizer: 'idle'
  });

  useEffect(() => {
    // Phase text ticker
    const textInterval = setInterval(() => {
      setPhaseIndex((prev) => {
        if (prev < LOADING_PHASES.length - 1) return prev + 1;
        return prev;
      });
    }, 2000);

    // Agent status state controller (visual pipeline simulation)
    const statusTimeout1 = setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, github: 'done', security: 'running', quality: 'running' }));
    }, 2500);

    const statusTimeout2 = setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, performance: 'running', coverage: 'running' }));
    }, 4500);

    const statusTimeout3 = setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, security: 'done', quality: 'done' }));
    }, 7500);

    const statusTimeout4 = setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, performance: 'done', coverage: 'done', synthesizer: 'running' }));
    }, 10000);

    const statusTimeout5 = setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, synthesizer: 'done' }));
    }, 13000);

    return () => {
      clearInterval(textInterval);
      clearTimeout(statusTimeout1);
      clearTimeout(statusTimeout2);
      clearTimeout(statusTimeout3);
      clearTimeout(statusTimeout4);
      clearTimeout(statusTimeout5);
    };
  }, []);

  const getStatusClass = (status) => {
    if (status === 'running') return 'running';
    if (status === 'done') return 'done';
    return '';
  };

  const getStatusText = (status) => {
    if (status === 'running') return 'RUNNING';
    if (status === 'done') return 'COMPLETED';
    return 'QUEUED';
  };

  return (
    <div className="card loading-card">
      <div className="spinner-container">
        <div className="double-bounce-spinner">
          <div className="bounce1"></div>
          <div className="bounce2"></div>
        </div>
      </div>
      
      <h3>Running CodeVerdict Pipeline</h3>
      <p className="loading-step-text">{LOADING_PHASES[phaseIndex].text}</p>
      
      <div className="loading-agent-grid">
        <div className={`loading-agent-item ${agentStatuses.github === 'running' ? 'active' : ''}`}>
          <span className="agent-name-lbl">📦 GitHub Connection</span>
          <span className={`agent-status-lbl ${getStatusClass(agentStatuses.github)}`}>
            {getStatusText(agentStatuses.github)}
          </span>
        </div>
        <div className={`loading-agent-item ${agentStatuses.security === 'running' ? 'active' : ''}`}>
          <span className="agent-name-lbl">🛡️ Security Agent</span>
          <span className={`agent-status-lbl ${getStatusClass(agentStatuses.security)}`}>
            {getStatusText(agentStatuses.security)}
          </span>
        </div>
        <div className={`loading-agent-item ${agentStatuses.quality === 'running' ? 'active' : ''}`}>
          <span className="agent-name-lbl">✨ Quality Agent</span>
          <span className={`agent-status-lbl ${getStatusClass(agentStatuses.quality)}`}>
            {getStatusText(agentStatuses.quality)}
          </span>
        </div>
        <div className={`loading-agent-item ${agentStatuses.performance === 'running' ? 'active' : ''}`}>
          <span className="agent-name-lbl">⚡ Performance Agent</span>
          <span className={`agent-status-lbl ${getStatusClass(agentStatuses.performance)}`}>
            {getStatusText(agentStatuses.performance)}
          </span>
        </div>
        <div className={`loading-agent-item ${agentStatuses.coverage === 'running' ? 'active' : ''}`}>
          <span className="agent-name-lbl">🧪 Test Coverage Agent</span>
          <span className={`agent-status-lbl ${getStatusClass(agentStatuses.coverage)}`}>
            {getStatusText(agentStatuses.coverage)}
          </span>
        </div>
        <div className={`loading-agent-item ${agentStatuses.synthesizer === 'running' ? 'active' : ''}`}>
          <span className="agent-name-lbl">⚖️ Synthesizer Agent</span>
          <span className={`agent-status-lbl ${getStatusClass(agentStatuses.synthesizer)}`}>
            {getStatusText(agentStatuses.synthesizer)}
          </span>
        </div>
      </div>
      
      <p className="loading-subtext">
        Please wait. We are running static analysis checks, vector similarity queries, and parallel LLM evaluations.
      </p>
    </div>
  );
}
