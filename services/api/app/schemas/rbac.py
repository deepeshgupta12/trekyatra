from __future__ import annotations

import uuid

from pydantic import BaseModel, EmailStr


class RoleResponse(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    description: str | None = None
    is_system: bool

    model_config = {"from_attributes": True}


class RoleAssignRequest(BaseModel):
    role_slug: str


class UserWithRolesResponse(BaseModel):
    id: uuid.UUID
    email: str | None
    full_name: str | None
    is_active: bool
    is_superuser: bool
    roles: list[RoleResponse] = []

    model_config = {"from_attributes": True}
