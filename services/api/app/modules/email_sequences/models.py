from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class SubscriberTag(Base):
    __tablename__ = "subscriber_tags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscriber_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("newsletter_subscribers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tag: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint("subscriber_id", "tag", name="uq_subscriber_tag"),
        Index("ix_subscriber_tags_subscriber_id", "subscriber_id"),
    )


class EmailSequence(Base):
    __tablename__ = "email_sequences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    steps: Mapped[list[EmailSequenceStep]] = relationship(
        "EmailSequenceStep",
        back_populates="sequence",
        cascade="all, delete-orphan",
        order_by="EmailSequenceStep.step_number",
    )
    enrollments: Mapped[list[SubscriberSequenceEnrollment]] = relationship(
        "SubscriberSequenceEnrollment",
        back_populates="sequence",
        cascade="all, delete-orphan",
    )

    __table_args__ = (Index("ix_email_sequences_slug", "slug"),)


class EmailSequenceStep(Base):
    __tablename__ = "email_sequence_steps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sequence_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("email_sequences.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    body_template: Mapped[str] = mapped_column(Text, nullable=False)
    delay_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    sequence: Mapped[EmailSequence] = relationship("EmailSequence", back_populates="steps")

    __table_args__ = (Index("ix_email_sequence_steps_sequence_id", "sequence_id"),)


class SubscriberSequenceEnrollment(Base):
    __tablename__ = "subscriber_sequence_enrollments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscriber_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("newsletter_subscribers.id", ondelete="CASCADE"),
        nullable=False,
    )
    sequence_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("email_sequences.id", ondelete="CASCADE"),
        nullable=False,
    )
    current_step: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_send_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    sequence: Mapped[EmailSequence] = relationship("EmailSequence", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint("subscriber_id", "sequence_id", name="uq_subscriber_sequence_enrollment"),
        Index("ix_subscriber_sequence_enrollments_next_send", "next_send_at", "status"),
    )
