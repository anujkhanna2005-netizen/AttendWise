from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.auth.security import get_current_user, require_roles
from app.database.connection import get_db
from app.models.models import Semester
from app.schemas.schemas import SemesterCreate, SemesterOut

router = APIRouter(prefix="/semesters", tags=["semesters"])

@router.get("", response_model=list[SemesterOut])
def list_semesters(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return db.query(Semester).order_by(Semester.number).all()

@router.post(
    "",
    response_model=SemesterOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
def create_semester(body: SemesterCreate, db: Session = Depends(get_db)):
    semester = Semester(name=body.name, number=body.number)
    db.add(semester)
    try:
        db.commit()
        db.refresh(semester)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create semester due to database integrity constraints",
        ) from exc
    return semester
