# Import all models here so SQLAlchemy's metadata is populated when
# main.py or Alembic env.py imports this package.
from app.models.models import (  # noqa: F401
    Role,
    User,
    Department,
    Course,
    Subject,
    Student,
    Faculty,
    Parent,
    StudentParent,
)
