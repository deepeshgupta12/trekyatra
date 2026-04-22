from __future__ import annotations

import base64
from dataclasses import dataclass

import httpx


class WordPressClientError(Exception):
    """Raised when WordPress connectivity or response handling fails."""


@dataclass
class WordPressClientResult:
    endpoint: str
    status_code: int | None
    ok: bool
    message: str
    payload: dict | list | str | None


class WordPressClient:
    def __init__(
        self,
        *,
        base_url: str,
        username: str,
        app_password: str,
        timeout_seconds: float,
        verify_ssl: bool,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.username = username
        self.app_password = app_password
        self.timeout_seconds = timeout_seconds
        self.verify_ssl = verify_ssl

    def _build_auth_header(self) -> dict[str, str]:
        raw = f"{self.username}:{self.app_password}".encode("utf-8")
        encoded = base64.b64encode(raw).decode("utf-8")
        return {"Authorization": f"Basic {encoded}"}

    def _request(self, *, path: str, use_auth: bool) -> WordPressClientResult:
        headers: dict[str, str] = {}
        if use_auth:
            if not (self.username and self.app_password):
                raise WordPressClientError(
                    "WordPress credentials are not fully configured."
                )
            headers.update(self._build_auth_header())

        try:
            with httpx.Client(
                base_url=self.base_url,
                timeout=self.timeout_seconds,
                verify=self.verify_ssl,
                headers=headers,
            ) as client:
                response = client.get(path)
        except httpx.HTTPError as exc:
            raise WordPressClientError(
                f"Unable to connect to WordPress endpoint {path}: {exc}"
            ) from exc

        try:
            payload: dict | list | str | None = response.json()
        except ValueError:
            payload = response.text if response.text else None

        ok = 200 <= response.status_code < 300
        message = "OK" if ok else f"HTTP {response.status_code}"

        return WordPressClientResult(
            endpoint=f"{self.base_url}{path}",
            status_code=response.status_code,
            ok=ok,
            message=message,
            payload=payload,
        )

    def _try_paths(self, *, paths: list[str], use_auth: bool) -> WordPressClientResult:
        last_result: WordPressClientResult | None = None

        for path in paths:
            result = self._request(path=path, use_auth=use_auth)
            if result.ok:
                return result
            last_result = result

        if last_result is None:
            raise WordPressClientError("No WordPress paths were attempted.")

        return last_result

    def fetch_site_index(self) -> WordPressClientResult:
        return self._try_paths(
            paths=[
                "/wp-json",
                "/?rest_route=/",
            ],
            use_auth=False,
        )

    def fetch_current_user(self) -> WordPressClientResult:
        return self._try_paths(
            paths=[
                "/wp-json/wp/v2/users/me",
                "/?rest_route=/wp/v2/users/me",
            ],
            use_auth=True,
        )

    def create_post(self, *, title: str, content: str, slug: str, status: str = "draft", excerpt: str | None = None) -> WordPressClientResult:
        if not (self.username and self.app_password):
            raise WordPressClientError("WordPress credentials are not fully configured.")

        body: dict = {"title": title, "content": content, "slug": slug, "status": status}
        if excerpt:
            body["excerpt"] = excerpt

        try:
            with httpx.Client(
                base_url=self.base_url,
                timeout=self.timeout_seconds,
                verify=self.verify_ssl,
                headers=self._build_auth_header(),
            ) as client:
                response = client.post("/wp-json/wp/v2/posts", json=body)
        except httpx.HTTPError as exc:
            raise WordPressClientError(f"Unable to create WordPress post: {exc}") from exc

        try:
            payload: dict | list | str | None = response.json()
        except ValueError:
            payload = response.text if response.text else None

        ok = 200 <= response.status_code < 300
        message = "OK" if ok else f"HTTP {response.status_code}"

        return WordPressClientResult(
            endpoint=f"{self.base_url}/wp-json/wp/v2/posts",
            status_code=response.status_code,
            ok=ok,
            message=message,
            payload=payload,
        )