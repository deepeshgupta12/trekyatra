from __future__ import annotations

import base64
from dataclasses import dataclass, field

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
    total: int | None = field(default=None)
    total_pages: int | None = field(default=None)


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

    def _execute(
        self,
        *,
        method: str,
        path: str,
        use_auth: bool,
        body: dict | None = None,
    ) -> WordPressClientResult:
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
                m = method.upper()
                if m == "GET":
                    response = client.get(path)
                elif m == "POST":
                    response = client.post(path, json=body)
                elif m == "PUT":
                    response = client.put(path, json=body)
                else:
                    raise WordPressClientError(f"Unsupported HTTP method: {method}")
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

        total: int | None = None
        total_pages: int | None = None
        try:
            if "X-WP-Total" in response.headers:
                total = int(response.headers["X-WP-Total"])
            if "X-WP-TotalPages" in response.headers:
                total_pages = int(response.headers["X-WP-TotalPages"])
        except (ValueError, KeyError):
            pass

        return WordPressClientResult(
            endpoint=f"{self.base_url}{path}",
            status_code=response.status_code,
            ok=ok,
            message=message,
            payload=payload,
            total=total,
            total_pages=total_pages,
        )

    def _request(self, *, path: str, use_auth: bool) -> WordPressClientResult:
        return self._execute(method="GET", path=path, use_auth=use_auth)

    def _request_write(
        self, *, method: str, path: str, body: dict
    ) -> WordPressClientResult:
        return self._execute(method=method, path=path, use_auth=True, body=body)

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

    # ------------------------------------------------------------------
    # Existing public methods (unchanged signatures)
    # ------------------------------------------------------------------

    def fetch_site_index(self) -> WordPressClientResult:
        return self._try_paths(
            paths=["/wp-json", "/?rest_route=/"],
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

    def create_post(
        self,
        *,
        title: str,
        content: str,
        slug: str,
        status: str = "draft",
        excerpt: str | None = None,
        post_type: str = "post",
        meta: dict | None = None,
        category_ids: list[int] | None = None,
        tag_ids: list[int] | None = None,
    ) -> WordPressClientResult:
        body: dict = {
            "title": title,
            "content": content,
            "slug": slug,
            "status": status,
        }
        if excerpt:
            body["excerpt"] = excerpt
        if meta:
            body["meta"] = meta
        if category_ids:
            body["categories"] = category_ids
        if tag_ids:
            body["tags"] = tag_ids
        return self._request_write(
            method="POST",
            path=f"/wp-json/wp/v2/{post_type}",
            body=body,
        )

    # ------------------------------------------------------------------
    # New methods — Step 16
    # ------------------------------------------------------------------

    def update_post(self, post_id: int, **fields: object) -> WordPressClientResult:
        return self._request_write(
            method="PUT",
            path=f"/wp-json/wp/v2/posts/{post_id}",
            body={k: v for k, v in fields.items()},
        )

    def list_posts(
        self,
        *,
        post_type: str = "post",
        status: str = "publish",
        per_page: int = 10,
        page: int = 1,
    ) -> WordPressClientResult:
        qs = f"?status={status}&per_page={per_page}&page={page}"
        return self._request(
            path=f"/wp-json/wp/v2/{post_type}{qs}",
            use_auth=True,
        )

    def get_post(self, identifier: int | str) -> WordPressClientResult:
        if isinstance(identifier, int):
            path = f"/wp-json/wp/v2/posts/{identifier}"
        else:
            path = f"/wp-json/wp/v2/posts?slug={identifier}"
        return self._request(path=path, use_auth=True)

    def upload_media(
        self,
        *,
        filename: str,
        content: bytes,
        mime_type: str,
    ) -> WordPressClientResult:
        raise WordPressClientError(
            "upload_media is not yet implemented (pending image generation in V2)."
        )

    def ensure_category(self, name: str) -> WordPressClientResult:
        search = self._request(
            path=f"/wp-json/wp/v2/categories?search={name}&per_page=5",
            use_auth=True,
        )
        if search.ok and isinstance(search.payload, list):
            for cat in search.payload:
                if (
                    isinstance(cat, dict)
                    and cat.get("name", "").lower() == name.lower()
                ):
                    return WordPressClientResult(
                        endpoint=search.endpoint,
                        status_code=200,
                        ok=True,
                        message="OK",
                        payload=cat,
                    )
        return self._request_write(
            method="POST",
            path="/wp-json/wp/v2/categories",
            body={"name": name},
        )

    def ensure_tag(self, name: str) -> WordPressClientResult:
        search = self._request(
            path=f"/wp-json/wp/v2/tags?search={name}&per_page=5",
            use_auth=True,
        )
        if search.ok and isinstance(search.payload, list):
            for tag in search.payload:
                if (
                    isinstance(tag, dict)
                    and tag.get("name", "").lower() == name.lower()
                ):
                    return WordPressClientResult(
                        endpoint=search.endpoint,
                        status_code=200,
                        ok=True,
                        message="OK",
                        payload=tag,
                    )
        return self._request_write(
            method="POST",
            path="/wp-json/wp/v2/tags",
            body={"name": name},
        )
