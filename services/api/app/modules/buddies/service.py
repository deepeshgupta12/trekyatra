from __future__ import annotations

import uuid
from calendar import monthrange
from datetime import date, datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.auth.models import User
from app.modules.account.models import UserProfile
from app.modules.mobile.models import UserTrekHistory
from app.modules.buddies.models import BuddyChatMessage, BuddyRequest, BuddySignal
from app.modules.buddies.schemas import (
    BuddyCountOut,
    BuddyRequestIn,
    BuddyRequestOut,
    BuddyResponseIn,
    ChatMessageIn,
    ChatMessageOut,
    MonthCount,
    SignalIn,
    SignalOut,
    TrekkerProfileOut,
)


def _display_name(user: User) -> str:
    name = user.display_name or user.full_name or "Trekker"
    parts = name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[-1][0]}."
    return parts[0] if parts else "Trekker"


def _get_profile(db: Session, user_id: uuid.UUID) -> UserProfile | None:
    return db.query(UserProfile).filter(UserProfile.user_id == user_id).first()


def _signal_to_out(signal: BuddySignal, user: User, profile: UserProfile | None, requesting_user_id: uuid.UUID | None) -> SignalOut:
    return SignalOut(
        id=signal.id,
        display_name=_display_name(user),
        avatar_url=profile.avatar_url if profile else None,
        trek_slug=signal.trek_slug,
        month_year=signal.month_year,
        group_size=signal.group_size,
        experience=signal.experience,
        notes=signal.notes,
        is_own=(signal.user_id == requesting_user_id) if requesting_user_id else False,
        created_at=signal.created_at,
    )


def _expires_at_for_month(month_year: str) -> date:
    year, month = int(month_year[:4]), int(month_year[5:7])
    last_day = monthrange(year, month)[1]
    end_of_month = date(year, month, last_day)
    # expires 30 days after month end
    from datetime import timedelta
    return end_of_month + timedelta(days=30)


# ── Public endpoints ──────────────────────────────────────────────────────────

def get_buddy_count(db: Session, trek_slug: str) -> BuddyCountOut:
    today = date.today()
    rows = (
        db.query(BuddySignal.month_year, func.count(BuddySignal.id))
        .filter(
            BuddySignal.trek_slug == trek_slug,
            BuddySignal.active == True,
            BuddySignal.expires_at >= today,
        )
        .group_by(BuddySignal.month_year)
        .order_by(BuddySignal.month_year)
        .all()
    )
    total = sum(r[1] for r in rows)
    months = [MonthCount(month_year=r[0], count=r[1]) for r in rows]
    return BuddyCountOut(count=total, upcoming_months=months)


