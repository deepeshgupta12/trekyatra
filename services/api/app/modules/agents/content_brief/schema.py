from __future__ import annotations

from typing import TypedDict


class HeadingNode(TypedDict):
    level: str
    text: str
    notes: str


class FaqItem(TypedDict):
    question: str
    answer_hint: str


class MonetizationSlot(TypedDict):
    location: str
    type: str
    notes: str


class BriefStructure(TypedDict):
    page_objective: str
    audience: str
    target_keyword: str
    secondary_keywords: list[str]
    heading_structure: list[HeadingNode]
    faqs: list[FaqItem]
    key_entities: list[str]
    internal_link_targets: list[str]
    schema_recommendations: list[str]
    monetization_slots: list[MonetizationSlot]
    freshness_interval_days: int
    word_count_target: int
    editorial_brief_markdown: str
