from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.buddies import service
from app.modules.buddies.schemas import (
    BuddyCountOut,
    BuddyRequestIn,
    BuddyRequestOut,
    BuddyResponseIn,
    ChatMessageIn,
    ChatMessageOut,
    SignalIn,
    SignalOut,
    TrekkerProfileOut,
)

# ── Public routes ──────────────────────────────────────────────────────────────
public_router = APIRouter(tags=["buddies-public"])


@public_router.get("/public/treks/{slug}/buddy-count", response_model=BuddyCountOut)
def get_buddy_count(slug: str, db: Session = Depends(get_db)):
    return service.get_buddy_count(db, slug)


@public_router.get("/public/trekkers/{signal_id}", response_model=TrekkerProfileOut)
def get_trekker_profile(signal_id: uuid.UUID, db: Session = Depends(get_db)):
    return service.get_trekker_profile(db, signal_id)


# ── Auth-required routes ───────────────────────────────────────────────────────
auth_router = APIRouter(tags=["buddies"])


@auth_router.get("/buddies/signals/{trek_slug}", response_model=list[SignalOut])
def list_signals(
    trek_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.list_signals_for_trek(db, trek_slug, current_user.id)


@auth_router.post("/buddies/signals", response_model=SignalOut, status_code=status.HTTP_201_CREATED)
def create_signal(
    data: SignalIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.create_or_replace_signal(db, current_user.id, data)


@auth_router.delete("/buddies/signals/{signal_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_signal(
    signal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.deactivate_signal(db, signal_id, current_user.id)


# CRITICAL: static paths (/received, /sent) MUST come before dynamic path (/{id})
@auth_router.get("/buddies/requests/received", response_model=list[BuddyRequestOut])
def list_received(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.list_received_requests(db, current_user.id)


@auth_router.get("/buddies/requests/sent", response_model=list[BuddyRequestOut])
def list_sent(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.list_sent_requests(db, current_user.id)


@auth_router.post("/buddies/requests", response_model=BuddyRequestOut, status_code=status.HTTP_201_CREATED)
def send_request(
    data: BuddyRequestIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.send_request(db, current_user.id, data)


@auth_router.patch("/buddies/requests/{request_id}", response_model=BuddyRequestOut)
def respond_to_request(
    request_id: uuid.UUID,
    data: BuddyResponseIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.respond_to_request(db, request_id, current_user.id, data)


# CRITICAL: /messages/read (static) before /messages/{id} (dynamic) — no {id} here but ordering is still correct
@auth_router.post("/buddies/requests/{request_id}/messages/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.mark_messages_read(db, request_id, current_user.id)


@auth_router.get("/buddies/requests/{request_id}/messages", response_model=list[ChatMessageOut])
def get_messages(
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.get_chat_messages(db, request_id, current_user.id)


@auth_router.post(
    "/buddies/requests/{request_id}/messages",
    response_model=ChatMessageOut,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    request_id: uuid.UUID,
    data: ChatMessageIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.send_chat_message(db, request_id, current_user.id, data)
