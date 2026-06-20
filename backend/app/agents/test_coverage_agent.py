import logging
from typing import Dict, Any
from app.agents.base_agent import BaseAgent
from app.models.schemas import Finding, AgentReviewResult

logger = logging.getLogger(__name__)

class TestCoverageAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Test Coverage Agent", category="Coverage")

    async def review(self, pr_details: Dict[str, Any]) -> AgentReviewResult:
        logger.info("Test Coverage Agent review started.")
        files = pr_details.get("files", [])

        # Prepare diff content for LLM
        diff_str = ""
        for f in files:
            diff_str += f"File: {f.get('filename')}\nStatus: {f.get('status')}\nDiff:\n{f.get('patch', '')}\n\n"

        system_prompt = (
            "You are CodeSentry Test Coverage Agent, a QA engineer and unit-testing expert.\n"
            "Your objective is to inspect the code changes in this Pull Request and assess testing status.\n\n"
            "Analyze the changes for:\n"
            "- New business logic (functions, routes, classes, conditions) introduced without accompanying unit or integration tests.\n"
            "- Boundary cases or error conditions that are not tested.\n"
            "- Missing mock setups for external API integration in test files.\n\n"
            "Your suggestions MUST recommend concrete unit test implementations using popular testing frameworks (like pytest or unittest) "
            "complete with expected input parameters and assertions.\n\n"
            "Output your findings strictly as a JSON object with a single 'findings' key pointing to an array of objects. "
            "Each object must have: 'severity' (Critical, Warning, Suggestion), 'category' ('Coverage'), 'file', 'line_range', "
            "'description', and 'suggestion'. Do not add any text before or after the JSON output."
        )

        user_prompt = (
            f"Pull Request: {pr_details.get('title')}\n"
            f"Description: {pr_details.get('body')}\n\n"
            f"--- Code Changes ---\n{diff_str}\n\n"
            "Analyze the changes and output findings in JSON format:"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        raw_response = ""
        findings = []
        try:
            raw_response = await self.client.chat_completion(
                messages=messages,
                response_format={"type": "json_object"}
            )
            findings = self._parse_llm_json_response(raw_response)
        except Exception as e:
            logger.error(f"Error calling Groq API in TestCoverageAgent: {e}")

        return AgentReviewResult(
            agent_name=self.name,
            findings=findings,
            raw_response=raw_response,
            retrieved_context=[]
        )
