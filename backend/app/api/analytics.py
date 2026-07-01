from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.log import ToolLog
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("")
def analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tool_counts = (
        db.query(ToolLog.tool_used, func.count(ToolLog.id))
        .group_by(ToolLog.tool_used)
        .all()
    )
    avg_latency = db.query(func.avg(ToolLog.latency)).scalar() or 0
    total_requests = db.query(func.count(ToolLog.id)).scalar() or 0

    return {
        "tool_usage": {tool: count for tool, count in tool_counts},
        "avg_latency_ms": round(float(avg_latency), 2),
        "total_tool_calls": total_requests,
    }
