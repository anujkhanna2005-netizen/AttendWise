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
