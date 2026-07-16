from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.security import require_roles
from app.database.connection import get_db
from app.models.models import AuditLog
from app.schemas.schemas import AuditLogOut

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])

@router.get(
    "",
    response_model=list[AuditLogOut],
    dependencies=[Depends(require_roles("admin"))],
)
def list_audit_logs(
    db: Session = Depends(get_db),
):
    return db.query(AuditLog).order_by(AuditLog.changed_at.desc()).all()
