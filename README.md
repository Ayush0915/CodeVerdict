# CodeSentry — Multi-Agent AI Code Review System

CodeSentry is a secure-by-default, multi-agent AI code review system designed to evaluate Pull Requests (PRs). Rather than routing code analysis through a single general prompt (which suffers from attention dilution), CodeSentry runs PR diffs through four specialized agents operating in parallel, then compiles and structures their findings into a single, ranked report using a technical synthesizer.

---

## 🚀 Key Features

- **Multi-Agent Orchestration:** Dispatches separate concurrent reviews to four specialized agents: **Security**, **Quality**, **Performance**, and **Test Coverage**.
- **Static Analysis Hybridization:** The Security Agent runs the standard **Bandit** tool locally alongside LLM reasoning, matching static rules with semantic logic analysis.
- **RAG-Grounded Reviews:** The Security and Quality agents run retrieval-augmented generation queries over **FAISS** indexes of secure-coding (OWASP) guidelines and code styling (PEP 8) standards.
- **Deduplicated Synthesis:** A synthesizer compiles, prioritizes (Critical > Warning > Suggestion), and deduplicates overlapping findings.
- **Precision/Recall Evaluation:** An offline evaluation framework containing test cases to measure, gate, and report system precision and recall metrics.
- **Offline / Mock Mode:** Supports `mock://` and `local://` schemas to test features locally without incurring API key limits or requiring live github connections.

---

## 🛠️ Tech Stack

- **Backend:** Python 3.11, FastAPI, Uvicorn, Asyncio, Pydantic, HTTPX.
- **LLM Engine:** Groq API (Llama 3 family).
- **Static Analysis:** Bandit.
- **Semantic Vector Storage:** Sentence-Transformers (`all-MiniLM-L6-v2`), FAISS-CPU (with pure NumPy similarity fallback).
- **Frontend:** React, Vite, Vanilla CSS (Premium Slate-Glassmorphism theme).
- **DevOps/CI:** Docker, Docker Compose, GitHub Actions.

---

## 📂 Project Structure

```
codesentry/
├── backend/
│   ├── app/
│   │   ├── agents/          # Specialist agents (Security, Quality, Performance, Coverage, Synthesizer)
│   │   ├── llm/             # Groq client with offline testing mock completions
│   │   ├── models/          # Pydantic schemas and serialization definitions
│   │   ├── rag/             # Sentence embeddings logic and FAISS search indexes
│   │   ├── tools/           # Subprocess wrapper for Bandit static analysis
│   │   ├── github_client.py # Parses github PR URLs and downloads diff/contents
│   │   ├── orchestrator.py  # Concurrently queries all agent classes via asyncio
│   │   └── main.py          # FastAPI application route entrypoint
│   ├── eval/                # Precision/Recall dataset and evaluation runner
│   └── tests/               # Unit testing suite
├── frontend/
│   ├── src/                 # React UI components (Form, Cards, Panels, State)
│   └── index.html
├── docs/                    # Technical interview study notes and decisions logs
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start (Pre-Configured Environment)

If you are using this pre-packaged workspace, all dependencies and virtual environments are already set up. Simply refer to the step-by-step guide:
👉 **[Step-by-Step Running Guide](file:///D:/project/codesentry/docs/RUN_GUIDE.md)**

---

## ⚙️ Setup and Installation

### Option 1: Docker Compose (Recommended)

1. Clone this repository to your system.
2. Create a `.env` file inside the `backend/` directory from `.env.example`:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Populate `GROQ_API_KEY` inside `backend/.env` with your Groq API key:
   ```env
   GROQ_API_KEY=gsk_your_actual_key_here
   ```
4. Build and start the services from the project root:
   ```bash
   docker-compose up --build
   ```
5. Access the React frontend at **[http://localhost:3000](http://localhost:3000)** and the API endpoints at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

### Option 2: Local Manual Startup

#### 1. Start the Backend Server
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create your `.env` file containing `GROQ_API_KEY` (and optionally `GITHUB_TOKEN`).
5. Run the FastAPI development server:
   ```bash
   python app/main.py
   ```

#### 2. Start the Frontend Dev Server
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start Vite client:
   ```bash
   npm run dev
   ```
4. Open the displayed URL in your browser (typically **[http://localhost:5173](http://localhost:5173)**).

---

## 📊 Running the Evaluation Suite

To calculate Precision and Recall metrics against the local evaluation dataset:

1. Enter the `backend/` directory and ensure your virtual environment is active.
2. Execute the evaluation script:
   ```bash
   python eval/run_eval.py
   ```
3. The script outputs detailed findings and creates a markdown results sheet at **[eval/eval_results.md](file:///D:/project/codesentry/backend/eval/eval_results.md)**.
4. Note: If `GROQ_API_KEY` is not present, the evaluation suite automatically activates the deterministic mock completions engine, running completely offline to gate CI/CD testing.

---

## 🛡️ Running Unit Tests

Execute the unit tests using standard unittest discovery:
```bash
python -m unittest discover -s backend/tests -p "test_*.py"
```

---

## 📚 Study and Learning Documents

If you are preparing for technical reviews or system architecture interviews, review the generated files inside `docs/`:
- **[LEARNING_NOTES.md](file:///D:/project/codesentry/docs/LEARNING_NOTES.md):** Detailed explanations covering Agentic AI, Asynchronous Orchestration, RAG concepts, Tool Use, Evaluation Metrics, and DevOps structures.
- **[DECISIONS.md](file:///D:/project/codesentry/docs/DECISIONS.md):** Log of architectural decisions and engineering trade-offs.
- **[ARCHITECTURE.md](file:///D:/project/codesentry/docs/ARCHITECTURE.md):** Deep-dive into technical workflows and component interactions.
- **[EVAL_METHODOLOGY.md](file:///D:/project/codesentry/docs/EVAL_METHODOLOGY.md):** Details on expected bugs and statistical calculation formulas.
