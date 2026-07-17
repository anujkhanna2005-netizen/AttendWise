"""Pydantic schemas for request validation and response serialization."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = Field(description="'student' or 'parent' (self-registration only)")

    # student-only optional fields
    roll_number: str | None = None
    department_id: int | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ---------------------------------------------------------------------------
# Role
# ---------------------------------------------------------------------------
class RoleOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: RoleOut
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Department
# ---------------------------------------------------------------------------
class DepartmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    code: str = Field(min_length=1, max_length=20)


class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Course
# ---------------------------------------------------------------------------
class CourseCreate(BaseModel):
    department_id: int
    name: str = Field(min_length=1, max_length=255)
    code: str = Field(min_length=1, max_length=50)


class CourseOut(BaseModel):
    id: int
    department_id: int
    name: str
    code: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Subject
# ---------------------------------------------------------------------------
class SubjectCreate(BaseModel):
    course_id: int
    name: str = Field(min_length=1, max_length=255)
    code: str = Field(min_length=1, max_length=50)


class SubjectOut(BaseModel):
    id: int
    course_id: int
    name: str
    code: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Student
# ---------------------------------------------------------------------------
class StudentOut(BaseModel):
    id: int
    user_id: int
    department_id: int
    roll_number: str
    user: UserOut

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Faculty
# ---------------------------------------------------------------------------
class FacultyOut(BaseModel):
    id: int
    user_id: int
    department_id: int | None
    user: UserOut

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Parent
# ---------------------------------------------------------------------------
class ParentStudentsOut(BaseModel):
    parent_id: int
    students: list[StudentOut]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    version: str


# ---------------------------------------------------------------------------
# Semesters
# ---------------------------------------------------------------------------
class SemesterCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    number: int = Field(ge=1, le=8)


class SemesterOut(BaseModel):
    id: int
    name: str
    number: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Enrollments
# ---------------------------------------------------------------------------
class EnrollmentCreate(BaseModel):
    student_id: int
    subject_id: int
    semester_id: int


class EnrollmentOut(BaseModel):
    student_id: int
    subject_id: int
    semester_id: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Faculty Assignments
# ---------------------------------------------------------------------------
class FacultyAssignmentCreate(BaseModel):
    faculty_id: int
    subject_id: int
    semester_id: int


class FacultyAssignmentOut(BaseModel):
    faculty_id: int
    subject_id: int
    semester_id: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Audit Logs
# ---------------------------------------------------------------------------
class AuditLogOut(BaseModel):
    id: int
    table_name: str
    row_id: str
    action: str
    old_data: dict | None = None
    new_data: dict | None = None
    changed_by: int | None = None
    changed_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Timetable Slots
# ---------------------------------------------------------------------------
import datetime as dt

class TimetableSlotCreate(BaseModel):
    faculty_id: int
    subject_id: int
    semester_id: int
    room: str = Field(min_length=1, max_length=50)
    day_of_week: int = Field(ge=0, le=6)
    start_time: dt.time
    end_time: dt.time


class TimetableSlotOut(BaseModel):
    id: int
    faculty_id: int
    subject_id: int
    semester_id: int
    room: str
    day_of_week: int
    start_time: dt.time
    end_time: dt.time

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Attendance Records
# ---------------------------------------------------------------------------
class AttendanceRecordCreate(BaseModel):
    student_id: int
    timetable_slot_id: int
    date: dt.date
    status: str = Field(min_length=1, max_length=20) # present/absent/late


class AttendanceRecordUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=20)


class AttendanceRecordOut(BaseModel):
    id: int
    student_id: int
    timetable_slot_id: int
    date: dt.date
    status: str
    marked_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubjectAttendanceSummary(BaseModel):
    subject_id: int
    subject_name: str
    subject_code: str
    total_classes: int
    present_count: int
    absent_count: int
    late_count: int
    percentage: float


class StudentAttendanceSummary(BaseModel):
    student_id: int
    summaries: list[SubjectAttendanceSummary]



