"""POST /auth/register, POST /auth/login, POST /auth/refresh"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.database.connection import get_db
from app.models.models import Role, User, Student, Parent
from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse, RefreshRequest

router = APIRouter(prefix="/auth", tags=["auth"])

_SELF_REGISTER_ROLES = {"student", "parent"}


from fastapi import Request
from app.auth.security import decode_token, require_roles

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    # If registering a role other than student/parent, verify that requester is authenticated as admin
    if body.role not in _SELF_REGISTER_ROLES:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Registration of administrative/faculty roles requires admin Authorization headers",
            )
        token = auth_header.split(" ")[1]
        try:
            payload = decode_token(token)
            role_name = payload.get("role")
            if role_name != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only administrative users can register faculty accounts",
                )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token or authentication parameters",
            ) from exc



    role = db.query(Role).filter(Role.name == body.role).first()
    if not role:
        raise HTTPException(status_code=500, detail=f"Role '{body.role}' not seeded in DB")

    # Student-specific validation
    if body.role == "student":
        if not body.roll_number or not body.department_id:
            raise HTTPException(
                status_code=400,
                detail="Students must supply roll_number and department_id",
            )

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        role_id=role.id,
    )
    db.add(user)

    try:
        db.flush()  # get user.id without committing yet
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create the role-specific profile record
    if body.role == "student":
        profile = Student(
            user_id=user.id,
            department_id=body.department_id,
            roll_number=body.roll_number,
        )
        db.add(profile)
    elif body.role == "parent":
        profile = Parent(user_id=user.id)
        db.add(profile)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc.orig)) from exc

    return TokenResponse(
        access_token=create_access_token(user.id, role.name),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return TokenResponse(
        access_token=create_access_token(user.id, user.role.name),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Expected refresh token")

    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(user.id, user.role.name),
        refresh_token=create_refresh_token(user.id),
    )
