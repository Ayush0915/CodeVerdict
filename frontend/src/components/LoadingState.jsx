import React, { useState, useEffect } from 'react';

const LOADING_PHASES = [
  { step: 0, text: 'GitHub Client: Fetching PR details and unified diff files...' },
  { step: 1, text: 'Orchestrator: Initialized and concurrently dispatching specialist agents...' },
  { step: 2, text: 'Security Agent: Running Bandit static analyzer and RAG secure-coding semantic lookup...' },
  { step: 3, text: 'Quality Agent: Executing PEP 8 style validation and code architecture audit...' },
  { step: 4, text: 'Performance Agent: Inspecting loops, complexity, and resource leaks...' },
  { step: 5, text: 'Test Coverage Agent: Checking unit test compliance and missing boundary tests...' },
  { step: 6, text: 'Synthesizer Agent: Compiling findings, prioritizing, and deduplicating...' },
  { step: 7, text: 'Synthesizer Agent: Structuring final review report...' },
];

const AGENTS = [
  { key: 'github',      icon: '📦', label: 'GitHub Connection' },
  { key: 'security',    icon: '🛡️', label: 'Security Agent' },
  { key: 'quality',     icon: '✨', label: 'Quality Agent' },
  { key: 'performance', icon: '⚡', label: 'Performance Agent' },
  { key: 'coverage',    icon: '🧪', label: 'Test Coverage Agent' },
  { key: 'synthesizer', icon: '⚖️', label: 'Synthesizer Agent' },
];

export default function LoadingState() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [agentStatuses, setAgentStatuses] = useState({
    github: 'running', security: 'idle', quality: 'idle',
    performance: 'idle', coverage: 'idle', synthesizer: 'idle',
  });

  useEffect(() => {
    const textInterval = setInterval(() => {
      setPhaseIndex((prev) => (prev < LOADING_PHASES.length - 1 ? prev + 1 : prev));
    }, 2000);

    const t1 = setTimeout(() => setAgentStatuses(p => ({ ...p, github: 'done', security: 'running', quality: 'running' })), 2500);
    const t2 = setTimeout(() => setAgentStatuses(p => ({ ...p, performance: 'running', coverage: 'running' })), 4500);
    const t3 = setTimeout(() => setAgentStatuses(p => ({ ...p, security: 'done', quality: 'done' })), 7500);
    const t4 = setTimeout(() => setAgentStatuses(p => ({ ...p, performance: 'done', coverage: 'done', synthesizer: 'running' })), 10000);
    const t5 = setTimeout(() => setAgentStatuses(p => ({ ...p, synthesizer: 'done' })), 13000);

    return () => { clearInterval(textInterval); [t1,t2,t3,t4,t5].forEach(clearTimeout); };
  }, []);

  const statusMeta = (status) => ({
    running: { label: 'RUNNING',   cls: 'ls-status--running' },
    done:    { label: 'COMPLETED', cls: 'ls-status--done'    },
    idle:    { label: 'QUEUED',    cls: 'ls-status--idle'    },
  }[status] || { label: 'QUEUED', cls: 'ls-status--idle' });

  return (
    <div className="ls-root">
      {/* Header */}
      <div className="ls-header">
        <div className="ls-spinner">
          <div className="ls-ring" />
          <div className="ls-ring ls-ring--delay" />
        </div>
        <div className="ls-header-text">
          <h3 className="ls-title">Running CodeVerdict Pipeline</h3>
          <p className="ls-phase">{LOADING_PHASES[phaseIndex].text}</p>
        </div>
      </div>

      {/* Agent grid */}
      <div className="ls-agent-grid">
        {AGENTS.map(({ key, icon, label }) => {
          const status = agentStatuses[key];
          const { label: statusLabel, cls } = statusMeta(status);
          return (
            <div key={key} className={`ls-agent ${status === 'running' ? 'ls-agent--active' : ''} ${status === 'done' ? 'ls-agent--done' : ''}`}>
              <div className="ls-agent-left">
                <span className="ls-agent-icon">{icon}</span>
                <span className="ls-agent-label">{label}</span>
              </div>
              <span className={`ls-agent-status ${cls}`}>
                {status === 'running' && <span className="ls-running-dot" />}
                {status === 'done' && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="ls-footnote">
        Running static analysis checks, vector similarity queries, and parallel LLM evaluations in parallel.
      </p>
    </div>
  );
}
