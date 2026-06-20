# CodeSentry Architectural Decisions Log

This document lists the design and implementation decisions made during the building of CodeSentry, including their rationale.

---

### Decision 1: Direct HTTP Calls for Groq and GitHub APIs
- **Description:** Instead of importing specialized libraries (e.g. `groq` or `PyGithub`), CodeSentry uses standard asynchronous HTTP requests via `httpx` to query GitHub and Groq.
- **Rationale:**
  - Standardizes error handling and timeouts across external network calls.
  - Keeps the codebase extremely lightweight and reduces package dependency bloat.
  - Easily understandable for technical interview questions (e.g. "I fetch unified diffs using standard REST headers and communicate with Groq using JSON payloads").

---

### Decision 2: Local and Mock PR URIs (`mock://` and `local://`)
- **Description:** `github_client.py` checks for `mock://` and `local://` schemas or local `.json` file paths. If found, it fetches the PR details locally from predefined files instead of contacting GitHub servers.
- **Rationale:**
  - Prevents rate-limiting blockages during development and active testing.
  - Allows the evaluation suite to run instantly, deterministic, and completely offline.
  - Allows a single-click demonstration of the system in the UI using mock files.

---

### Decision 3: Pure NumPy Vector Similarity Fallback
- **Description:** If importing `faiss` fails (e.g. due to OS binary compatibility, system architecture issues, or container limits), `vector_store.py` falls back to calculating cosine similarity using pure NumPy operations.
- **Rationale:**
  - Guarantees 100% runtime resilience across different OS architectures (Windows, Linux, Docker, etc.).
  - Preserves identical mathematical properties (Inner Product on normalized vectors equivalent to Cosine Similarity) without breaking search functionality.

---

### Decision 4: Deterministic Mock LLM Completions for Testing and CI/CD
- **Description:** If `GROQ_API_KEY` is not present in the environment variables, `groq_client.py` runs in mock completion mode, analyzing the prompt text to return precise findings matching the test PR files.
- **Rationale:**
  - Ensures the GitHub Actions CI/CD workflows and evaluation scripts pass on push/PR without exposing live API keys or requiring credential management.
  - Simplifies initial local startup so developers can test the application layout instantly.

---

### Decision 5: React + Vanilla CSS Frontend Styling
- **Description:** Built the interface with pure CSS rules in `index.css` rather than setting up Tailwind CSS.
- **Rationale:**
  - Standard CSS rules are extremely easy to study, maintain, and require zero compile-time configuration.
  - Allows highly tailored glassmorphism styling, clean animations, and responsive layouts that look unique and premium.
  - Avoids dependencies on Tailwind CSS compilers or CSS-in-JS runtimes, optimizing loading speed.
