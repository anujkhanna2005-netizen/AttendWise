"""GET /parents/{id}/students"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.database.connection import get_db
from app.models.models import Parent, StudentParent, Student
from app.schemas.schemas import ParentStudentsOut, StudentOut

router = APIRouter(prefix="/parents", tags=["parents"])


@router.get("/{parent_id}/students", response_model=ParentStudentsOut)
def get_parent_students(
    parent_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    parent = db.get(Parent, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    links = (
        db.query(StudentParent)
        .filter(StudentParent.parent_id == parent_id)
        .all()
    )
    students = [link.student for link in links]
    return ParentStudentsOut(parent_id=parent_id, students=students)
