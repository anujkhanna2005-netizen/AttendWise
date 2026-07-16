"""
Seed script — inserts the four base roles and one admin account.
Run once after migration:  python -m app.database.seed

Faculty accounts must be created by an admin via a future admin panel (Phase 1+).
"""

import sys
import os

# Allow running as  python -m app.database.seed  from /backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.database.connection import SessionLocal
from app.models.models import Role, User, Faculty  # noqa: F401 – ensure models are registered
from app.auth.security import hash_password

ROLES = ["admin", "faculty", "student", "parent"]

# ---------------------------------------------------------------------------
# Seed data — passwords MUST be overridden via env vars in production.
# These are development defaults only.
# ---------------------------------------------------------------------------
SEED_USERS = [
    {
        "email": os.getenv("SEED_ADMIN_EMAIL", "admin@attendwise.local"),
        "password": os.getenv("SEED_ADMIN_PASSWORD", "admin_change_me_123"),
        "role": "admin",
    },
    {
        "email": os.getenv("SEED_FACULTY_EMAIL", "faculty@attendwise.local"),
        "password": os.getenv("SEED_FACULTY_PASSWORD", "faculty_change_me_123"),
        "role": "faculty",
        "department_id": None,   # no department assigned at seed time
    },
]


def seed():
    db = SessionLocal()
    try:
        # 1. Roles
        role_map: dict[str, Role] = {}
        for name in ROLES:
            existing = db.query(Role).filter(Role.name == name).first()
            if not existing:
                r = Role(name=name)
                db.add(r)
                db.flush()
                role_map[name] = r
                print(f"  [+] Role created: {name}")
            else:
                role_map[name] = existing
                print(f"  [=] Role exists:  {name}")

        db.commit()

        # 2. Admin & faculty seed accounts
        for seed_data in SEED_USERS:
            existing = db.query(User).filter(User.email == seed_data["email"]).first()
            if existing:
                print(f"  [=] User exists:  {seed_data['email']}")
                continue

            role = role_map[seed_data["role"]]
            user = User(
                email=seed_data["email"],
                hashed_password=hash_password(seed_data["password"]),
                role_id=role.id,
            )
            db.add(user)
            db.flush()

            # Create faculty profile record if role is faculty
            if seed_data["role"] == "faculty":
                faculty_profile = Faculty(
                    user_id=user.id,
                    department_id=seed_data.get("department_id"),
                )
                db.add(faculty_profile)

            db.commit()
            print(f"  [+] User created:  {seed_data['email']} (role={seed_data['role']})")

        print("\nSeed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
