#!/usr/bin/env python
"""Seed default RBAC roles into the database.

Run from project root:
    PYTHONPATH=services/api python scripts/seed_roles.py
"""
import sys
sys.path.insert(0, "services/api")

from app.db.session import SessionLocal
from app.modules.rbac.service import seed_roles


def main() -> None:
    db = SessionLocal()
    try:
        created = seed_roles(db)
        db.commit()
        if created:
            print(f"Created {len(created)} roles: {[r.slug for r in created]}")
        else:
            print("All roles already exist — nothing to do.")
    except Exception as exc:
        db.rollback()
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
