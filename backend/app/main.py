from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.agents.agent import answer_question
from app.api import analytics, auth, chat, documents
from app.config import get_settings
from app.database import init_db

settings = get_settings()


def sync_documents_to_db(db):
    from pathlib import Path
    from app.models.document import UploadedDocument
    
    docs_dir = Path(settings.documents_dir)
    if not docs_dir.exists():
        return
        
    for file_path in docs_dir.glob("**/*"):
        if file_path.is_file():
            filename = file_path.name
            # Check if exists in db
            exists = db.query(UploadedDocument).filter(UploadedDocument.filename == filename).first()
            if not exists:
                f_lower = filename.lower()
                # Airline heuristic: default to Air India for pdfs/passenger charter
                if filename in {"baggage_policy.txt", "cancellation_policy.txt", "delay_compensation.txt"}:
                    airline = "United"
                else:
                    airline = "Air India"
                
                # Category heuristic
                if "baggage" in f_lower:
                    category = "Baggage"
                elif "cancellation" in f_lower or "booking" in f_lower or "schedule-change" in f_lower:
                    category = "Cancellation"
                elif "delay" in f_lower or "irrops" in f_lower or "rights" in f_lower:
                    category = "Delays"
                else:
                    category = "General"
                    
                doc = UploadedDocument(
                    airline=airline,
                    filename=filename,
                    category=category,
                    embedding_status="ready",
                )
                db.add(doc)
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        from app.database import SessionLocal
        from app.rag.retriever import get_vector_store
        
        # Sync orphaned files on disk to DB
        db = SessionLocal()
        try:
            sync_documents_to_db(db)
        finally:
            db.close()
            
        # Build or load vector store for Air India
        get_vector_store("Air India")
    except Exception as e:
        print("Error during startup sync/indexing:", e)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(analytics.router)


class PublicChatRequest(BaseModel):
    question: str


class PublicChatResponse(BaseModel):
    answer: str
    tools_used: list[str]
    citations: list[dict] = []


@app.get("/health")
def health():
    return {
        "status": "ok",
        "llm_agent": settings.use_llm_agent,
        "embedding_model": settings.embedding_model,
    }


@app.post("/chat/public", response_model=PublicChatResponse)
def public_chat(request: PublicChatRequest):
    """Unauthenticated endpoint for quick testing without login."""
    result = answer_question(request.question)
    return PublicChatResponse(
        answer=result["answer"],
        tools_used=result.get("tools_used", []),
        citations=result.get("citations", []),
    )
