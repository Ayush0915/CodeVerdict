import json
import logging
from typing import Dict, Any
from app.agents.base_agent import BaseAgent
from app.models.schemas import Finding, AgentReviewResult
from app.tools.bandit_runner import BanditRunner
from app.rag.vector_store import vector_store

logger = logging.getLogger(__name__)

class SecurityAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Security Agent", category="Security")

    async def review(self, pr_details: Dict[str, Any]) -> AgentReviewResult:
        logger.info("Security Agent review started.")
        
        # 1. Run Bandit on files in the PR
        files = pr_details.get("files", [])
        bandit_findings = []
        try:
            bandit_findings = BanditRunner.run_on_files(files)
            logger.info(f"Bandit execution complete. Found {len(bandit_findings)} issues.")
        except Exception as e:
            logger.error(f"Error running bandit runner in SecurityAgent: {e}")

        # 2. Retrieve secure coding guidelines from Vector Store using PR details as query
        search_query = f"{pr_details.get('title', '')} {pr_details.get('body', '')}"
        for f in files:
            search_query += f" {f.get('filename', '')} {f.get('patch', '')[:200]}"
            
        retrieved_contexts = []
        retrieved_texts = []
        try:
            rag_results = vector_store.query(search_query, k=3)
            for res in rag_results:
                retrieved_contexts.append(res["text"])
                retrieved_texts.append(f"Source: {res['metadata']['file']}\n{res['text']}")
        except Exception as e:
            logger.error(f"Error querying RAG knowledge base in SecurityAgent: {e}")

        context_str = "\n\n---\n\n".join(retrieved_texts) if retrieved_texts else "No specific secure-coding reference found."

        # Prepare diff content for LLM
        diff_str = ""
        for f in files:
            diff_str += f"File: {f.get('filename')}\nStatus: {f.get('status')}\nDiff:\n{f.get('patch', '')}\n\n"

        # Format bandit findings for LLM
        bandit_findings_str = json.dumps(bandit_findings, indent=2) if bandit_findings else "No issues found by static analysis."

        system_prompt = (
            "You are CodeVerdict Security Agent, a world-class cybersecurity expert and source code auditor.\n"
            "Your objective is to inspect the code changes in this Pull Request and identify security vulnerabilities.\n\n"
            "You have access to two resources:\n"
            "1. Static Security Analysis (Bandit output) on the modified Python files.\n"
            "2. Retrieved Secure Coding Guidelines (RAG context).\n\n"
            "Your tasks:\n"
            "a) Review the code changes (unified diff).\n"
            "b) Incorporate the findings from 'bandit'. Translate them into friendly, plain-language explanations. "
            "Suggest concrete fixes for them. You MUST preserve the bandit issues in your output list.\n"
            "c) Use the Secure Coding Guidelines and your expertise to flag any additional security vulnerabilities or risks "
            "that bandit's static analysis might have missed (e.g. business logic auth bypass, hardcoded keys, weak hashing, "
            "untrusted input deserialization).\n"
            "d) Output the findings strictly as a JSON object with a single 'findings' key pointing to an array of objects. "
            "Each object must have: 'severity' (Critical, Warning, Suggestion), 'category' ('Security'), 'file', 'line_range', "
            "'description', and 'suggestion'. Do not add any text before or after the JSON output.\n\n"
            f"Here are the Secure Coding Guidelines retrieved from the RAG knowledge base:\n{context_str}\n"
        )

        user_prompt = (
            f"Pull Request: {pr_details.get('title')}\n"
            f"Description: {pr_details.get('body')}\n\n"
            f"--- Bandit Static Analysis Findings ---\n{bandit_findings_str}\n\n"
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
            logger.error(f"Error calling Groq API in SecurityAgent: {e}")
            # Fall back directly to raw bandit findings if LLM fails
            findings = []

        # Merge check: Ensure that if Bandit found issues, they are represented in the final findings.
        # If the LLM omitted or failed to include a bandit finding, append it.
        for bf in bandit_findings:
            # Check if this bandit finding file and description is already in the list
            already_included = False
            for f in findings:
                if f.file == bf["file"] and (bf["line_range"] == f.line_range or bf["line_range"] in (f.line_range or "")):
                    already_included = True
                    break
            if not already_included:
                findings.append(Finding(
                    severity=bf["severity"],
                    category=bf["category"],
                    file=bf["file"],
                    line_range=bf["line_range"],
                    description=bf["description"],
                    suggestion=bf["suggestion"]
                ))

        return AgentReviewResult(
            agent_name=self.name,
            findings=findings,
            raw_response=raw_response,
            retrieved_context=retrieved_contexts
        )
