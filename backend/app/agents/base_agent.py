import json
import logging
import re
from typing import Dict, Any, List
from app.models.schemas import Finding, AgentReviewResult
from app.llm.groq_client import groq_client

logger = logging.getLogger(__name__)

class BaseAgent:
    def __init__(self, name: str, category: str):
        self.name = name
        self.category = category
        self.client = groq_client

    async def review(self, pr_details: Dict[str, Any]) -> AgentReviewResult:
        """
        Main review function to be implemented by all specialist agents.
        Accepts pr_details containing 'title', 'body', and 'files'.
        Returns AgentReviewResult.
        """
        raise NotImplementedError("Specialist agents must implement review()")

    def _parse_llm_json_response(self, text: str) -> List[Finding]:
        """
        Helper method to parse and clean JSON output from LLM chat completion.
        Attempts to extract a JSON list/object of findings and converts them to Finding Pydantic models.
        """
        if not text:
            return []
            
        clean_text = text.strip()
        
        # Remove markdown code blocks if present
        if clean_text.startswith("```"):
            # Try to match ```json <content> ``` or ``` <content> ```
            match = re.search(r"```(?:json)?\s*(.*?)\s*```", clean_text, re.DOTALL)
            if match:
                clean_text = match.group(1).strip()
                
        try:
            parsed = json.loads(clean_text)
            
            # Extract findings list
            findings_data = []
            if isinstance(parsed, list):
                findings_data = parsed
            elif isinstance(parsed, dict):
                # Check for common keys: 'findings', 'results', 'issues'
                for key in ["findings", "results", "issues", "comments"]:
                    if key in parsed and isinstance(parsed[key], list):
                        findings_data = parsed[key]
                        break
                # If no list found under standard keys, check if any value is a list
                if not findings_data:
                    for val in parsed.values():
                        if isinstance(val, list):
                            findings_data = val
                            break
                    # If still nothing, it could be a single finding dictionary
                    if not findings_data and all(k in parsed for k in ["severity", "description", "suggestion"]):
                        findings_data = [parsed]
            
            # Map list of dicts to Finding models
            valid_findings = []
            for item in findings_data:
                try:
                    # Enforce/normalize severity
                    severity = item.get("severity", "Suggestion").strip()
                    # Map common naming variations
                    if severity.lower() in ["critical", "high", "error"]:
                        severity = "Critical"
                    elif severity.lower() in ["warning", "medium", "moderate"]:
                        severity = "Warning"
                    else:
                        severity = "Suggestion"
                        
                    # Map categories to our agent's category as fallback
                    category = item.get("category", self.category).strip()
                    
                    finding = Finding(
                        severity=severity,
                        category=category,
                        file=item.get("file", "unknown").strip(),
                        line_range=str(item.get("line_range", "")) if item.get("line_range") is not None else None,
                        description=item.get("description", "").strip(),
                        suggestion=item.get("suggestion", "").strip()
                    )
                    
                    # Ensure description is not empty
                    if finding.description:
                        valid_findings.append(finding)
                except Exception as exc:
                    logger.warning(f"Discarded invalid finding item '{item}' due to validation error: {exc}")
                    
            return valid_findings
            
        except json.JSONDecodeError as exc:
            logger.error(f"Failed to parse LLM response as JSON. Error: {exc}. Raw text: {text}")
            # Try to regex-extract JSON blocks if parsing the whole thing failed
            try:
                json_match = re.search(r"\[\s*\{.*\}\s*\]", clean_text, re.DOTALL)
                if json_match:
                    return self._parse_llm_json_response(json_match.group(0))
            except Exception:
                pass
            return []
