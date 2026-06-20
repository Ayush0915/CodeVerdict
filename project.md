# CodeSentry — Full Build Specification

**Project:** CodeSentry (Multi-Agent Code Review System)
**Builder:** Antigravity agentic IDE
**Execution mode:** All phases, single autonomous pass
**Owner:** Ayush Kumar Bhadani (final-year B.Tech CSE - Data Science)

---

## 0. READ THIS FIRST — Instructions to the Copilot

You are building **CodeSentry**, a multi-agent AI code review tool, for a student who needs to:
1. Have a fully working, demoable application at the end of this build.
2. **Be able to explain every architectural decision in a technical interview.** This means you must produce real learning documentation as you build — not just code comments, but standalone markdown docs that explain *why* each component exists and *how* it works, written so a human who did not write the code can study them afterward.
3. Have a genuine evaluation (precision/recall) showing the tool actually works — not a demo that only works on cherry-picked examples.

**Non-negotiable rules for this build:**
- Do NOT skip the eval suite. It is the single most important deliverable for the project's resume value. A working multi-agent pipeline with no eval is treated as an incomplete build.
- Do NOT use a heavy agent framework (LangChain/LangGraph/AutoGPT) for the core orchestration. Hand-roll the orchestrator (simple async router). This is intentional — it must be fully explainable by the owner in an interview, and "I used LangGraph" invites follow-up questions about what LangGraph does internally that a hand-rolled implementation avoids.
- DO use a real static-analysis tool (`bandit`) as an actual subprocess/library call from the Security Agent — this is a deliberate "tool use" demonstration, not LLM-only reasoning. Do not fake or simulate this step.
- DO implement real RAG with FAISS — not a stub, not a TODO. If embeddings or retrieval can't be made to work for any reason, stop and surface the blocker rather than silently mocking it.
- Every phase must produce a corresponding section in `/docs/LEARNING_NOTES.md` (see Section 6). This is not optional documentation — treat it as a deliverable equal in priority to the code itself.
- Use Groq API (Llama 3 family) as the LLM provider for all agents. Read the key from an environment variable (`GROQ_API_KEY`); never hardcode it. Create a `.env.example` file showing the expected variable name with a placeholder value.
- Keep all secrets out of git. Add a proper `.gitignore`.
- Prefer clarity over cleverness in code. This codebase will be read and explained by a student in interviews — favor readable, well-commented code over dense one-liners.

If anything in this spec is ambiguous or you must make an assumption, **write that assumption explicitly into `/docs/DECISIONS.md`** (create this file) with a one-line rationale, rather than silently choosing.

---

## 1. Project Overview

**Problem statement:** Code review is inconsistent and slow. A single reviewer (human or AI) tends to focus on whichever concern they're best at (style, security, performance) and miss the others. CodeSentry runs a GitHub Pull Request through four specialized AI agents — each focused on one concern — then merges their findings into a single, prioritized, de-duplicated review.

**What makes this "agentic" rather than "a script that calls an LLM":**
- Multiple agents with distinct roles and distinct context/tools, not one generic prompt.
- At least one agent uses a real external tool (`bandit`) rather than relying purely on LLM judgment.
- At least two agents use retrieval (RAG over a knowledge base of secure-coding guidelines / style conventions) to ground their judgment in real reference material instead of pure LLM memory.
- An orchestration layer that decides execution order/parallelism and a separate synthesis step that resolves conflicts and ranks findings — this is not a single forward pass.

---

## 2. Architecture

```
┌─────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
│   React     │─────▶│   FastAPI Backend     │─────▶│   GitHub REST API    │
│  Frontend   │◀─────│   (Orchestrator)      │◀─────│  (fetch PR diff)     │
└─────────────┘      └──────────┬───────────┘      └─────────────────────┘
                                 │
              ┌──────────────────┼───────────────────┬────────────────┐
              ▼                  ▼                   ▼                ▼
        ┌──────────┐      ┌──────────┐        ┌──────────┐    ┌──────────────┐
        │ Security │      │ Quality  │        │Performance│    │ Test Coverage│
        │  Agent   │      │  Agent   │        │  Agent    │    │   Agent      │
        │ + bandit │      │ + RAG    │        │           │    │              │
        │  (tool)  │      │ lookup   │        │           │    │              │
        └────┬─────┘      └────┬─────┘        └────┬─────┘    └──────┬───────┘
             │                 │                    │                 │
             │           ┌─────▼──────┐             │                 │
             │           │ FAISS Vector│             │                 │
             │           │ Store       │             │                 │
             │           │ (style docs│             │                 │
             │           │ + secure-  │             │                 │
             │           │ coding refs)│             │                 │
             │           └────────────┘             │                 │
             └─────────────────┴────────────────────┴─────────────────┘
                                       ▼
                            ┌───────────────────┐
                            │ Synthesizer Agent  │
                            │ (rank, dedupe,     │
                            │ resolve conflicts) │
                            └───────────────────┘
                                       ▼
                              Final structured review
                                       │
                          ┌────────────┴────────────┐
                          ▼                          ▼
                 ┌──────────────┐           ┌────────────────┐
                 │  Eval Suite   │           │  Docker +       │
                 │ (precision/   │           │  GitHub Actions │
                 │  recall vs.   │           │  CI/CD          │
                 │  known bugs)  │           └────────────────┘
                 └──────────────┘
```

