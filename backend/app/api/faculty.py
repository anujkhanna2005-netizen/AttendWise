"""GET /faculty"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.database.connection import get_db
from app.models.models import Faculty
from app.schemas.schemas import FacultyOut

router = APIRouter(prefix="/faculty", tags=["faculty"])


@router.get("", response_model=list[FacultyOut])
def list_faculty(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return db.query(Faculty).all()
