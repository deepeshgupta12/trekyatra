from __future__ import annotations

import uuid

from pydantic import BaseModel


class TranslateRequest(BaseModel):
    target_language: str  # "hi" or "mr"
    force: bool = False   # when True: re-run translation even if one already exists


class TranslateResponse(BaseModel):
    source_slug: str
    target_language: str
    page_id: str | None = None
    page_slug: str | None = None
    message: str
    fallback: bool = False
