import asyncio
import logging
import time
from typing import Dict, List, Any
from app.github_client import github_client
from app.agents.security_agent import SecurityAgent
from app.agents.quality_agent import QualityAgent
from app.agents.performance_agent import PerformanceAgent
from app.agents.test_coverage_agent import TestCoverageAgent
from app.agents.synthesizer_agent import SynthesizerAgent
from app.models.schemas import SynthesisResult, Finding

logger = logging.getLogger(__name__)

class Orchestrator:
    def __init__(self):
        self.security_agent = SecurityAgent()
        self.quality_agent = QualityAgent()
        self.performance_agent = PerformanceAgent()
        self.test_coverage_agent = TestCoverageAgent()
        self.synthesizer = SynthesizerAgent()

    async def review_pr(self, pr_url: str) -> SynthesisResult:
        """
        Orchestrates the entire multi-agent review pipeline.
        1. Fetches PR details from GitHub API (or local mock files).
        2. Runs all specialist agents in parallel via asyncio.gather.
        3. Calls the Synthesizer Agent to compile and rank all findings.
        """
        start_time = time.time()
        logger.info(f"Starting review pipeline for: {pr_url}")

        # 1. Fetch PR details (including diffs and full contents)
        pr_details = await github_client.fetch_pr_details(pr_url)
        logger.info(f"Fetched PR data: '{pr_details.get('title')}' with {len(pr_details.get('files', []))} files.")

        # 2. Define agent tasks for concurrent execution
        agents = [
            self.security_agent,
            self.quality_agent,
            self.performance_agent,
            self.test_coverage_agent
        ]
        
        async def run_agent(agent) -> tuple[str, List[Finding]]:
            agent_start = time.time()
            try:
                result = await agent.review(pr_details)
                duration = time.time() - agent_start
                logger.info(f"Agent '{agent.name}' completed in {duration:.2f}s with {len(result.findings)} findings.")
                return agent.name, result.findings
            except Exception as e:
                logger.error(f"Agent '{agent.name}' failed: {e}", exc_info=True)
                return agent.name, []

        # Run concurrent gather
        logger.info("Triggering specialist agents concurrently...")
        tasks = [run_agent(agent) for agent in agents]
        agent_outputs = await asyncio.gather(*tasks)

        # Build mapping of agent name -> findings list
        agent_results: Dict[str, List[Finding]] = {}
        for agent_name, findings in agent_outputs:
            agent_results[agent_name] = findings

        # 3. Run Synthesis Step
        logger.info("Executing synthesizer step...")
        synthesis_result = await self.synthesizer.synthesize(pr_url, agent_results)
        
        total_duration = time.time() - start_time
        logger.info(f"Review pipeline finished in {total_duration:.2f}s. Total synthesized findings: {len(synthesis_result.findings)}.")
        
        return synthesis_result

# Singleton instance
orchestrator = Orchestrator()
