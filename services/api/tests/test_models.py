from app.db.base import Base


def test_expected_tables_present() -> None:
    expected_tables = {
        "users",
        "auth_identities",
        "user_sessions",
        "roles",
        "permissions",
        "user_roles",
        "role_permissions",
    }
    assert expected_tables.issubset(set(Base.metadata.tables.keys()))