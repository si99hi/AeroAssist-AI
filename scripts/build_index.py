"""Build FAISS index from documents folder."""

from app.config import get_settings
from app.rag.retriever import build_vector_index

if __name__ == "__main__":
    settings = get_settings()
    store = build_vector_index(settings.default_airline)
    print(f"Built FAISS index for {settings.default_airline}")
