import os
import sys
import logging
from pathlib import Path

# Ensure the backend directory is in the Python search path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import PRReviewRequest, SynthesisResult
from app.orchestrator import orchestrator
from app.rag.vector_store import vector_store
from app.github_client import GitHubClientError

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("codeverdict")

app = FastAPI(
    title="CodeVerdict API",
    description="Multi-Agent Code Review System backend API",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing CodeVerdict RAG Vector Store...")
    try:
        # Load index, or build it from knowledge base documents if it does not exist
        if not vector_store.load_index():
            logger.info("RAG Index not found. Triggering build from knowledge base documents...")
            # We run vector store build
            vector_store.build_index_from_kb()
        else:
            logger.info("RAG Index loaded successfully.")
    except Exception as e:
        logger.error(f"Error during RAG initialization on startup: {e}. System will run with on-demand fallback.")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "codeverdict-backend"}

@app.post("/review", response_model=SynthesisResult)
async def review_pull_request(request: PRReviewRequest):
    logger.info(f"Received review request for: {request.pr_url}")
    try:
        result = await orchestrator.review_pr(request.pr_url)
        return result
    except GitHubClientError as e:
        logger.warning(f"Invalid PR URL submitted: {request.pr_url} - {e}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to process review for {request.pr_url}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while analyzing the PR: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    from app import config
    uvicorn.run("app.main:app", host=config.HOST, port=config.PORT, reload=True)
