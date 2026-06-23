"""M14 Push Notification Tests — TC-B-M14-01 through TC-B-M14-05."""
from __future__ import annotations

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.modules.auth.models import User
from app.modules.mobile.models import MobileDevice
from app.modules.notifications.models import MobilePushLog
from app.modules.notifications.push_provider import FCMProvider, APNsProvider
from app.modules.notifications import service as notif_service

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_user(db) -> User:
    user = db.query(User).filter(User.email == "pushtest@trekyatra.com").first()
    if not user:
        user = User(email="pushtest@trekyatra.com", full_name="Push Test", is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def test_device_android(db, test_user) -> MobileDevice:
    device = (
        db.query(MobileDevice)
        .filter(MobileDevice.device_id == "test-android-push-device")
        .first()
    )
    if not device:
        device = MobileDevice(
            user_id=test_user.id,
            device_id="test-android-push-device",
            platform="android",
            fcm_token="fake-fcm-token-android-001",
        )
        db.add(device)
        db.commit()
        db.refresh(device)
    return device


@pytest.fixture
def test_device_ios(db, test_user) -> MobileDevice:
    device = (
        db.query(MobileDevice)
        .filter(MobileDevice.device_id == "test-ios-push-device")
        .first()
    )
    if not device:
        device = MobileDevice(
            user_id=test_user.id,
            device_id="test-ios-push-device",
            platform="ios",
            apns_token="fake-apns-token-ios-001",
        )
        db.add(device)
        db.commit()
        db.refresh(device)
    return device


# TC-B-M14-01: FCM test-mode send returns True without real credentials
def test_fcm_test_mode_send():
    provider = FCMProvider(service_account_json=None)
    assert provider._test_mode is True
    result = asyncio.run(provider.send("fake-token", "Test Title", "Test body", {"trek_slug": "kedarkantha"}))
    assert result is True


# TC-B-M14-02: APNs test-mode send returns True without real credentials
def test_apns_test_mode_send():
    provider = APNsProvider(key_id=None, team_id=None, key_p8=None)
    assert provider._test_mode is True
    result = asyncio.run(provider.send("fake-apns-token", "Test Title", "Test body", {}))
    assert result is True


# TC-B-M14-03: send_push logs a MobilePushLog entry in DB
def test_push_log_created_on_send(db, test_device_android):
    initial_count = db.query(MobilePushLog).filter(
        MobilePushLog.device_id == test_device_android.id
    ).count()

    # Patch FCM provider to avoid real HTTP call
    with patch("app.modules.notifications.service.get_fcm_provider") as mock_fcm:
        mock_provider = MagicMock()
        mock_provider.send = AsyncMock(return_value=True)
        mock_fcm.return_value = mock_provider

        result = asyncio.run(
            notif_service.send_push(
                db,
                test_device_android,
                "Permit alert",
                "Kedarkantha permit opens tomorrow",
                {"trek_slug": "kedarkantha"},
                "permit_alert",
            )
        )

    assert result is True
    new_count = db.query(MobilePushLog).filter(
        MobilePushLog.device_id == test_device_android.id
    ).count()
    assert new_count == initial_count + 1

    latest = (
        db.query(MobilePushLog)
        .filter(MobilePushLog.device_id == test_device_android.id)
        .order_by(MobilePushLog.sent_at.desc())
        .first()
    )
    assert latest.category == "permit_alert"
    assert latest.status == "sent"
    assert "Kedarkantha" in latest.body


# TC-B-M14-04: send_batch_push returns correct counts
def test_send_batch_push_counts(db, test_device_android, test_device_ios):
    with patch("app.modules.notifications.service.get_fcm_provider") as mock_fcm, \
         patch("app.modules.notifications.service.get_apns_provider") as mock_apns:
        mock_fcm.return_value.send = AsyncMock(return_value=True)
        mock_apns.return_value.send = AsyncMock(return_value=True)

        result = asyncio.run(
            notif_service.send_batch_push(
                db,
                [test_device_android, test_device_ios],
                "Season alert",
                "Best time for Hampta Pass",
                {"trek_slug": "hampta-pass"},
                "seasonal_alert",
            )
        )

    assert result["sent"] == 2
    assert result["failed"] == 0
    assert result["skipped"] == 0


# TC-B-M14-05: device without any token is skipped in batch
def test_send_batch_push_skips_tokenless_device(db, test_user):
    tokenless = MobileDevice(
        user_id=test_user.id,
        device_id="test-tokenless-device",
        platform="android",
        fcm_token=None,
        apns_token=None,
    )
    db.add(tokenless)
    db.commit()
    db.refresh(tokenless)

    try:
        result = asyncio.run(
            notif_service.send_batch_push(
                db,
                [tokenless],
                "Test",
                "Test body",
                {},
                "test",
            )
        )
        assert result["skipped"] == 1
        assert result["sent"] == 0
    finally:
        db.delete(tokenless)
        db.commit()
