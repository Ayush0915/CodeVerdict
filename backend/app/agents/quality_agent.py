import logging
from typing import Dict, Any
from app.agents.base_agent import BaseAgent
from app.models.schemas import AgentReviewResult
from app.rag.vector_store import vector_store

logger = logging.getLogger(__name__)

class QualityAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Quality Agent", category="Quality")

    async def review(self, pr_details: Dict[str, Any]) -> AgentReviewResult:
        logger.info("Quality Agent review started.")
        files = pr_details.get("files", [])
        
        # 1. Retrieve style and quality guidelines from Vector Store
        search_query = f"style guide pep8 code quality naming complexity DRY {pr_details.get('title', '')} {pr_details.get('body', '')}"
        
        retrieved_contexts = []
        retrieved_texts = []
        try:
            rag_results = vector_store.query(search_query, k=3)
            for res in rag_results:
                retrieved_contexts.append(res["text"])
                retrieved_texts.append(f"Source: {res['metadata']['file']}\n{res['text']}")
        except Exception as e:
            logger.error(f"Error querying RAG knowledge base in QualityAgent: {e}")

        context_str = "\n\n---\n\n".join(retrieved_texts) if retrieved_texts else "No specific style reference found."

        # Prepare diff content for LLM
        diff_str = ""
        for f in files:
            diff_str += f"File: {f.get('filename')}\nStatus: {f.get('status')}\nDiff:\n{f.get('patch', '')}\n\n"

        system_prompt = (
            "You are CodeVerdict Quality Agent, an expert software engineer and code quality reviewer.\n"
            "Your objective is to inspect the code changes in this Pull Request and identify quality issues, "
            "style violations, architectural concerns, and coding standard deviations.\n\n"
            "Evaluate the changes for:\n"
            "- Naming conventions (PEP 8 for Python: snake_case for functions/variables, PascalCase for classes).\n"
            "- Code duplication and DRY (Don't Repeat Yourself) violations.\n"
            "- Cognitive and cyclomatic complexity (e.g., deep nesting, functions that are too long).\n"
            "- Robust exception handling (avoiding bare except blocks, logging, proper raise).\n"
            "- Adherence to SOLID principles.\n\n"
            "You have access to style guide references retrieved from a knowledge base. Refer to these guidelines "
            "where applicable and cite them if they justify your finding.\n\n"
            f"Here are the Code Style guidelines retrieved from the RAG knowledge base:\n{context_str}\n\n"
            "Output your findings strictly as a JSON object with a single 'findings' key pointing to an array of objects. "
            "Each object must have: 'severity' (Critical, Warning, Suggestion), 'category' ('Quality'), 'file', 'line_range', "
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
            logger.error(f"Error calling Groq API in QualityAgent: {e}")

        return AgentReviewResult(
            agent_name=self.name,
            findings=findings,
            raw_response=raw_response,
            retrieved_context=retrieved_contexts
        )
