import json
import logging
from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent
from app import config
from app.models.schemas import Finding, SynthesisResult

logger = logging.getLogger(__name__)

class SynthesizerAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Synthesizer Agent", category="Synthesis")

    async def synthesize(self, pr_url: str, agent_results: Dict[str, List[Finding]]) -> SynthesisResult:
        """
        Merges, prioritizes, and deduplicates findings from all agents.
        Returns a SynthesisResult.
        """
        logger.info("Synthesizer Agent execution started.")
        
        # Flatten all findings for the prompt and fallback
        all_findings_raw = []
        for agent_name, findings in agent_results.items():
            for f in findings:
                all_findings_raw.append({
                    "source_agent": agent_name,
                    "severity": f.severity,
                    "category": f.category,
                    "file": f.file,
                    "line_range": f.line_range,
                    "description": f.description,
                    "suggestion": f.suggestion
                })

        if not all_findings_raw:
            return SynthesisResult(
                pr_url=pr_url,
                summary="CodeSentry reviewed the pull request. No issues were found! Code looks clean and ready.",
                findings=[],
                agent_breakdowns={name: findings for name, findings in agent_results.items()}
            )

        system_prompt = (
            "You are CodeSentry Synthesizer Agent, a lead software architect. "
            "Your role is to compile and refine code review findings from multiple specialized agents (Security, Quality, Performance, Coverage).\n\n"
            "Your tasks:\n"
            "1. Read the list of raw findings from all agents.\n"
            "2. Generate a professional high-level executive summary (2-4 sentences) evaluating the overall quality, "
            "security posture, and performance implications of this PR.\n"
            "3. Deduplicate findings. If different agents flagged the exact same line range in the same file for the same underlying issue, "
            "merge them into a single finding. If they flagged the same line for different reasons, keep both but ensure they are concise.\n"
            "4. Sort and prioritize findings: Critical findings must be first, followed by Warning, then Suggestion.\n"
            "5. Format output strictly as a JSON object with 'summary' (string) and 'findings' (array of objects) keys. "
            "Do not include markdown format wrappers or conversational text around the JSON."
        )

        user_prompt = (
            f"PR URL: {pr_url}\n\n"
            f"--- Raw Findings from Specialist Agents ---\n"
            f"{json.dumps(all_findings_raw, indent=2)}\n\n"
            "Synthesize these findings into a prioritized, deduplicated JSON response:"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            raw_response = await self.client.chat_completion(
                messages=messages,
                model=config.SYNTHESIS_LLM_MODEL,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            parsed = json.loads(raw_response.strip())
            
            # Map JSON list to Pydantic findings
            synthesized_findings = []
            for item in parsed.get("findings", []):
                try:
                    severity = item.get("severity", "Suggestion").strip()
                    if severity.lower() in ["critical", "high", "error"]:
                        severity = "Critical"
                    elif severity.lower() in ["warning", "medium", "moderate"]:
                        severity = "Warning"
                    else:
                        severity = "Suggestion"
                        
                    synthesized_findings.append(Finding(
                        severity=severity,
                        category=item.get("category", "Quality").strip(),
                        file=item.get("file", "unknown").strip(),
                        line_range=str(item.get("line_range", "")) if item.get("line_range") is not None else None,
                        description=item.get("description", "").strip(),
                        suggestion=item.get("suggestion", "").strip()
                    ))
                except Exception as e:
                    logger.warning(f"Failed to parse synthesized finding: {e}")

            summary = parsed.get("summary", "Review completed by CodeSentry.")
            
            return SynthesisResult(
                pr_url=pr_url,
                summary=summary,
                findings=synthesized_findings,
                agent_breakdowns={name: findings for name, findings in agent_results.items()}
            )

        except Exception as e:
            logger.error(f"Error during Synthesizer LLM synthesis: {e}. Falling back to Python merger.")
            return self._fallback_synthesis(pr_url, agent_results)

    def _fallback_synthesis(self, pr_url: str, agent_results: Dict[str, List[Finding]]) -> SynthesisResult:
        """
        Standard Python fallback synthesis to prevent system crash if LLM synthesis fails.
        """
        seen_keys = set()
        deduplicated = []
        
        critical_count = 0
        warning_count = 0
        suggestion_count = 0
        
        for agent_name, findings in agent_results.items():
            for f in findings:
                # Key based on file, line, and category/description hash to avoid duplicate findings
                key = (f.file.lower(), f.line_range or "", f.category.lower(), f.description[:50].lower())
                if key not in seen_keys:
                    seen_keys.add(key)
                    deduplicated.append(f)
                    
                    if f.severity == "Critical":
                        critical_count += 1
                    elif f.severity == "Warning":
                        warning_count += 1
                    else:
                        suggestion_count += 1
                        
        # Sort by severity priority: Critical > Warning > Suggestion
        severity_order = {"Critical": 0, "Warning": 1, "Suggestion": 2}
        deduplicated.sort(key=lambda x: severity_order.get(x.severity, 3))
        
        summary = (
            f"CodeSentry complete. We analyzed the pull request and identified "
            f"{critical_count} critical issues, {warning_count} warnings, and {suggestion_count} suggestions. "
            "Please review the detailed findings below categorized by agent."
        )
        
        return SynthesisResult(
            pr_url=pr_url,
            summary=summary,
            findings=deduplicated,
            agent_breakdowns={name: findings for name, findings in agent_results.items()}
        )
