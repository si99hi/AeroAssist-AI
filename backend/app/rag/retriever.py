"""FAISS-based RAG pipeline with RecursiveCharacterTextSplitter."""

import json
import os
from pathlib import Path
from typing import Any

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings

settings = get_settings()

_vector_store: FAISS | None = None
_embeddings: HuggingFaceEmbeddings | None = None

FALLBACK_DOCS = [
    {
        "title": "Baggage Policy",
        "text": "Passengers may carry one personal item and one carry-on bag free of charge. "
        "Checked bags over 23kg incur an overweight fee. Two checked bags are allowed "
        "in economy for an additional fee per bag.",
        "metadata": {"airline": "United", "document": "Baggage Policy", "page": 1, "category": "Baggage"},
    },
    {
        "title": "Cancellation & Rebooking",
        "text": "If your flight is cancelled by the airline, you may rebook on the next available "
        "flight at no extra cost, or request a full refund. Rebooking after a voluntary "
        "cancellation may incur a change fee depending on fare type.",
        "metadata": {"airline": "United", "document": "Cancellation Policy", "page": 1, "category": "Cancellation"},
    },
    {
        "title": "Delay Compensation",
        "text": "Passengers delayed more than 3 hours due to circumstances within the airline's "
        "control may be eligible for meal vouchers and, in some cases, hotel accommodation.",
        "metadata": {"airline": "United", "document": "Delay Compensation", "page": 1, "category": "Delays"},
    },
]


def _get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=settings.embedding_model)
    return _embeddings


def _index_path(airline: str = "United") -> Path:
    return Path(settings.faiss_dir) / airline.lower().replace(" ", "_")


def build_vector_index(airline: str = "United") -> FAISS:
    """Load documents, chunk, embed, and save FAISS index."""
    from langchain_core.documents import Document

    docs_dir = Path(settings.documents_dir)
    docs_dir.mkdir(parents=True, exist_ok=True)
    index_dir = _index_path(airline)
    index_dir.mkdir(parents=True, exist_ok=True)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )

    all_docs: list[Document] = []

    for file_path in docs_dir.glob("**/*"):
        if file_path.suffix.lower() == ".pdf":
            loader = PyPDFLoader(str(file_path))
            loaded = loader.load()
            for doc in loaded:
                doc.metadata.setdefault("airline", airline)
                doc.metadata.setdefault("document", file_path.stem)
                doc.metadata.setdefault("category", "General")
            all_docs.extend(loaded)
        elif file_path.suffix.lower() in {".txt", ".md"}:
            loader = TextLoader(str(file_path), encoding="utf-8")
            loaded = loader.load()
            for doc in loaded:
                doc.metadata.setdefault("airline", airline)
                doc.metadata.setdefault("document", file_path.stem)
                doc.metadata.setdefault("category", "General")
            all_docs.extend(loaded)

    if not all_docs:
        for item in FALLBACK_DOCS:
            all_docs.append(
                Document(page_content=item["text"], metadata=item["metadata"])
            )

    chunks = splitter.split_documents(all_docs)
    embeddings = _get_embeddings()
    store = FAISS.from_documents(chunks, embeddings)
    store.save_local(str(index_dir))

    meta_path = index_dir / "metadata.json"
    meta_path.write_text(
        json.dumps({"airline": airline, "chunk_count": len(chunks), "source_files": len(all_docs)}),
        encoding="utf-8",
    )
    return store


def get_vector_store(airline: str = "United") -> FAISS | None:
    """Load FAISS index from disk, building it if missing."""
    global _vector_store
    index_dir = _index_path(airline)

    if _vector_store is not None and index_dir.exists():
        return _vector_store

    if index_dir.exists() and (index_dir / "index.faiss").exists():
        _vector_store = FAISS.load_local(
            str(index_dir),
            _get_embeddings(),
            allow_dangerous_deserialization=True,
        )
        return _vector_store

    _vector_store = build_vector_index(airline)
    return _vector_store


def search_documents(query: str, top_k: int = 3, airline: str = "United") -> list[dict[str, Any]]:
    """Retrieve top-k policy chunks with citations."""
    try:
        store = get_vector_store(airline)
        if store is None:
            raise RuntimeError("Vector store unavailable")

        results = store.similarity_search_with_score(query, k=top_k)
        output = []
        for doc, score in results:
            meta = doc.metadata or {}
            output.append(
                {
                    "title": meta.get("document", "Policy Document"),
                    "text": doc.page_content,
                    "score": round(float(score), 4),
                    "citation": {
                        "airline": meta.get("airline", airline),
                        "document": meta.get("document", "Unknown"),
                        "page": meta.get("page", "N/A"),
                        "category": meta.get("category", "General"),
                    },
                }
            )
        return output or _keyword_fallback(query, top_k)
    except Exception:
        return _keyword_fallback(query, top_k)


def _keyword_fallback(query: str, top_k: int) -> list[dict[str, Any]]:
    query_words = set(query.lower().split())
    scored = []
    for doc in FALLBACK_DOCS:
        doc_words = set(doc["text"].lower().split())
        overlap = len(query_words & doc_words)
        if overlap > 0:
            scored.append((overlap, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    results = []
    for _, doc in scored[:top_k]:
        results.append(
            {
                "title": doc["title"],
                "text": doc["text"],
                "score": None,
                "citation": doc["metadata"],
            }
        )
    if not results:
        results = [
            {
                "title": "No match",
                "text": "No relevant policy found.",
                "score": None,
                "citation": {},
            }
        ]
    return results
