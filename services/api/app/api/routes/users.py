import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.rbac.service import (
    assign_role_to_user,
    list_users_with_roles,
    revoke_role_from_user,
)
from app.schemas.rbac import RoleAssignRequest, RoleResponse, UserWithRolesResponse

router = APIRouter(
    prefix="/admin/users",
    tags=["users"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=list[UserWithRolesResponse])
def list_users(db: Session = Depends(get_db)) -> list[UserWithRolesResponse]:
    return list_users_with_roles(db)


@router.post("/{user_id}/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def assign_role(
    user_id: uuid.UUID,
    body: RoleAssignRequest,
    db: Session = Depends(get_db),
) -> RoleResponse:
    try:
        role = assign_role_to_user(db, user_id, body.role_slug)
        db.commit()
        return role
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/{user_id}/roles/{role_slug}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_role(
    user_id: uuid.UUID,
    role_slug: str,
    db: Session = Depends(get_db),
) -> None:
    try:
        revoke_role_from_user(db, user_id, role_slug)
        db.commit()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
