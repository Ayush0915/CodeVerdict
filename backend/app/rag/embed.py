import re
import logging
from typing import List, Dict, Any
import numpy as np

logger = logging.getLogger(__name__)

# Fallback embedding generation using deterministic hashes
def _get_mock_embedding(text: str, dimension: int = 384) -> np.ndarray:
    """Generates a deterministic mock embedding for offline or fallback scenarios."""
    import hashlib
    # Compute SHA-256 hash of the text
    h = hashlib.sha256(text.encode("utf-8")).digest()
    # Convert hash bytes to floats and expand to the requested dimension
    np.random.seed(int.from_bytes(h[:4], byteorder="big"))
    vec = np.random.randn(dimension).astype(np.float32)
    # Normalize vector to unit length
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec

class Embedder:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self.dimension = 384 # Dimension of all-MiniLM-L6-v2
        self.is_mock = False
        
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading SentenceTransformer model: {model_name}...")
            self.model = SentenceTransformer(model_name)
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.warning(
                f"Failed to load sentence-transformers model '{model_name}' ({e}). "
                "Falling back to deterministic mock embedding generator."
            )
            self.is_mock = True

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Embeds a list of texts. Returns a 2D numpy array of shape (len(texts), dimension).
        """
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)
            
        if self.is_mock or not self.model:
            embeddings = [self.get_single_mock_embedding(t) for t in texts]
            return np.array(embeddings, dtype=np.float32)
            
        try:
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.astype(np.float32)
        except Exception as e:
            logger.error(f"Error encoding texts with model: {e}. Falling back to mock embeddings.")
            embeddings = [self.get_single_mock_embedding(t) for t in texts]
            return np.array(embeddings, dtype=np.float32)

    def get_single_mock_embedding(self, text: str) -> np.ndarray:
        return _get_mock_embedding(text, self.dimension)

def chunk_document(text: str, filename: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[Dict[str, Any]]:
    """
    Chunks markdown or text file into smaller sections.
    Splits primarily by headers or paragraphs, keeping chunks under chunk_size.
    Returns a list of dicts: {'text': chunk_text, 'metadata': {'file': filename, 'chunk_id': int}}
    """
    # Simple chunking strategy: split by paragraphs, then group them into chunks
    paragraphs = re.split(r"\n\n+", text)
    chunks = []
    current_chunk = []
    current_length = 0
    chunk_id = 0
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
            
        para_len = len(para)
        # If a single paragraph is larger than chunk_size, split by lines or sentences
        if para_len > chunk_size:
            # If we have something in current_chunk, append it first
            if current_chunk:
                chunk_text = "\n\n".join(current_chunk)
                chunks.append({
                    "text": chunk_text,
                    "metadata": {"file": filename, "chunk_id": chunk_id}
                })
                chunk_id += 1
                current_chunk = []
                current_length = 0
                
            # Split large paragraph by lines
            lines = para.split("\n")
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                if current_length + len(line) > chunk_size:
                    if current_chunk:
                        chunk_text = "\n".join(current_chunk)
                        chunks.append({
                            "text": chunk_text,
                            "metadata": {"file": filename, "chunk_id": chunk_id}
                        })
                        chunk_id += 1
                        current_chunk = []
                        current_length = 0
                current_chunk.append(line)
                current_length += len(line)
        else:
            if current_length + para_len > chunk_size:
                chunk_text = "\n\n".join(current_chunk)
                chunks.append({
                    "text": chunk_text,
                    "metadata": {"file": filename, "chunk_id": chunk_id}
                })
                chunk_id += 1
                # To handle overlap, keep the last paragraph if overlap is configured
                if chunk_overlap > 0 and len(current_chunk) > 1:
                    current_chunk = [current_chunk[-1]]
                    current_length = len(current_chunk[0])
                else:
                    current_chunk = []
                    current_length = 0
            
            current_chunk.append(para)
            current_length += para_len
            
    if current_chunk:
        chunk_text = "\n\n".join(current_chunk)
        chunks.append({
            "text": chunk_text,
            "metadata": {"file": filename, "chunk_id": chunk_id}
        })
        
    return chunks
