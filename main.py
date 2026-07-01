"""
Minimal FastAPI app. One route that matters: POST /chat.
No auth, no database, no Docker. Run with:

    uvicorn main:app --reload

Then open http://127.0.0.1:8000/docs to try it in the browser.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import answer_question

app = FastAPI(title="AeroAssist AI (simple version)")

# Allow a local frontend (e.g. Vite on :5173) to call this API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    tools_used: list[str]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    result = answer_question(request.question)
    return ChatResponse(answer=result["answer"], tools_used=result["tools_used"])
