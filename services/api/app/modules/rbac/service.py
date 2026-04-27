from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.models import User
from app.modules.rbac.associations import user_roles
from app.modules.rbac.models import Role

# ──────────────────────────────────────────────────────────────────────────────
# Default role definitions (slug → name, description)
# ──────────────────────────────────────────────────────────────────────────────

_DEFAULT_ROLES = [
    {
        "slug": "super_admin",
        "name": "Super Admin",
        "description": "Full access to all resources including user management.",
        "is_system": True,
    },
    {
        "slug": "admin",
        "name": "Admin",
        "description": "Full access to all content and publishing workflows.",
        "is_system": True,
    },
    {
        "slug": "editor",
        "name": "Editor",
        "description": "Create and edit content; approve and publish drafts.",
        "is_system": True,
    },
    {
        "slug": "reviewer",
        "name": "Reviewer",
        "description": "Read access; approve or reject briefs and drafts only.",
        "is_system": True,
    },
    {
        "slug": "content_ops",
        "name": "Content Ops",
        "description": "Create topics and clusters; no publishing rights.",
        "is_system": True,
    },
]


def seed_roles(db: Session) -> list[Role]:
    """Idempotently create default system roles."""
    created: list[Role] = []
    for role_data in _DEFAULT_ROLES:
        existing = db.scalar(select(Role).where(Role.slug == role_data["slug"]))
        if not existing:
            role = Role(**role_data)
            db.add(role)
            created.append(role)
    db.flush()
    return created


def get_role_by_slug(db: Session, slug: str) -> Role | None:
    return db.scalar(select(Role).where(Role.slug == slug))


def get_user_roles(db: Session, user_id: uuid.UUID) -> list[Role]:
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        return []
    return list(user.roles)


def assign_role_to_user(db: Session, user_id: uuid.UUID, role_slug: str) -> Role:
    role = get_role_by_slug(db, role_slug)
    if not role:
        raise ValueError(f"Role '{role_slug}' does not exist.")

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise ValueError("User not found.")

    if role not in user.roles:
        user.roles.append(role)
        db.flush()

    return role


def revoke_role_from_user(db: Session, user_id: uuid.UUID, role_slug: str) -> None:
    role = get_role_by_slug(db, role_slug)
    if not role:
        raise ValueError(f"Role '{role_slug}' does not exist.")

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise ValueError("User not found.")

    if role in user.roles:
        user.roles.remove(role)
        db.flush()


def list_users_with_roles(db: Session, limit: int = 100) -> list[User]:
    statement = select(User).order_by(User.created_at.desc()).limit(limit)
    return list(db.scalars(statement).all())