**Tech stack:**
- Backend: Python 3.11+, FastAPI, asyncio
- LLM: Groq API (Llama 3 family)
- Orchestration: hand-rolled async router (no LangChain/LangGraph)
- Tool use: `bandit` (Python static security analysis), invoked as a subprocess or library call
- RAG: `sentence-transformers` for embeddings + `faiss-cpu` for vector storage/retrieval
- Frontend: React + Tailwind CSS
- Integration: GitHub REST API (via `PyGithub` or `httpx`/`requests`)
- DevOps: Docker, docker-compose, GitHub Actions
- Eval: custom precision/recall script against a curated dataset of PRs with known issues
- Storage (optional, use SQLite if a persistence layer is needed for review history): SQLite via `sqlmodel` or raw `sqlite3`

---

## 3. Project Structure

Create exactly this structure:

```
codesentry/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entrypoint
│   │   ├── config.py                # env var loading, settings
│   │   ├── github_client.py         # GitHub API: fetch PR diff/files
│   │   ├── orchestrator.py          # async router: runs agents, calls synthesizer
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── base_agent.py        # shared agent interface/base class
│   │   │   ├── security_agent.py    # LLM + bandit tool call
│   │   │   ├── quality_agent.py     # LLM + RAG retrieval
│   │   │   ├── performance_agent.py # LLM-based
│   │   │   ├── test_coverage_agent.py # LLM-based
│   │   │   └── synthesizer_agent.py # merges/ranks/dedupes all findings
│   │   ├── rag/
│   │   │   ├── __init__.py
│   │   │   ├── embed.py             # sentence-transformers embedding logic
│   │   │   ├── vector_store.py      # FAISS index build/query
│   │   │   └── knowledge_base/      # source docs to embed (style guides, secure coding refs)
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   └── bandit_runner.py     # wraps bandit CLI/library call
│   │   ├── llm/
│   │   │   ├── __init__.py
│   │   │   └── groq_client.py       # Groq API wrapper
│   │   └── models/
│   │       ├── __init__.py
│   │       └── schemas.py           # Pydantic request/response models
│   ├── eval/
│   │   ├── dataset/                 # curated PRs with known issues (or links/scripts to fetch them)
│   │   ├── run_eval.py              # computes precision/recall/false-positive rate
│   │   └── eval_results.md          # auto-generated or manually-updated results log
│   ├── tests/
│   │   └── test_agents.py           # basic unit tests per agent
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── PRInputForm.jsx
│   │   │   ├── AgentFindingsCard.jsx
│   │   │   ├── FinalReviewPanel.jsx
│   │   │   └── LoadingState.jsx
│   │   └── api/
│   │       └── client.js            # calls backend API
│   ├── package.json
│   └── Dockerfile
├── docs/
│   ├── LEARNING_NOTES.md            # REQUIRED — see Section 6
│   ├── DECISIONS.md                 # REQUIRED — assumptions/decisions log
│   ├── ARCHITECTURE.md              # expanded version of Section 2 diagram + explanation
│   └── EVAL_METHODOLOGY.md          # how the eval set was built, metric definitions
├── .github/
│   └── workflows/
│       └── ci.yml                   # lint + run eval suite on push/PR
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 4. Phased Build Plan

Build in this order. Even though this is a single autonomous pass, internally sequence the work this way — later phases depend on earlier ones being functionally correct, not just present.

### Phase 1 — Core Pipeline (thin end-to-end slice)
1. Scaffold `backend/` per structure above.
2. Implement `config.py` to load `GROQ_API_KEY` and `GITHUB_TOKEN` from environment.
3. Implement `github_client.py`: given a PR URL, fetch the diff/changed files via GitHub REST API.
4. Implement `groq_client.py`: thin wrapper around Groq's chat completion endpoint.
5. Implement ONE agent first — `quality_agent.py` (without RAG yet, just LLM call on the diff) — to validate the end-to-end path before adding complexity.
6. Wire a single FastAPI endpoint `POST /review` that: accepts a PR URL → fetches diff → runs quality agent → returns raw JSON.
7. Manually verify this works against at least one real public PR URL.

### Phase 2 — Full Multi-Agent Orchestration
8. Implement `security_agent.py`: LLM call + real `bandit` invocation via `tools/bandit_runner.py`. The agent's final output must incorporate bandit's actual findings, not just LLM opinion.
9. Implement `performance_agent.py` and `test_coverage_agent.py` (LLM-based, similar pattern to quality agent).
10. Implement `orchestrator.py`: runs all four agents concurrently via `asyncio.gather`, collects their structured outputs.
11. Implement `synthesizer_agent.py`: takes all four agents' findings, deduplicates overlapping issues, assigns severity (Critical/Warning/Suggestion), and produces one final ranked review.
12. Update the `/review` endpoint to run the full pipeline (orchestrator → synthesizer) and return the structured final result plus per-agent breakdowns.

### Phase 3 — RAG Integration
13. Populate `rag/knowledge_base/` with a small curated set of reference documents: e.g., OWASP-style secure coding guidelines (text/markdown summaries, not copyrighted reproductions of full external texts), and a generic code style/best-practices reference.
14. Implement `embed.py`: use `sentence-transformers` (e.g., `all-MiniLM-L6-v2`) to embed the knowledge base documents.
15. Implement `vector_store.py`: build a FAISS index from the embeddings; implement a `query(text, k)` function returning top-k relevant chunks.
16. Integrate retrieval into `quality_agent.py` and `security_agent.py`: before calling the LLM, retrieve the top-k relevant knowledge base chunks for the current code diff and inject them into the prompt as grounding context.
17. Document in `docs/LEARNING_NOTES.md` exactly what role RAG plays here and why it was chosen over relying on LLM-only knowledge (see Section 6 requirements).

### Phase 4 — Frontend
18. Scaffold React app in `frontend/`.
19. Build `PRInputForm.jsx`: input field for PR URL + submit button, calls backend `/review`.
20. Build `LoadingState.jsx`: shown while the request is in flight (agents take a few seconds).
21. Build `AgentFindingsCard.jsx`: displays each agent's individual findings in a tabbed or card layout.
22. Build `FinalReviewPanel.jsx`: displays the synthesizer's merged, ranked output with severity badges.
23. Wire `api/client.js` to call the FastAPI backend (handle CORS on the backend side in `main.py`).

### Phase 5 — Evaluation Suite
24. Curate `eval/dataset/`: 10–15 real or seeded PRs with **documented, known issues** (a mix of security, quality, performance, missing-test problems). Document the source and rationale for each in `docs/EVAL_METHODOLOGY.md`.
25. Implement `run_eval.py`: runs CodeSentry against each PR in the dataset, compares flagged issues against the known/expected issues, computes:
    - Precision (% of flagged issues that are real/expected)
    - Recall (% of known issues that were caught)
    - At least one documented failure mode (a case where CodeSentry missed something or produced a false positive) — record this explicitly, do not hide it.
26. Write results to `eval/eval_results.md` in a clear table format.

### Phase 6 — Dockerization
27. Write `backend/Dockerfile` (Python base image, install requirements, run uvicorn).
28. Write `frontend/Dockerfile` (Node build stage + static serve, or dev-server container — pick whichever is simpler to justify in an interview and document the choice in `DECISIONS.md`).
29. Write root `docker-compose.yml` wiring both services together with correct networking/env passthrough.
30. Verify `docker-compose up` brings up a working full-stack app end to end.

### Phase 7 — CI/CD
31. Write `.github/workflows/ci.yml`: on push/PR, install dependencies, run linting (e.g., `ruff` or `flake8`), and run `eval/run_eval.py` (or a fast subset of it) automatically.
32. Ensure the workflow fails the build if eval precision/recall drops below a defined threshold (pick a reasonable threshold and document the rationale in `DECISIONS.md`).

### Phase 8 — Documentation Pass
33. Finalize `docs/ARCHITECTURE.md`, `docs/LEARNING_NOTES.md`, `docs/EVAL_METHODOLOGY.md`, `docs/DECISIONS.md` (see Section 6 for exact required content).
34. Write the root `README.md`: project overview, setup instructions (local + Docker), how to run the eval suite, and a short usage walkthrough with a screenshot or sample output.

---

## 5. Agent Design Notes

For each agent, implement a consistent interface (`base_agent.py`) so the orchestrator can treat them uniformly:
- Input: code diff (and, for RAG-enabled agents, retrieved context chunks)
- Output: a structured list of findings, each with: `severity`, `category`, `file`, `line_range` (if available), `description`, `suggestion`

**Security Agent:** Runs `bandit` on the changed Python files first. Passes bandit's raw findings AND the diff to the LLM, asking it to (a) explain bandit's findings in plain language, (b) flag any additional risks bandit's static analysis wouldn't catch (e.g., logic-level auth bypass), grounded with RAG-retrieved secure-coding reference snippets.

**Quality Agent:** Uses RAG to retrieve relevant style/best-practice snippets, then asks the LLM to evaluate naming, complexity, duplication, and SOLID-principle violations in the diff, citing which retrieved guideline (if any) informed each finding.

**Performance Agent:** LLM-only (no RAG needed) — asks the LLM to flag obvious algorithmic inefficiencies, N+1 patterns, unnecessary repeated computation.

**Test Coverage Agent:** LLM-only — given the diff, flags logic that appears untested and suggests concrete test cases.

**Synthesizer Agent:** Takes all four structured outputs, merges/deduplicates overlapping findings (e.g., if both Quality and Security flag the same line for different reasons, keep both but group them), assigns a final priority order, and produces the response shape the frontend renders.

---

## 6. Required Learning Documentation (`docs/LEARNING_NOTES.md`)

This file is for the project owner to study from afterward — it must read like clear teaching material, not code comments. Structure it with one section per concept below. Each section should explain: **what the concept is, why it was needed in this specific project (not generically), and how it was implemented here**, in plain language a final-year CS student can re-explain in an interview without re-reading the code.

Required sections:
1. **Agentic AI vs. simple LLM calls** — what makes this project "agentic," using CodeSentry's own orchestrator/synthesizer as the example.
2. **Async orchestration** — why `asyncio.gather` was used, what would break/slow down without it.
3. **RAG fundamentals** — embeddings, chunking, similarity search; why FAISS was chosen; why RAG specifically helps the Quality and Security agents rather than being a generic add-on.
4. **Tool use (bandit integration)** — why an LLM alone is insufficient for security analysis, what bandit actually checks for, how its output is merged with LLM reasoning.
5. **Eval design** — the precision/recall metric definitions used, why this specific dataset size/composition was chosen, and the at least one documented failure mode (this directly mirrors the "strong eval answer" structure interviewers look for: a metric, a test set with rationale, a caught failure mode).
6. **Docker & containerization** — what problem containerizing this specific app solves (dependency consistency, deployment), explained at a beginner level.
7. **CI/CD with GitHub Actions** — what the pipeline does on each push and why eval results gate the build.

This file should be written incrementally as each phase completes, not all at the end as a rushed summary.

---

## 7. Definition of Done

The build is complete only when ALL of the following are true:
- [ ] `docker-compose up` starts the full stack and a PR URL can be submitted via the React UI and produces a final, merged review.
- [ ] All four specialist agents run and their individual findings are visible in the UI, not just the merged result.
- [ ] The Security Agent's output demonstrably incorporates real `bandit` output (verifiable by checking that a known-vulnerable test file produces bandit-sourced findings).
- [ ] The Quality and Security agents demonstrably use RAG retrieval (verifiable by inspecting logs/output showing retrieved context chunks feeding into the prompt).
- [ ] `eval/run_eval.py` runs successfully and `eval/eval_results.md` contains real precision/recall numbers and at least one documented failure case.
- [ ] GitHub Actions CI workflow passes on the final commit.
- [ ] All four `docs/*.md` files are complete and written in plain, interview-ready language — not placeholders.
- [ ] No secrets are committed; `.env.example` exists with placeholder values only.

---

## 8. Explicitly Out of Scope (do not build)

- Kubernetes/cloud deployment — Docker Compose only for now.
- LangChain/LangGraph or any heavy agent framework.
- Multi-language support beyond Python codebases for the static-analysis tool step (LLM-based agents can still comment on any language, but `bandit` is Python-specific — note this limitation explicitly in `docs/ARCHITECTURE.md` rather than trying to add multi-language static analysis).
- User authentication/multi-user accounts — this is a portfolio demo, not a production SaaS product.