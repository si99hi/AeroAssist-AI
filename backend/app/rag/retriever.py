"""FAISS-based RAG pipeline with RecursiveCharacterTextSplitter."""

import json
import os
from pathlib import Path
from typing import Any

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings

settings = get_settings()

_vector_stores: dict[str, FAISS] = {}
_embeddings: FastEmbedEmbeddings | None = None

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
    {
        "title": "Air India Baggage Policy",
        "text": "Air India allows economy class passengers to carry one piece of hand baggage up to 8kg. "
        "Checked baggage allowance varies by route and cabin class. Overweight/oversized baggage "
        "incurs excess baggage charges at the airport.",
        "metadata": {"airline": "Air India", "document": "Baggage Policy", "page": 1, "category": "Baggage"},
    },
    {
        "title": "Air India Cancellation & Rebooking",
        "text": "If Air India cancels your flight, you are entitled to a full refund or a free rebooking "
        "on the next available Air India flight. Voluntary changes or cancellations are subject to "
        "cancellation/change fees depending on the ticket fare rules.",
        "metadata": {"airline": "Air India", "document": "Cancellation Policy", "page": 1, "category": "Cancellation"},
    },
    {
        "title": "Air India Delay Compensation",
        "text": "For delays within Air India's control, passengers delayed over 3 hours are eligible for "
        "meals and refreshments. In case of overnight delays, hotel accommodation is provided.",
        "metadata": {"airline": "Air India", "document": "Delay Compensation", "page": 1, "category": "Delays"},
    },
]


def _get_embeddings() -> FastEmbedEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = FastEmbedEmbeddings(model_name=settings.embedding_model)
    return _embeddings


def _index_path(airline: str = "Air India") -> Path:
    return Path(settings.faiss_dir) / airline.lower().replace(" ", "_")


def _file_belongs_to_airline(file_path: Path, airline: str) -> bool:
    filename = file_path.name
    a_lower = airline.lower().replace(" ", "")
    f_lower = filename.lower()

    if a_lower == "united":
        return filename in {"baggage_policy.txt", "cancellation_policy.txt", "delay_compensation.txt"}
    elif a_lower in {"airindia", "air_india"}:
        return "airindia" in f_lower or "air-india" in f_lower or "ai-" in f_lower or "passenger-charter" in f_lower

    return a_lower in f_lower.replace("_", "").replace("-", "")


def build_vector_index(airline: str = "Air India") -> FAISS:
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
        if file_path.is_dir():
            continue
        if not _file_belongs_to_airline(file_path, airline):
            continue

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
            if item["metadata"]["airline"].lower() == airline.lower():
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


def get_vector_store(airline: str = "Air India") -> FAISS | None:
    """Load FAISS index from disk, building it if missing."""
    global _vector_stores
    key = airline.lower()
    index_dir = _index_path(airline)

    if key in _vector_stores and index_dir.exists():
        return _vector_stores[key]

    if index_dir.exists() and (index_dir / "index.faiss").exists():
        store = FAISS.load_local(
            str(index_dir),
            _get_embeddings(),
            allow_dangerous_deserialization=True,
        )
        _vector_stores[key] = store
        return store

    store = build_vector_index(airline)
    _vector_stores[key] = store
    return store


def search_documents(query: str, top_k: int = 3, airline: str = "Air India") -> list[dict[str, Any]]:
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
        return output or _keyword_fallback(query, top_k, airline=airline)
    except Exception:
        return _keyword_fallback(query, top_k, airline=airline)


def _keyword_fallback(query: str, top_k: int, airline: str = "Air India") -> list[dict[str, Any]]:
    query_words = set(query.lower().split())
    scored = []
    for doc in FALLBACK_DOCS:
        doc_airline = doc.get("metadata", {}).get("airline", "United")
        if doc_airline.lower() != airline.lower():
            continue
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
