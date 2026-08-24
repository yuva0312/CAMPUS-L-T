import logging
import numpy as np

logger = logging.getLogger(__name__)

# Global model state
_st_model = None
_use_st = False

try:
  from sentence_transformers import SentenceTransformer
  # Load lightweight model for fast semantic embedding
  _st_model = SentenceTransformer('all-MiniLM-L6-v2')
  _use_st = True
  print("Sentence Transformers model (all-MiniLM-L6-v2) loaded successfully.")
except Exception as e:
  print(f"Sentence Transformers not loaded, using TF-IDF + Cosine fallback: {e}")
  _use_st = False

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def get_embedding(text: str) -> np.ndarray:
  """Generate dense vector embedding for a given text string."""
  if _use_st and _st_model is not None:
    return _st_model.encode(text, convert_to_numpy=True)
  return None


def calculate_cosine_similarity(text1: str, text2: str) -> float:
  """Compute cosine similarity score between two text strings [0.0 - 1.0]."""
  if not text1 or not text2:
    return 0.0

  if _use_st and _st_model is not None:
    vec1 = get_embedding(text1)
    vec2 = get_embedding(text2)
    # Cosine similarity between 1D vectors
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
      return 0.0
    sim = float(dot_product / (norm1 * norm2))
    return max(0.0, min(1.0, sim))
  else:
    # TF-IDF Cosine Similarity Fallback
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([text1, text2])
    sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    return float(max(0.0, min(1.0, sim)))
