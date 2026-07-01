import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models.document import UploadedDocument
from app.models.user import User
from app.rag.retriever import build_vector_index

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()


@router.get("")
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(UploadedDocument).order_by(UploadedDocument.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "airline": d.airline,
            "filename": d.filename,
            "category": d.category,
            "embedding_status": d.embedding_status,
        }
        for d in docs
    ]


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    airline: str = Form(default="Air India"),
    category: str = Form(default="General"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    docs_dir = Path(settings.documents_dir)
    docs_dir.mkdir(parents=True, exist_ok=True)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename required")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".pdf", ".txt", ".md", ".docx"}:
        raise HTTPException(status_code=400, detail="Supported formats: PDF, TXT, MD, DOCX")

    dest = docs_dir / file.filename
    with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = UploadedDocument(
        airline=airline,
        filename=file.filename,
        category=category,
        embedding_status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        build_vector_index(airline)
        doc.embedding_status = "ready"
    except Exception:
        doc.embedding_status = "failed"

    db.commit()
    return {"id": doc.id, "filename": doc.filename, "embedding_status": doc.embedding_status}


@router.delete("/{doc_id}")
def delete_document(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = Path(settings.documents_dir) / doc.filename
    if file_path.exists():
        file_path.unlink()

    db.delete(doc)
    db.commit()
    return {"deleted": doc_id}


@router.post("/rebuild")
def rebuild_index(
    airline: str = "Air India",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    build_vector_index(airline)
    db.query(UploadedDocument).filter(UploadedDocument.airline == airline).update({"embedding_status": "ready"})
    db.commit()
    return {"status": "rebuilt", "airline": airline}
