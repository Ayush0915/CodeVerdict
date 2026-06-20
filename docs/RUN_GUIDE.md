# CodeVerdict — Step-by-Step Running Guide

This guide provides clean, step-by-step instructions to get both the **FastAPI Backend** and **React Frontend** running on your local machine, run the **Evaluation Suite**, and test the application offline.

---

## 🛠️ Step 1: Backend Server Setup

The backend is built with FastAPI. A pre-configured Python virtual environment is already present at the root of the project (`venv/`).

### 1. Open a PowerShell/Terminal window at the project root (`D:\project\codeverdict`).

### 2. (Optional) Create your `.env` configuration file:
If you want to use the live Groq API, create a file named `.env` inside the `backend/` directory:
```env
GROQ_API_KEY=your_actual_groq_api_key
```
> [!NOTE]
> If no `.env` file or `GROQ_API_KEY` is present, CodeVerdict automatically falls back to **Deterministic Mock Mode** so you can demo the application fully offline.

### 3. Run the FastAPI development server:
Run the server using the project's virtual environment python executable directly:
```powershell
.\venv\Scripts\python.exe backend/app/main.py
```

You should see output indicating the server is running:
```text
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Initializing CodeVerdict RAG Vector Store...
INFO:     RAG Index loaded successfully.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

The Backend API documentation is now interactive and accessible at:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 💻 Step 2: React Frontend Setup

The frontend is a React application built with Vite.

### 1. Open a *new* PowerShell/Terminal window and navigate to the `frontend/` directory:
```powershell
# Open terminal and run
cd D:\project\codeverdict\frontend
```

### 2. Start the Vite development server:
```powershell
npm run dev
```

You should see output showing the active local server URL:
```text
  VITE v8.0.12  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter for help
```

### 3. Open your browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🚀 Step 3: Demoing the App (Mock vs. Live URLs)

Once both the backend and frontend are running, you can submit Pull Requests for analysis.

### Option A: Testing Offline (No API Keys Required)
You can enter any of the local mock PR datasets into the URL input box on the frontend:
- `mock://backend/eval/dataset/vulnerable_pr.json` (Triggers security & PEP 8 warnings)
- `mock://backend/eval/dataset/performance_issue_pr.json` (Triggers N+1 database queries & exception warnings)
- `mock://backend/eval/dataset/untested_code_pr.json` (Triggers test coverage suggestion warnings)

### Option B: Testing Live GitHub PRs (Requires API Keys)
1. Ensure your backend has `GROQ_API_KEY` set in `backend/.env`.
2. Input any public GitHub Pull Request URL into the input field:
   `https://github.com/owner/repo/pull/number`
3. Click **"Analyze PR"** to run the live multi-agent review!

---

## 📊 Step 4: Running the Evaluation Suite

To calculate system precision and recall against the curated benchmark datasets offline:

### 1. Open a terminal at the project root (`D:\project\codeverdict`).

### 2. Run the evaluation script:
```powershell
$env:PYTHONPATH="backend"; .\venv\Scripts\python.exe backend/eval/run_eval.py
```

This will run all mock files and generate a detailed report markdown file at **[backend/eval/eval_results.md](file:///D:/project/codeverdict/backend/eval/eval_results.md)**.
