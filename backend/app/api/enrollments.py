from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.auth.security import get_current_user, require_roles
from app.database.connection import get_db
from app.models.models import StudentEnrollment, Student, User
from app.schemas.schemas import EnrollmentCreate, EnrollmentOut

router = APIRouter(tags=["enrollments"])

@router.post(
    "/enrollments",
    response_model=EnrollmentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
def enroll_student(body: EnrollmentCreate, db: Session = Depends(get_db)):
    enrollment = StudentEnrollment(
        student_id=body.student_id,
        subject_id=body.subject_id,
        semester_id=body.semester_id,
    )
    db.add(enrollment)
    try:
        db.commit()
        db.refresh(enrollment)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student is already enrolled in this subject for the given semester",
        ) from exc
    return enrollment

@router.get("/students/{student_id}/enrollments", response_model=list[EnrollmentOut])
def get_student_enrollments(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Retrieve target student record
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Authorize: admins can fetch any enrollment; students can ONLY fetch their own
    if current_user.role.name != "admin":
        # Check profile linkage
        if not current_user.student or current_user.student.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not permitted to access another student's enrollment records",
            )
            
    return db.query(StudentEnrollment).filter(StudentEnrollment.student_id == student_id).all()
