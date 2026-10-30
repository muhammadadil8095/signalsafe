"""Message analysis API endpoint."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.models.scan import ScanHistory
from app.analyzers.message_analyzer import MessageAnalyzer
from uuid import uuid4

router = APIRouter(prefix="/analyze", tags=["Analysis"])


class MessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)


@router.post("/message")
def analyze_message(
    request: MessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Analyze a suspicious message for social engineering indicators."""
    analyzer = MessageAnalyzer()
    result = analyzer.analyze(request.content)

    # Persist as scan record
    scan = ScanHistory(
        id=str(uuid4()),
        user_id=str(current_user.id),
        scan_type="message",
        original_input=request.content[:2000],
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        prediction=result["risk_level"],
        ml_available=False,
        vt_available=False,
        signals=result["indicators"],
        explanation=result["explanation"],
        recommendations=result["recommendations"],
    )
    db.add(scan)
    db.commit()

    result["scan_id"] = str(scan.id)
    return result

