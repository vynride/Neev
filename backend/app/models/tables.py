from datetime import date, datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.config import get_settings
from app.db.postgres import Base

EMBEDDING_DIM = get_settings().embedding_dim


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String)  # student | mentor | admin


class StudentScore(Base):
    """Scores as delivered by CodeGuru and Samvad Saathi."""

    __tablename__ = "student_scores"

    student_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    codeguru: Mapped[dict] = mapped_column(JSONB)
    samvad_saathi: Mapped[dict] = mapped_column(JSONB)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    client_name: Mapped[str] = mapped_column(String)
    client_contact: Mapped[str] = mapped_column(String, default="")
    repo_url: Mapped[str] = mapped_column(String, default="")
    repo_branch: Mapped[str] = mapped_column(String, default="main")
    repo_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    stage: Mapped[str] = mapped_column(String, default="development")
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    budget_inr: Mapped[int | None] = mapped_column(Integer, nullable=True)


class Assignment(Base):
    __tablename__ = "assignments"

    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    mentor_id: Mapped[str] = mapped_column(ForeignKey("users.id"))


class Task(Base):
    """Shaped like a ClickUp task so the ClickUp adapter can fill the same table."""

    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String, default="to do")
    assignee_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=3)
    clickup_id: Mapped[str | None] = mapped_column(String, nullable=True)


class Ticket(Base):
    """A question that reached the mentor (kind=ticket) or a non-blocking notice (kind=fyi)."""

    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    kind: Mapped[str] = mapped_column(String, default="ticket")  # ticket | fyi
    status: Mapped[str] = mapped_column(String, default="open")  # open | resolved
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    mentor_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    session_id: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    question: Mapped[str] = mapped_column(Text)
    tried: Mapped[str] = mapped_column(Text, default="")
    excerpts: Mapped[list] = mapped_column(JSONB, default=list)
    draft_answer: Mapped[str] = mapped_column(Text, default="")
    final_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class KBEntry(Base):
    """A mentor-approved answer, searched before any new escalation."""

    __tablename__ = "kb_entries"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    category: Mapped[str] = mapped_column(String)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    source_ticket_id: Mapped[str | None] = mapped_column(String, nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SharedAnswer(Base):
    """An AI answer to a general question, reused for any student who asks the same thing.

    A row with `alias_of` set is another wording of the same question: it carries its own
    embedding and points at the row that holds the answer.
    """

    __tablename__ = "shared_answers"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    category: Mapped[str] = mapped_column(String)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text, default="")
    resources: Mapped[list] = mapped_column(JSONB, default=list)
    alias_of: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), nullable=True)
    hits: Mapped[int] = mapped_column(Integer, default=0)
    helped: Mapped[int] = mapped_column(Integer, default=0)
    rejected: Mapped[int] = mapped_column(Integer, default=0)
    # Set while a mentor is checking the answer after a student's complaint; not served meanwhile
    review_ticket_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    reviewed_by: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Chunk(Base):
    """A searchable piece of a project document or meeting transcript."""

    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    source_type: Mapped[str] = mapped_column(String)  # doc | meeting
    source_id: Mapped[str] = mapped_column(String)
    ref: Mapped[str] = mapped_column(String)  # citation target, e.g. "brief.md#Goals"
    text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), nullable=True)


class MetricEvent(Base):
    __tablename__ = "metric_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # question | retry | ask_client | kb_hit | shared_hit | escalated | fyi
    kind: Mapped[str] = mapped_column(String, index=True)
    project_id: Mapped[str] = mapped_column(String)
    student_id: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
