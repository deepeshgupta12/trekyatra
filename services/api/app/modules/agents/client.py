"""Shared Anthropic client factory for all agents.

max_retries=6 gives ~32 s of exponential backoff (0.5→1→2→4→8→8 s),
which is sufficient to survive transient 529 overloaded errors during peak
Anthropic API usage without failing the whole pipeline run.
"""
from __future__ import annotations

import anthropic

from app.core.config import settings


def get_anthropic_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(
        api_key=settings.anthropic_api_key,
        max_retries=6,
    )
