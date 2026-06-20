import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
from app import config
from app.rag.embed import Embedder, chunk_document

logger = logging.getLogger(__name__)

# Try importing FAISS, define fallback indicator
HAS_FAISS = False
try:
    import faiss
    HAS_FAISS = True
    logger.info("FAISS successfully imported.")
except ImportError:
    logger.warning("FAISS could not be imported. Using pure NumPy fallback for vector similarity search.")

class VectorStore:
    def __init__(self, index_dir: Path = config.FAISS_INDEX_PATH):
        self.index_dir = Path(index_dir)
        self.embedder = Embedder()
        self.dimension = self.embedder.dimension
        
        # In-memory storage for numpy fallback and metadata tracking
        self.faiss_index = None
        self.embeddings = []  # List of numpy arrays, shape (dimension,)
        self.metadata = []    # List of metadata dicts
        self.chunks_text = [] # List of raw texts

    def build_index_from_kb(self, kb_dir: Path = config.KNOWLEDGE_BASE_DIR):
        """
        Reads knowledge base documents, chunks them, embeds them, and saves the vector store.
        """
        kb_path = Path(kb_dir)
        if not kb_path.exists():
            logger.warning(f"Knowledge base directory {kb_path} does not exist. Creating it.")
            kb_path.mkdir(parents=True, exist_ok=True)
            return

        all_chunks = []
        for file_path in kb_path.glob("*.md"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
                filename = file_path.name
                chunks = chunk_document(text, filename)
                all_chunks.extend(chunks)
                logger.info(f"Processed {filename}: created {len(chunks)} chunks.")
            except Exception as e:
                logger.error(f"Error processing knowledge base file {file_path}: {e}")

        if not all_chunks:
            logger.warning("No knowledge base documents found or processed. Index is empty.")
            return

        # Prepare texts and metadata
        self.chunks_text = [chunk["text"] for chunk in all_chunks]
        self.metadata = [chunk["metadata"] for chunk in all_chunks]

        # Embed all texts
        logger.info(f"Embedding {len(self.chunks_text)} knowledge base chunks...")
        embeddings_matrix = self.embedder.embed_texts(self.chunks_text)
        self.embeddings = [vec for vec in embeddings_matrix]

        # Build FAISS index if available
        if HAS_FAISS:
            try:
                # Normalize vectors for Inner Product (Cosine Similarity)
                norms = np.linalg.norm(embeddings_matrix, axis=1, keepdims=True)
                # Avoid divide by zero
                norms = np.where(norms == 0, 1.0, norms)
                normalized_embeddings = (embeddings_matrix / norms).astype(np.float32)
                
                self.faiss_index = faiss.IndexFlatIP(self.dimension)
                self.faiss_index.add(normalized_embeddings)
                logger.info(f"FAISS index built with {self.faiss_index.ntotal} vectors.")
            except Exception as e:
                logger.error(f"Failed to build FAISS index: {e}. Falling back to NumPy storage.")
                self.faiss_index = None
        else:
            logger.info("NumPy vector database initialized (FAISS is disabled).")
            
        self.save_index()

    def save_index(self):
        """Saves index and metadata to disk."""
        self.index_dir.mkdir(parents=True, exist_ok=True)
        
        # Save metadata and raw text
        data = {
            "metadata": self.metadata,
            "chunks_text": self.chunks_text,
            "embeddings": [vec.tolist() for vec in self.embeddings]
        }
        with open(self.index_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        # Save FAISS index file if using FAISS
        if HAS_FAISS and self.faiss_index is not None:
            try:
                faiss.write_index(self.faiss_index, str(self.index_dir / "faiss.index"))
                logger.info("FAISS index saved successfully.")
            except Exception as e:
                logger.error(f"Error saving FAISS index: {e}")

    def load_index(self) -> bool:
        """Loads index and metadata from disk. Returns True on success, False otherwise."""
        metadata_path = self.index_dir / "metadata.json"
        if not metadata_path.exists():
            logger.warning(f"Metadata file not found at {metadata_path}. Cannot load index.")
            return False
            
        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            self.metadata = data.get("metadata", [])
            self.chunks_text = data.get("chunks_text", [])
            self.embeddings = [np.array(vec, dtype=np.float32) for vec in data.get("embeddings", [])]
            
            # Load FAISS index
            faiss_index_path = self.index_dir / "faiss.index"
            if HAS_FAISS and faiss_index_path.exists():
                try:
                    self.faiss_index = faiss.read_index(str(faiss_index_path))
                    logger.info("FAISS index loaded successfully.")
                    return True
                except Exception as e:
                    logger.error(f"Error loading FAISS index file: {e}. Falling back to NumPy.")
                    self.faiss_index = None
            else:
                self.faiss_index = None
                
            logger.info("Vector store loaded successfully (NumPy mode).")
            return True
            
        except Exception as e:
            logger.error(f"Error loading vector store from disk: {e}")
            return False

    def query(self, query_text: str, k: int = 3) -> List[Dict[str, Any]]:
        """
        Queries the vector store for top-k matching chunks.
        Automatically loads or builds index if empty.
        Returns a list of dicts: {'text': chunk_text, 'metadata': metadata, 'score': similarity_score}
        """
        # Auto-load or build index if not initialized
        if not self.metadata:
            if not self.load_index():
                logger.info("Index not found. Building index from knowledge base...")
                self.build_index_from_kb()
                
        if not self.metadata:
            logger.warning("Empty vector store. No documents indexed.")
            return []

        # Embed query text
        query_vec = self.embedder.embed_texts([query_text])[0]
        # Normalize for cosine similarity
        query_norm = np.linalg.norm(query_vec)
        if query_norm > 0:
            query_vec = query_vec / query_norm
            
        # Execute query
        results = []
        
        # 1. FAISS Search
        if HAS_FAISS and self.faiss_index is not None:
            try:
                # Query vector must be 2D float32
                q_matrix = np.array([query_vec], dtype=np.float32)
                scores, indices = self.faiss_index.search(q_matrix, min(k, self.faiss_index.ntotal))
                
                for score, idx in zip(scores[0], indices[0]):
                    if idx != -1 and idx < len(self.chunks_text):
                        results.append({
                            "text": self.chunks_text[idx],
                            "metadata": self.metadata[idx],
                            "score": float(score)
                        })
                return results
            except Exception as e:
                logger.error(f"FAISS search failed: {e}. Falling back to NumPy search.")

        # 2. NumPy Fallback Search (Cosine Similarity)
        try:
            similarities = []
            for vec in self.embeddings:
                vec_norm = np.linalg.norm(vec)
                norm_vec = vec / vec_norm if vec_norm > 0 else vec
                # Dot product of normalized vectors yields Cosine Similarity
                sim = float(np.dot(norm_vec, query_vec))
                similarities.append(sim)
                
            top_k_indices = np.argsort(similarities)[::-1][:k]
            for idx in top_k_indices:
                results.append({
                    "text": self.chunks_text[idx],
                    "metadata": self.metadata[idx],
                    "score": similarities[idx]
                })
        except Exception as e:
            logger.error(f"NumPy similarity search failed: {e}")
            
        return results

# Singleton instance
vector_store = VectorStore()
