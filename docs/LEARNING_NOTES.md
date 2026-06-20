# CodeSentry Study and Learning Guide

This document is designed to help you prepare for technical interviews. It explains the core concepts behind CodeSentry, why they were chosen, and how they are implemented in the project.

---

## 1. Agentic AI vs. Simple LLM Calls
### What is it?
A simple LLM call is a single prompt-response sequence. You send code to the model, and it gives you feedback in one pass.
In contrast, **Agentic AI** systems break tasks down. They distribute work to specialized sub-agents with distinct roles, custom system instructions, specialized tools, and a centralized coordination layer.

### Why was it needed in CodeSentry?
Code review is multi-dimensional. A single LLM prompt trying to analyze security, style guidelines, algorithms, and tests often misses nuances because of **attention dilution** (the model gets distracted by style issues and misses a SQL injection, or vice versa).
By partitioning the workload into four separate, focused agents (Security, Quality, Performance, Coverage), each agent focuses 100% of its reasoning budget on one topic.

### How is it implemented here?
1. **Specialized Agents:** We defined separate system prompts for the four agents.
2. **Distinct Context & Tools:** The Security Agent runs the `bandit` tool and gets secure-coding RAG context. The Quality Agent gets formatting style guidelines. Performance and Coverage run on their own strict rulesets.
3. **Synthesis Step:** The `SynthesizerAgent` takes findings from all agents, removes duplicate observations (e.g., when two agents flag the same line), resolves differences, and writes a unified report.

---

## 2. Asynchronous Orchestration
### What is it?
Asynchronous programming allows a single process to execute multiple tasks concurrently. Instead of waiting for one task to finish before starting the next, the program starts all tasks and processes them as their results become available.

### Why was it needed in CodeSentry?
If we ran the four agents sequentially (one after another), the response time would be the sum of all agent runtimes:
$$\text{Total Time} = T_{\text{Security}} + T_{\text{Quality}} + T_{\text{Performance}} + T_{\text{Coverage}} + T_{\text{Synthesis}} \approx 15\text{s} + 15\text{s} + 15\text{s} + 15\text{s} + 15\text{s} \approx 75\text{s}$$
This makes the web application extremely slow and unresponsive.

### How is it implemented here?
In `orchestrator.py`, we use Python's `asyncio.gather(*tasks)` to run all four specialist agents concurrently. The server handles all 4 requests in parallel:
$$\text{Total Time} = \max(T_{\text{Security}}, T_{\text{Quality}}, T_{\text{Performance}}, T_{\text{Coverage}}) + T_{\text{Synthesis}} \approx 15\text{s} + 15\text{s} \approx 30\text{s}$$
This speeds up the review process by over 60%.

---

## 3. RAG Fundamentals (Retrieval-Augmented Generation)
### What is it?
RAG connects LLMs to external text sources. Instead of relying solely on what the model learned during its pre-training, a RAG system:
1. **Chunks** documents into small paragraphs.
2. Generates mathematical **embeddings** (vectors) representing their meaning.
3. Performs a **similarity search** to find documents relevant to a user query.
4. Injects these documents into the prompt as grounding context.

### Why was it needed in CodeSentry?
Standard LLMs might hallucinate style rules or suggest outdated security conventions. RAG grounds the Quality and Security agents in specific reference files (OWASP security guides and PEP 8 style standards).
This ensures reviews are aligned with the project's exact guidelines, rather than random LLM memories.

### How is it implemented here?
- **Chunking (`embed.py`):** Splits markdown style guides into sections using structural paragraphs.
- **Embedding:** Uses `sentence-transformers` (`all-MiniLM-L6-v2`) to turn text chunks into 384-dimensional vectors.
- **Vector Search (`vector_store.py`):** Utilizes `FAISS` (Facebook AI Similarity Search) to build a fast index of vectors, with a custom `NumPy` cosine similarity fallback.
- **Prompt Injection:** Before calling Groq, we query the vector store using the code diff, retrieve the top 3 matching chunks, and paste them into the LLM system prompt.

---

## 4. Tool Use (Bandit Integration)
### What is it?
Tool use (or tool calling) is the practice of giving an AI agent access to external APIs or command-line utilities.

### Why was it needed in CodeSentry?
LLMs are excellent at reasoning, but poor at scanning large codebases with perfect precision. They can miss syntax details or flag false positives. Static analysis tools like **Bandit** scan python abstract syntax trees (AST) to identify vulnerabilities (like hardcoded keys or unsafe modules) with 100% precision.
By combining Bandit with an LLM, the Security Agent gets the best of both worlds: Bandit's absolute precision and the LLM's natural explanation skills.

### How is it implemented here?
1. In `tools/bandit_runner.py`, we save the PR's Python files to a temp folder and execute a subprocess: `bandit -r <temp_dir> -f json -q`.
2. The output is parsed as a JSON list.
3. The Security Agent reads this JSON list, translates technical flags into plain explanation, and identifies higher-level security issues (e.g. logic flaws) that static tools cannot catch.

---

## 5. Evaluation Design (Precision and Recall)
### What is it?
Evaluating AI is hard because LLM outputs are free-form. We use statistical measurements:
- **Precision:** What percentage of flagged issues are actually real/correct?
  $$\text{Precision} = \frac{\text{True Positives}}{\text{True Positives} + \text{False Positives}}$$
- **Recall:** What percentage of all actual bugs in the code did the tool catch?
  $$\text{Recall} = \frac{\text{True Positives}}{\text{True Positives} + \text{False Negatives}}$$

### Why was it needed in CodeSentry?
To prove the tool actually works! A portfolio project is only as strong as its evaluation. Without a precision/recall suite, it's just a demo.

### How is it implemented here?
- **Curated Dataset:** We created a dataset of mock PRs with known expected bugs.
- **Evaluation script (`run_eval.py`):** Automates running CodeSentry on the dataset, searches for expected bug categories in the output using regex, compiles the precision/recall metrics, and writes them to `eval_results.md`.
- **Documented Failure Mode:** If the Quality Agent spots variables named in uppercase inside SQL string queries, it incorrectly flags them as PEP 8 naming violations. This is documented as a known False Positive (FP) and is a great discussion point for interviews.

---

## 6. Docker & Containerization
### What is it?
Docker packages code, runtime environment, libraries, and system configurations into a isolated lightweight container. This ensures that the application runs identically on any machine.

### Why was it needed in CodeSentry?
Setting up FastAPI, python packages (like `faiss-cpu`, which requires binary compile dependencies), and Node.js for Vite React can lead to dependency conflicts between different operating systems.
Docker Compose wraps the backend service and the frontend service together, setting up networking and env variables automatically.

---

## 7. CI/CD with GitHub Actions
### What is it?
Continuous Integration (CI) is the practice of automatically running linting, formatting, and tests on every code commit.

### Why was it needed in CodeSentry?
It guarantees that code additions do not break existing features or degrade the AI's review precision. If a code change reduces review quality (lowering Precision/Recall below 80%), the build fails, alerting the developers before it gets merged.
