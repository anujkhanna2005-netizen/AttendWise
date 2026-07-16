"""GET /departments, POST /departments (admin only)"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.auth.security import get_current_user, require_roles
from app.database.connection import get_db
from app.models.models import Department
from app.schemas.schemas import DepartmentCreate, DepartmentOut

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("", response_model=list[DepartmentOut])
def list_departments(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),  # any authenticated user
):
    return db.query(Department).order_by(Department.name).all()


@router.post(
    "",
    response_model=DepartmentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],   # 403 for all other roles
)
def create_department(body: DepartmentCreate, db: Session = Depends(get_db)):
    dept = Department(name=body.name, code=body.code.upper())
    db.add(dept)
    try:
        db.commit()
        db.refresh(dept)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Department with code '{body.code.upper()}' already exists",
        )
    return dept


@router.delete(
    "/{dept_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("admin"))],
)
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    """
    Delete a department. Will be BLOCKED by the DB if any students are assigned
    to it (ON DELETE RESTRICT on students.department_id → departments.id).
    """
    dept = db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    db.delete(dept)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete department: students are still assigned to it (ON DELETE RESTRICT)",
        )
