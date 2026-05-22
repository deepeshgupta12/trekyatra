"""Shared Anthropic client factory for all agents.

max_retries=10 gives ~4 minutes of exponential backoff (0.5→1→2→4→8→16→16→16→16→16 s).
This is combined with stage-level retry in pipeline/service.py for severe overload scenarios
where even 4 minutes of SDK retry is insufficient.
"""
from __future__ import annotations

import anthropic

from app.core.config import settings


def get_anthropic_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(
        api_key=settings.anthropic_api_key,
        max_retries=10,  # increased from 6 → ~4 min total backoff for 529 overloaded errors
    )
