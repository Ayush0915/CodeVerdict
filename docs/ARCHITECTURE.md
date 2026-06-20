# CodeVerdict Architectural Design

This document details the system architecture of CodeVerdict, explaining the workflow from pull request input to the final synthesized review.

---

## 1. Flow Diagram

```
[PR URL Input]
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Backend                      │
├─────────────────────────────────────────────────────────┤
│ 1. github_client.py parses URL and downloads PR files   │
└─────────────────────┬───────────────────────────────────┘
                      │
            ┌─────────┴─────────┐ (Triggered concurrently via asyncio.gather)
            ▼                   ▼
 ┌─────────────────────┐ ┌─────────────────────┐
 │   Security Agent    │ │    Quality Agent    │  (Plus Performance & Coverage Agents)
 ├─────────────────────┤ ├─────────────────────┤
 │ - Runs bandit tool  │ │ - Semantic lookup   │
 │ - Semantic lookup   │ │   on PEP8 styling  │
 │   on OWASP rules    │ │   guidelines        │
 └──────────┬──────────┘ └──────────┬──────────┘
            │                       │
            └─────────┬─────────────┘
                      │ (All agent outputs collected)
                      ▼
 ┌─────────────────────────────────────────────────────┐
 │                  Synthesizer Agent                  │
 ├─────────────────────────────────────────────────────┤
 │ - Merges duplicate findings                         │
 │ - Prioritizes issues (Critical > Warning > Suggest) │
 └────────────────────┬────────────────────────────────┘
                      │
                      ▼
            [JSON Structured Output]
                      │
                      ▼
 ┌─────────────────────────────────────────────────────┐
 │                   React Frontend                    │
 ├─────────────────────────────────────────────────────┤
 │ - Executive Summary Display                         │
 │ - Categorized Filter Buttons                        │
 │ - Specialist breakdowns inside tabs                 │
 └─────────────────────────────────────────────────────┘
```

---

## 2. Component Descriptions

### 2.1 GitHub Client (`github_client.py`)
Parses URLs like `https://github.com/owner/repo/pull/number`.
Uses direct `httpx` asynchronous calls to query:
- Pull Request details (title, description).
- Modified file diffs and their original contents.
It also supports `mock://` and `local://` schemas, pointing to JSON files in the workspace. This enables full-suite evaluations to run offline without hitting rate limits.

### 2.2 LLM Client (`groq_client.py`)
Coordinates chat completions using Groq's API.
- Implements **JSON Mode** (`response_format={"type": "json_object"}`) to ensure agent responses are returned as structured data that Pydantic can validate.
- Implements a fallback mock mode when `GROQ_API_KEY` is not present, allowing offline development and testing.

### 2.3 RAG System (`embed.py` and `vector_store.py`)
- **Embedding Generation:** Uses `sentence-transformers` (`all-MiniLM-L6-v2`) to turn document sections into 384-dimensional vectors.
- **Index Management:** Uses `FAISS` to perform similarity lookups. If `FAISS` fails to load, it falls back to a NumPy vector database computing dot product similarity.
- **Knowledge Base:** Located in `rag/knowledge_base/` containing curated markdown files covering Python Secure Coding Standards and PEP 8 guidelines.

### 2.4 Specialist Agents (`agents/`)
Each agent inherits from `BaseAgent` and implements the `review` method:
- **Security Agent:** Executes Bandit against Python files, combines issues with the RAG search results, and queries Groq to explain issues and identify logic vulnerabilities.
- **Quality Agent:** Performs RAG checks against PEP 8 rules, evaluating complexity, DRY violations, and exception structures.
- **Performance Agent:** Inspects algorithm complexity, loops, and database querying behaviors (e.g. N+1 queries).
- **Test Coverage Agent:** Scans code changes to alert on missing test coverage and recommends unit test designs.

### 2.5 Synthesizer Agent (`synthesizer_agent.py`)
Takes outputs from the four agents and merges duplicate findings (e.g. if Security and Quality both flag a file path). It generates a high-level summary and returns findings sorted by severity. If the LLM call fails, it falls back to a Python sorting and deduplication mechanism.
