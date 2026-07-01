from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.agents.agent import answer_question
from app.api import analytics, auth, chat, documents
from app.config import get_settings
from app.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        from app.rag.retriever import get_vector_store

        get_vector_store(settings.default_airline)
    except Exception:
        pass
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
