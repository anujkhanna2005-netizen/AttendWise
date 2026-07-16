"""GET /courses, POST /courses (admin only)"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.auth.security import get_current_user, require_roles
from app.database.connection import get_db
from app.models.models import Course, Department
from app.schemas.schemas import CourseCreate, CourseOut

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=list[CourseOut])
def list_courses(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return db.query(Course).order_by(Course.name).all()


@router.post(
    "",
    response_model=CourseOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
def create_course(body: CourseCreate, db: Session = Depends(get_db)):
    dept = db.get(Department, body.department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    course = Course(department_id=body.department_id, name=body.name, code=body.code)
    db.add(course)
    try:
        db.commit()
        db.refresh(course)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Course already exists")
    return course
