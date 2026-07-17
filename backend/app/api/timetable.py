from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.auth.security import get_current_user, require_roles
from app.database.connection import get_db
from app.models.models import TimetableSlot, Faculty, User
from app.schemas.schemas import TimetableSlotCreate, TimetableSlotOut

router = APIRouter(tags=["timetable"])

@router.get("/timetable", response_model=list[TimetableSlotOut])
def get_timetable(
    faculty_id: int | None = None,
    semester_id: int | None = None,
    day_of_week: int | None = None,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    query = db.query(TimetableSlot)
    if faculty_id is not None:
        query = query.filter(TimetableSlot.faculty_id == faculty_id)
    if semester_id is not None:
        query = query.filter(TimetableSlot.semester_id == semester_id)
    if day_of_week is not None:
        query = query.filter(TimetableSlot.day_of_week == day_of_week)
    return query.all()

@router.post(
    "/timetable",
    response_model=TimetableSlotOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
def create_timetable_slot(body: TimetableSlotCreate, db: Session = Depends(get_db)):
    if body.end_time <= body.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time",
        )

    slot = TimetableSlot(
        faculty_id=body.faculty_id,
        subject_id=body.subject_id,
        semester_id=body.semester_id,
        room=body.room,
        day_of_week=body.day_of_week,
        start_time=body.start_time,
        end_time=body.end_time,
    )
    db.add(slot)
    try:
        db.commit()
        db.refresh(slot)
    except IntegrityError as exc:
        db.rollback()
        # Parse PG EXCLUDE constraints or database conflicts
        err_msg = str(exc.orig) if exc.orig else ""
        if "uq_faculty_schedule_overlap" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Faculty member is double-booked for this time slot (Exclusion Constraint)",
            )
        elif "uq_room_schedule_overlap" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Room is double-booked for this time slot (Exclusion Constraint)",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Database conflict occurred: {err_msg}",
            ) from exc
    return slot

@router.get("/faculty/{faculty_id}/timetable", response_model=list[TimetableSlotOut])
def get_faculty_timetable(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    faculty = db.get(Faculty, faculty_id)
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty member not found")

    # Authorize: admins can fetch any timetable; faculty can ONLY fetch their own
    if current_user.role.name != "admin":
        if not current_user.faculty_profile or current_user.faculty_profile.id != faculty_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not permitted to access another faculty member's timetable",
            )

    return db.query(TimetableSlot).filter(TimetableSlot.faculty_id == faculty_id).all()
