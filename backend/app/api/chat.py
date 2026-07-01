from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.agent import answer_question
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.chat import Chat
from app.models.log import ToolLog
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, ChatSummary

router = APIRouter(tags=["chat"])


def _chat_title(question: str) -> str:
    title = question.strip()[:60]
    return title + ("..." if len(question) > 60 else "")


@router.get("/chat", response_model=list[ChatSummary])
def list_chats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).order_by(Chat.created_at.desc()).all()
    return chats


@router.get("/chat/{chat_id}", response_model=ChatSummary)
def get_chat(chat_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if request.chat_id:
        chat = db.query(Chat).filter(Chat.id == request.chat_id, Chat.user_id == current_user.id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
    else:
        chat = Chat(user_id=current_user.id, title=_chat_title(request.question))
        db.add(chat)
        db.flush()

    db.add(Message(chat_id=chat.id, role="user", content=request.question))

    result = answer_question(request.question)

    for tool in result.get("tools_used", []):
        db.add(ToolLog(tool_used=tool, latency=result.get("latency_ms", 0) / max(len(result.get("tools_used", [])), 1), tokens=result.get("tokens", 0)))

    db.add(Message(chat_id=chat.id, role="assistant", content=result["answer"]))
    db.commit()
    db.refresh(chat)

    return ChatResponse(
        answer=result["answer"],
        tools_used=result.get("tools_used", []),
        citations=result.get("citations", []),
        chat_id=chat.id,
    )
