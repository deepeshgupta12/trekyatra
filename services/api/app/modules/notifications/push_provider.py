"""
FCM HTTP v1 + APNs HTTP/2 push providers.
When credentials are not configured, provider runs in test mode:
  - push calls are recorded in mobile_push_log but not actually sent.
"""
from __future__ import annotations

import json
import logging

logger = logging.getLogger(__name__)

_TEST_MODE_WARNED = False


def _warn_test_mode(provider: str) -> None:
    global _TEST_MODE_WARNED
    if not _TEST_MODE_WARNED:
        logger.warning(
            "[push] %s credentials not configured — running in test mode. "
            "Set %s env vars to enable real push delivery.",
            provider,
            "FIREBASE_SERVICE_ACCOUNT_JSON" if provider == "FCM" else "APNS_KEY_ID + APNS_TEAM_ID + APNS_KEY_P8",
        )
        _TEST_MODE_WARNED = True


class FCMProvider:
    """Firebase Cloud Messaging HTTP v1 API.

    Requires FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON string for the service account).
    Falls back to test mode (no-op send) when not set.
    """

    def __init__(self, service_account_json: str | None = None) -> None:
        self._project_id: str | None = None
        self._sa_json: str | None = service_account_json
        self._test_mode = service_account_json is None

        if not self._test_mode:
            try:
                sa = json.loads(service_account_json)  # type: ignore[arg-type]
                self._project_id = sa.get("project_id")
            except Exception:
                logger.warning("[push] FCM service account JSON is invalid — falling back to test mode")
                self._test_mode = True

    async def send(self, fcm_token: str, title: str, body: str, data: dict) -> bool:
        if self._test_mode:
            _warn_test_mode("FCM")
            logger.info("[push:test] FCM send to token=%s title=%r", fcm_token[:12] + "...", title)
            return True

        try:
            import httpx
            from google.oauth2 import service_account
            from google.auth.transport.requests import Request as GRequest

            sa = json.loads(self._sa_json)  # type: ignore[arg-type]
            creds = service_account.Credentials.from_service_account_info(
                sa, scopes=["https://www.googleapis.com/auth/firebase.messaging"]
            )
            creds.refresh(GRequest())
            token = creds.token

            payload = {
                "message": {
                    "token": fcm_token,
                    "notification": {"title": title, "body": body},
                    "data": {k: str(v) for k, v in data.items()},
                    "android": {"priority": "high"},
                }
            }
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"https://fcm.googleapis.com/v1/projects/{self._project_id}/messages:send",
                    json=payload,
                    headers={"Authorization": f"Bearer {token}"},
                )
                if resp.status_code != 200:
                    logger.warning("[push] FCM send failed: %s %s", resp.status_code, resp.text[:200])
                return resp.status_code == 200
        except ImportError:
            logger.error("[push] google-auth / httpx not installed — cannot send real FCM push")
            return False
        except Exception as exc:
            logger.error("[push] FCM error: %s", exc)
            return False


class APNsProvider:
    """Apple Push Notification service HTTP/2.

    Requires APNS_KEY_ID + APNS_TEAM_ID + APNS_KEY_P8.
    Falls back to test mode when not set.
    """

    def __init__(
        self,
        key_id: str | None = None,
        team_id: str | None = None,
        key_p8: str | None = None,
        bundle_id: str = "co.trekyatra.app",
    ) -> None:
        self._key_id = key_id
        self._team_id = team_id
        self._key_p8 = key_p8
        self._bundle_id = bundle_id
        self._test_mode = not (key_id and team_id and key_p8)

    async def send(self, apns_token: str, title: str, body: str, data: dict) -> bool:
        if self._test_mode:
            _warn_test_mode("APNs")
            logger.info("[push:test] APNs send to token=%s title=%r", apns_token[:12] + "...", title)
            return True

        try:
            import httpx
            import jwt as pyjwt
            import time

            claims = {
                "iss": self._team_id,
                "iat": int(time.time()),
            }
            token = pyjwt.encode(claims, self._key_p8, algorithm="ES256", headers={"kid": self._key_id})

            payload = {
                "aps": {
                    "alert": {"title": title, "body": body},
                    "sound": "default",
                    "badge": 1,
                },
                **data,
            }
            headers = {
                "authorization": f"bearer {token}",
                "apns-topic": self._bundle_id,
                "apns-push-type": "alert",
                "apns-priority": "10",
            }
            async with httpx.AsyncClient(http2=True, timeout=10) as client:
                resp = await client.post(
                    f"https://api.push.apple.com/3/device/{apns_token}",
                    json=payload,
                    headers=headers,
                )
                if resp.status_code != 200:
                    logger.warning("[push] APNs send failed: %s %s", resp.status_code, resp.text[:200])
                return resp.status_code == 200
        except ImportError:
            logger.error("[push] httpx[http2] or PyJWT not installed — cannot send real APNs push")
            return False
        except Exception as exc:
            logger.error("[push] APNs error: %s", exc)
            return False


def get_fcm_provider() -> FCMProvider:
    from app.core.config import settings
    return FCMProvider(settings.firebase_service_account_json)


def get_apns_provider() -> APNsProvider:
    from app.core.config import settings
    return APNsProvider(
        key_id=settings.apns_key_id,
        team_id=settings.apns_team_id,
        key_p8=settings.apns_key_p8,
        bundle_id=settings.apns_bundle_id,
    )
