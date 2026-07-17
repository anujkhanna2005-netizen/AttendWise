import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.auth.security import get_current_user, require_roles
from app.database.connection import get_db
from app.models.models import AttendanceRecord, TimetableSlot, Student, User, Subject
from app.schemas.schemas import (
    AttendanceRecordCreate,
    AttendanceRecordOut,
    AttendanceRecordUpdate,
    StudentAttendanceSummary,
    SubjectAttendanceSummary,
)

router = APIRouter(tags=["attendance"])

@router.get("/attendance", response_model=list[AttendanceRecordOut])
def get_attendance(
    student_id: int | None = None,
    timetable_slot_id: int | None = None,
    start_date: datetime.date | None = None,
    end_date: datetime.date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AttendanceRecord)

    # Enforce Role Scoping
    if current_user.role.name == "student":
        student_profile = current_user.student
        if not student_profile:
            raise HTTPException(status_code=403, detail="Student profile not found")
        # Overwrite filter to own ID
        query = query.filter(AttendanceRecord.student_id == student_profile.id)
    elif current_user.role.name == "faculty":
        faculty_profile = current_user.faculty_profile
        if not faculty_profile:
            raise HTTPException(status_code=403, detail="Faculty profile not found")
        # Filter to slots marked by this faculty or assigned to this faculty
        query = query.join(TimetableSlot).filter(TimetableSlot.faculty_id == faculty_profile.id)
        if student_id is not None:
            query = query.filter(AttendanceRecord.student_id == student_id)
    else:
        # Admin - allow arbitrary filtering
        if student_id is not None:
            query = query.filter(AttendanceRecord.student_id == student_id)

    if timetable_slot_id is not None:
        query = query.filter(AttendanceRecord.timetable_slot_id == timetable_slot_id)
    if start_date is not None:
        query = query.filter(AttendanceRecord.date >= start_date)
    if end_date is not None:
        query = query.filter(AttendanceRecord.date <= end_date)

    return query.all()

@router.post(
    "/attendance",
    response_model=AttendanceRecordOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("faculty"))],
)
def mark_attendance(
    body: AttendanceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    faculty_profile = current_user.faculty_profile
    if not faculty_profile:
        raise HTTPException(status_code=403, detail="Faculty profile not found")

    # Validate slot belongs to this faculty member
    slot = db.get(TimetableSlot, body.timetable_slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Timetable slot not found")
    if slot.faculty_id != faculty_profile.id:
        raise HTTPException(
            status_code=403,
            detail="You are not permitted to mark attendance for another faculty's timetable slot",
        )

    # Validate student exists
    student = db.get(Student, body.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    record = AttendanceRecord(
        student_id=body.student_id,
        timetable_slot_id=body.timetable_slot_id,
        date=body.date,
        status=body.status,
        marked_by=faculty_profile.id,
    )
    db.add(record)
    try:
        db.commit()
        db.refresh(record)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance record already exists for this student, timetable slot, and date",
        ) from exc
    return record

@router.patch(
    "/attendance/{record_id}",
    response_model=AttendanceRecordOut,
    dependencies=[Depends(require_roles("faculty"))],
)
def update_attendance(
    record_id: int,
    body: AttendanceRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    faculty_profile = current_user.faculty_profile
    if not faculty_profile:
        raise HTTPException(status_code=403, detail="Faculty profile not found")

    record = db.get(AttendanceRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    # Verify ownership: own slots only
    if record.timetable_slot.faculty_id != faculty_profile.id:
        raise HTTPException(
            status_code=403,
            detail="You can only correct attendance records marked for your own timetable slots",
        )

    record.status = body.status
    db.commit()
    db.refresh(record)
    return record

@router.get("/students/{student_id}/attendance-summary", response_model=StudentAttendanceSummary)
def get_student_attendance_summary(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Authorization: self, admin or faculty
    if current_user.role.name == "student":
        student_profile = current_user.student
        if not student_profile or student_profile.id != student_id:
            raise HTTPException(
                status_code=403,
                detail="You are not permitted to access another student's attendance summary",
            )

    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Fetch all records for this student
    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).all()

    # Group by subject (timetable_slot -> subject)
    subject_stats = {}
    for r in records:
        subj = r.timetable_slot.subject
        if subj.id not in subject_stats:
            subject_stats[subj.id] = {
                "subject_name": subj.name,
                "subject_code": subj.code,
                "total": 0,
                "present": 0,
                "absent": 0,
                "late": 0,
            }
        
        subject_stats[subj.id]["total"] += 1
        if r.status == "present":
            subject_stats[subj.id]["present"] += 1
        elif r.status == "absent":
            subject_stats[subj.id]["absent"] += 1
        elif r.status == "late":
            subject_stats[subj.id]["late"] += 1

    summaries = []
    for subj_id, stats in subject_stats.items():
        # Present % formula: (present + late) / total. Late counts as present in most attendance tracking.
        present_weight = stats["present"] + stats["late"]
        percentage = (present_weight / stats["total"] * 100) if stats["total"] > 0 else 100.0
        
        summaries.append(
            SubjectAttendanceSummary(
                subject_id=subj_id,
                subject_name=stats["subject_name"],
                subject_code=stats["subject_code"],
                total_classes=stats["total"],
                present_count=stats["present"],
                absent_count=stats["absent"],
                late_count=stats["late"],
                percentage=round(percentage, 2),
            )
        )

    return StudentAttendanceSummary(student_id=student_id, summaries=summaries)