def get_trekker_profile(db: Session, signal_id: uuid.UUID) -> TrekkerProfileOut:
    signal = db.query(BuddySignal).filter(BuddySignal.id == signal_id).first()
    if not signal:
        raise HTTPException(404, "Signal not found")

    user = db.query(User).filter(User.id == signal.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    profile = _get_profile(db, signal.user_id)
    trek_count = db.query(func.count(UserTrekHistory.id)).filter(UserTrekHistory.user_id == signal.user_id).scalar() or 0
    joined_year = user.created_at.year if user.created_at else datetime.now(timezone.utc).year

    return TrekkerProfileOut(
        display_name=_display_name(user),
        avatar_url=profile.avatar_url if profile else None,
        bio=profile.bio if profile else None,
        experience=profile.trek_experience if profile else None,
        trek_count=trek_count,
        joined_year=joined_year,
        signal_id=signal.id,
        trek_slug=signal.trek_slug,
        month_year=signal.month_year,
    )


# ── Signals ───────────────────────────────────────────────────────────────────

def list_signals_for_trek(db: Session, trek_slug: str, requesting_user_id: uuid.UUID) -> list[SignalOut]:
    today = date.today()
    signals = (
        db.query(BuddySignal)
        .filter(
            BuddySignal.trek_slug == trek_slug,
            BuddySignal.active == True,
            BuddySignal.expires_at >= today,
        )
        .order_by(BuddySignal.created_at.desc())
        .all()
    )
    result = []
    for signal in signals:
        user = db.query(User).filter(User.id == signal.user_id).first()
        if not user:
            continue
        profile = _get_profile(db, signal.user_id)
        result.append(_signal_to_out(signal, user, profile, requesting_user_id))
    return result


def create_or_replace_signal(db: Session, user_id: uuid.UUID, data: SignalIn) -> SignalOut:
    # Upsert: update existing signal in place or create new one
    existing = (
        db.query(BuddySignal)
        .filter(
            BuddySignal.user_id == user_id,
            BuddySignal.trek_slug == data.trek_slug,
            BuddySignal.month_year == data.month_year,
        )
        .first()
    )
    if existing:
        existing.group_size = data.group_size
        existing.experience = data.experience
        existing.notes = data.notes
        existing.active = True
        existing.expires_at = _expires_at_for_month(data.month_year)
        db.commit()
        db.refresh(existing)
        signal = existing
    else:
        signal = BuddySignal(
            user_id=user_id,
            trek_slug=data.trek_slug,
            month_year=data.month_year,
            group_size=data.group_size,
            experience=data.experience,
            notes=data.notes,
            active=True,
            expires_at=_expires_at_for_month(data.month_year),
        )
        db.add(signal)
        db.commit()
        db.refresh(signal)

    user = db.query(User).filter(User.id == user_id).first()
    profile = _get_profile(db, user_id)
    return _signal_to_out(signal, user, profile, user_id)


def deactivate_signal(db: Session, signal_id: uuid.UUID, user_id: uuid.UUID) -> None:
    signal = db.query(BuddySignal).filter(BuddySignal.id == signal_id, BuddySignal.user_id == user_id).first()
    if not signal:
        raise HTTPException(404, "Signal not found or not yours")
    signal.active = False
    db.commit()


def expire_signals(db: Session) -> int:
    today = date.today()
    expired = (
        db.query(BuddySignal)
        .filter(BuddySignal.active == True, BuddySignal.expires_at < today)
        .all()
    )
    for s in expired:
        s.active = False
    db.commit()
    return len(expired)


# ── Requests ─────────────────────────────────────────────────────────────────

def _build_request_out(req: BuddyRequest, db: Session, perspective_user_id: uuid.UUID) -> BuddyRequestOut:
    other_id = req.receiver_id if req.sender_id == perspective_user_id else req.sender_id
    other_user = db.query(User).filter(User.id == other_id).first()
    other_profile = _get_profile(db, other_id) if other_user else None
    signal = db.query(BuddySignal).filter(BuddySignal.id == req.signal_id).first()
    sig_user = db.query(User).filter(User.id == signal.user_id).first() if signal else None
    sig_profile = _get_profile(db, signal.user_id) if signal else None

    signal_out = _signal_to_out(signal, sig_user, sig_profile, perspective_user_id) if signal and sig_user else SignalOut(
        id=req.signal_id, display_name="Unknown", trek_slug="", month_year="", group_size=1, created_at=req.created_at
    )

    return BuddyRequestOut(
        id=req.id,
        signal=signal_out,
        other_party_name=_display_name(other_user) if other_user else "Trekker",
        other_party_avatar=other_profile.avatar_url if other_profile else None,
        message=req.message,
        status=req.status,
        trek_slug=signal.trek_slug if signal else "",
        month_year=signal.month_year if signal else "",
        created_at=req.created_at,
        responded_at=req.responded_at,
    )


def send_request(db: Session, sender_id: uuid.UUID, data: BuddyRequestIn) -> BuddyRequestOut:
    signal = db.query(BuddySignal).filter(BuddySignal.id == data.signal_id, BuddySignal.active == True).first()
    if not signal:
        raise HTTPException(404, "Signal not found or expired")
    if signal.user_id == sender_id:
        raise HTTPException(400, "Cannot send a request to your own signal")

    existing = db.query(BuddyRequest).filter(
        BuddyRequest.sender_id == sender_id,
        BuddyRequest.signal_id == data.signal_id,
    ).first()
    if existing:
        raise HTTPException(409, "You already sent a request to this signal")

    req = BuddyRequest(
        sender_id=sender_id,
        receiver_id=signal.user_id,
        signal_id=signal.id,
        message=data.message,
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return _build_request_out(req, db, sender_id)


def list_received_requests(db: Session, user_id: uuid.UUID) -> list[BuddyRequestOut]:
    reqs = db.query(BuddyRequest).filter(BuddyRequest.receiver_id == user_id).order_by(BuddyRequest.created_at.desc()).all()
    return [_build_request_out(r, db, user_id) for r in reqs]


def list_sent_requests(db: Session, user_id: uuid.UUID) -> list[BuddyRequestOut]:
    reqs = db.query(BuddyRequest).filter(BuddyRequest.sender_id == user_id).order_by(BuddyRequest.created_at.desc()).all()
    return [_build_request_out(r, db, user_id) for r in reqs]


def respond_to_request(db: Session, request_id: uuid.UUID, receiver_id: uuid.UUID, data: BuddyResponseIn) -> BuddyRequestOut:
    req = db.query(BuddyRequest).filter(BuddyRequest.id == request_id, BuddyRequest.receiver_id == receiver_id).first()
    if not req:
        raise HTTPException(404, "Request not found or not yours to respond to")
    if req.status != "pending":
        raise HTTPException(400, f"Request already {req.status}")

    req.status = "accepted" if data.action == "accept" else "rejected"
    req.responded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return _build_request_out(req, db, receiver_id)


# ── Chat ─────────────────────────────────────────────────────────────────────

def _check_chat_access(db: Session, request_id: uuid.UUID, user_id: uuid.UUID) -> BuddyRequest:
    req = db.query(BuddyRequest).filter(BuddyRequest.id == request_id).first()
    if not req:
        raise HTTPException(404, "Buddy request not found")
    if user_id not in (req.sender_id, req.receiver_id):
        raise HTTPException(403, "Not a party to this buddy request")
    if req.status != "accepted":
        raise HTTPException(403, "Chat only available after both parties accept")
    return req


def get_chat_messages(db: Session, request_id: uuid.UUID, user_id: uuid.UUID) -> list[ChatMessageOut]:
    req = _check_chat_access(db, request_id, user_id)
    messages = (
        db.query(BuddyChatMessage)
        .filter(BuddyChatMessage.request_id == req.id)
        .order_by(BuddyChatMessage.created_at.asc())
        .all()
    )
    # Mark unread messages from the other party as read
    now = datetime.now(timezone.utc)
    for m in messages:
        if m.sender_id != user_id and m.read_at is None:
            m.read_at = now
    db.commit()
    return [
        ChatMessageOut(
            id=m.id,
            is_mine=(m.sender_id == user_id),
            content=m.content,
            created_at=m.created_at,
            read_at=m.read_at,
        )
        for m in messages
    ]


def send_chat_message(db: Session, request_id: uuid.UUID, sender_id: uuid.UUID, data: ChatMessageIn) -> ChatMessageOut:
    req = _check_chat_access(db, request_id, sender_id)
    msg = BuddyChatMessage(
        request_id=req.id,
        sender_id=sender_id,
        content=data.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return ChatMessageOut(
        id=msg.id,
        is_mine=True,
        content=msg.content,
        created_at=msg.created_at,
        read_at=msg.read_at,
    )


def mark_messages_read(db: Session, request_id: uuid.UUID, user_id: uuid.UUID) -> None:
    req = _check_chat_access(db, request_id, user_id)
    now = datetime.now(timezone.utc)
    msgs = (
        db.query(BuddyChatMessage)
        .filter(
            BuddyChatMessage.request_id == req.id,
            BuddyChatMessage.sender_id != user_id,
            BuddyChatMessage.read_at.is_(None),
        )
        .all()
    )
    for m in msgs:
        m.read_at = now
    db.commit()
