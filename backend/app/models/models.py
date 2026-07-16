"""
SQLAlchemy ORM models — Phase 0 schema (9 tables).

Constraint map
--------------
Unique:
  users.email
  students.roll_number
  departments.code
  subjects: unique(course_id, code)   — code is unique *per course*, not globally

ON DELETE CASCADE  (deleting a user removes its role record):
  students.user_id   → users.id
  faculty.user_id    → users.id
  parents.user_id    → users.id

ON DELETE RESTRICT (blocking — deleting a department is blocked if students exist):
  students.department_id → departments.id

ON DELETE CASCADE / SET NULL for other FKs:
  courses.department_id  → departments.id  CASCADE (department gone → courses gone)
  subjects.course_id     → courses.id       CASCADE (course gone → subjects gone)
  faculty.department_id  → departments.id  SET NULL (removing a department doesn't
                                            remove faculty records, just clears the FK)

student_parents: composite PK on (student_id, parent_id); CASCADE from both sides.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    PrimaryKeyConstraint,
    text,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.database.connection import Base


# ---------------------------------------------------------------------------
# 1. roles
# ---------------------------------------------------------------------------
class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)

    users: Mapped[list["User"]] = relationship("User", back_populates="role")

    def __repr__(self) -> str:
        return f"<Role id={self.id} name={self.name!r}>"


# ---------------------------------------------------------------------------
# 2. users
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True   # UNIQUE
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
        default=datetime.utcnow,
    )

    role: Mapped["Role"] = relationship("Role", back_populates="users")

    # CASCADE: deleting a user removes its role-specific profile record
    student: Mapped[Optional["Student"]] = relationship(
        "Student", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    faculty_profile: Mapped[Optional["Faculty"]] = relationship(
        "Faculty", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    parent: Mapped[Optional["Parent"]] = relationship(
        "Parent", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"


# ---------------------------------------------------------------------------
# 3. departments
# ---------------------------------------------------------------------------
class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)  # UNIQUE

    # CASCADE: department gone → its courses gone
    courses: Mapped[list["Course"]] = relationship(
        "Course", back_populates="department", cascade="all, delete-orphan"
    )

    # RESTRICT: cannot delete a department while students are assigned
    students: Mapped[list["Student"]] = relationship(
        "Student", back_populates="department"
    )

    # SET NULL: department deletion clears faculty.department_id but keeps faculty
    faculty_members: Mapped[list["Faculty"]] = relationship(
        "Faculty", back_populates="department"
    )

    def __repr__(self) -> str:
        return f"<Department id={self.id} code={self.code!r}>"


# ---------------------------------------------------------------------------
# 4. courses
# ---------------------------------------------------------------------------
class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    department_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("departments.id", ondelete="CASCADE"),  # dept gone → courses gone
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)

    department: Mapped["Department"] = relationship("Department", back_populates="courses")
    subjects: Mapped[list["Subject"]] = relationship(
        "Subject", back_populates="course", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Course id={self.id} code={self.code!r}>"


# ---------------------------------------------------------------------------
# 5. subjects
# ---------------------------------------------------------------------------
class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (
        UniqueConstraint("course_id", "code", name="uq_subjects_course_code"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),  # course gone → subjects gone
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)

    course: Mapped["Course"] = relationship("Course", back_populates="subjects")

    def __repr__(self) -> str:
        return f"<Subject id={self.id} code={self.code!r}>"


# ---------------------------------------------------------------------------
# 6. students
# ---------------------------------------------------------------------------
class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # CASCADE: deleting the user removes this student record
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,   # one-to-one
    )

    # RESTRICT: cannot delete a dept if students are assigned — blocks DELETE
    department_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("departments.id", ondelete="RESTRICT"),
        nullable=False,
    )

    roll_number: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True  # UNIQUE
    )

    user: Mapped["User"] = relationship("User", back_populates="student")
    department: Mapped["Department"] = relationship("Department", back_populates="students")
    student_parent_links: Mapped[list["StudentParent"]] = relationship(
        "StudentParent", back_populates="student", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Student id={self.id} roll={self.roll_number!r}>"


# ---------------------------------------------------------------------------
# 7. faculty
# ---------------------------------------------------------------------------
class Faculty(Base):
    __tablename__ = "faculty"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # CASCADE: deleting the user removes this faculty record
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,   # one-to-one
    )

    # SET NULL: department deletion does NOT block even if faculty are assigned
    department_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )

    user: Mapped["User"] = relationship("User", back_populates="faculty_profile")
    department: Mapped[Optional["Department"]] = relationship(
        "Department", back_populates="faculty_members"
    )

    def __repr__(self) -> str:
        return f"<Faculty id={self.id} user_id={self.user_id}>"


# ---------------------------------------------------------------------------
# 8. parents
# ---------------------------------------------------------------------------
class Parent(Base):
    __tablename__ = "parents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # CASCADE: deleting the user removes this parent record
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,   # one-to-one
    )

    user: Mapped["User"] = relationship("User", back_populates="parent")
    student_parent_links: Mapped[list["StudentParent"]] = relationship(
        "StudentParent", back_populates="parent", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Parent id={self.id} user_id={self.user_id}>"


# ---------------------------------------------------------------------------
# 9. student_parents  (many-to-many join table)
# ---------------------------------------------------------------------------
class StudentParent(Base):
    __tablename__ = "student_parents"
    __table_args__ = (
        PrimaryKeyConstraint("student_id", "parent_id", name="pk_student_parents"),
    )

    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )
    parent_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("parents.id", ondelete="CASCADE"),
        nullable=False,
    )

    student: Mapped["Student"] = relationship("Student", back_populates="student_parent_links")
    parent: Mapped["Parent"] = relationship("Parent", back_populates="student_parent_links")
