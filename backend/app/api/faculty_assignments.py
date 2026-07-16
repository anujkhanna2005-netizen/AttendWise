from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.auth.security import get_current_user, require_roles
from app.database.connection import get_db
from app.models.models import FacultySubjectAssignment, Faculty, User
from app.schemas.schemas import FacultyAssignmentCreate, FacultyAssignmentOut

router = APIRouter(tags=["faculty-assignments"])

@router.post(
    "/faculty-assignments",
    response_model=FacultyAssignmentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
def create_faculty_assignment(body: FacultyAssignmentCreate, db: Session = Depends(get_db)):
    assignment = FacultySubjectAssignment(
        faculty_id=body.faculty_id,
        subject_id=body.subject_id,
        semester_id=body.semester_id,
    )
    db.add(assignment)
    try:
        db.commit()
        db.refresh(assignment)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Faculty subject assignment already exists for the given semester",
        ) from exc
    return assignment

@router.get("/faculty/{faculty_id}/assignments", response_model=list[FacultyAssignmentOut])
def get_faculty_assignments(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    faculty = db.get(Faculty, faculty_id)
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty member not found")

    # Authorize: admins can fetch any assignment; faculty can ONLY fetch their own
    if current_user.role.name != "admin":
        if not current_user.faculty_profile or current_user.faculty_profile.id != faculty_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not permitted to access another faculty member's assignments",
            )

    return db.query(FacultySubjectAssignment).filter(FacultySubjectAssignment.faculty_id == faculty_id).all()
