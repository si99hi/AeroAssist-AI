from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1)
    chat_id: int | None = None


class ChatResponse(BaseModel):
    answer: str
    tools_used: list[str]
    citations: list[dict] = []
    chat_id: int


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str

    class Config:
        from_attributes = True


class ChatSummary(BaseModel):
    id: int
    title: str
    messages: list[MessageResponse] = []

    class Config:
        from_attributes = True
