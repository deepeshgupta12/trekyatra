#!/usr/bin/env python
"""Assign admin role to a user by email.

Run from project root:
    PYTHONPATH=services/api python scripts/assign_admin.py --email you@example.com [--role admin]
"""
import argparse
import sys
sys.path.insert(0, "services/api")

from app.db.session import SessionLocal
from app.modules.auth.service import get_user_by_email
from app.modules.rbac.service import assign_role_to_user, seed_roles


def main() -> None:
    parser = argparse.ArgumentParser(description="Assign a role to a user by email.")
    parser.add_argument("--email", required=True, help="User email address")
    parser.add_argument("--role", default="admin", help="Role slug (default: admin)")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        seed_roles(db)
        user = get_user_by_email(db, args.email)
        if not user:
            print(f"User not found: {args.email}", file=sys.stderr)
            sys.exit(1)
        role = assign_role_to_user(db, user.id, args.role)
        db.commit()
        print(f"Assigned role '{role.name}' to {args.email} (user_id={user.id})")
    except Exception as exc:
        db.rollback()
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
