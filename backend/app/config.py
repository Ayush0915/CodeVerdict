import os
from pathlib import Path
from dotenv import load_dotenv

# Determine project root and load env
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env if it exists, else default load_dotenv
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# Settings
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

# LLM Models
DEFAULT_LLM_MODEL = os.environ.get("DEFAULT_LLM_MODEL", "llama-3.3-70b-versatile")
SYNTHESIS_LLM_MODEL = os.environ.get("SYNTHESIS_LLM_MODEL", "llama-3.3-70b-versatile")

# Paths
RAG_DIR = BASE_DIR / "app" / "rag"
KNOWLEDGE_BASE_DIR = RAG_DIR / "knowledge_base"
FAISS_INDEX_PATH = RAG_DIR / "faiss_index"

# Server Settings
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8000"))
