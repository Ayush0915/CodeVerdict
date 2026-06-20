import logging
from typing import Dict, Any
from app.agents.base_agent import BaseAgent
from app.models.schemas import Finding, AgentReviewResult

logger = logging.getLogger(__name__)

class PerformanceAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Performance Agent", category="Performance")

    async def review(self, pr_details: Dict[str, Any]) -> AgentReviewResult:
        logger.info("Performance Agent review started.")
        files = pr_details.get("files", [])

        # Prepare diff content for LLM
        diff_str = ""
        for f in files:
            diff_str += f"File: {f.get('filename')}\nStatus: {f.get('status')}\nDiff:\n{f.get('patch', '')}\n\n"

        system_prompt = (
            "You are CodeSentry Performance Agent, an expert system engineer specialized in performance tuning, "
            "algorithmic efficiency, and optimization.\n"
            "Your objective is to inspect the code changes in this Pull Request and identify performance bottlenecks.\n\n"
            "Analyze the changes for:\n"
            "- Algorithmic inefficiency (e.g., O(N^2) or worse complexity where O(N log N) or O(N) is feasible).\n"
            "- Database N+1 query patterns.\n"
            "- Unnecessary memory allocations or memory leaks.\n"
            "- Redundant, duplicated, or slow network and disk operations.\n"
            "- Missing caching for expensive calculations.\n"
            "- Inefficient loop structures or repeated initialization inside loops.\n\n"
            "Output your findings strictly as a JSON object with a single 'findings' key pointing to an array of objects. "
            "Each object must have: 'severity' (Critical, Warning, Suggestion), 'category' ('Performance'), 'file', 'line_range', "
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
            logger.error(f"Error calling Groq API in PerformanceAgent: {e}")

        return AgentReviewResult(
            agent_name=self.name,
            findings=findings,
            raw_response=raw_response,
            retrieved_context=[]
        )
