from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.agents import service as agent_service
from app.modules.pipeline.models import PipelineRun, PipelineStage

PIPELINE_STAGES = [
    "trend_discovery",
    "keyword_cluster",
    "content_brief",
    "content_writing",
    "seo_aeo",
    "publish",
]

# After these stages, the pipeline pauses for human approval
CHECKPOINT_AFTER: dict[str, str] = {
    "content_brief": "paused_at_brief_approval",
}


# ── CRUD helpers ──────────────────────────────────────────────────────────────

def create_pipeline_run(
    db: Session,
    *,
    start_stage: str = "trend_discovery",
    end_stage: str = "publish",
    input_data: dict[str, Any],
) -> PipelineRun:
    pipeline_type = "partial" if start_stage != "trend_discovery" else "full"
    run = PipelineRun(
        pipeline_type=pipeline_type,
        status="running",
        start_stage=start_stage,
        end_stage=end_stage,
        input_json=json.dumps(input_data),
        output_json=json.dumps({}),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def get_pipeline_run(db: Session, run_id: uuid.UUID) -> PipelineRun | None:
    return db.scalar(
        select(PipelineRun).where(PipelineRun.id == run_id)
    )


def list_pipeline_runs(
    db: Session, limit: int = 20, offset: int = 0
) -> list[PipelineRun]:
    return list(
        db.scalars(
            select(PipelineRun)
            .order_by(PipelineRun.created_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )


def cancel_pipeline_run(db: Session, run_id: uuid.UUID) -> PipelineRun | None:
    run = get_pipeline_run(db, run_id)
    if run is None:
        return None
    if run.status in ("completed", "failed", "cancelled"):
        return run
    run.status = "cancelled"
    run.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(run)
    return run


def _update_run(db: Session, run: PipelineRun, **kwargs: Any) -> None:
    for k, v in kwargs.items():
        setattr(run, k, v)
    db.commit()
    db.refresh(run)


def _create_stage(
    db: Session, *, run_id: uuid.UUID, stage_name: str
) -> PipelineStage:
    stage = PipelineStage(
        pipeline_run_id=run_id,
        stage_name=stage_name,
        status="running",
        started_at=datetime.now(timezone.utc),
    )
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return stage


def _update_stage(db: Session, stage: PipelineStage, **kwargs: Any) -> None:
    for k, v in kwargs.items():
        setattr(stage, k, v)
    db.commit()
    db.refresh(stage)


# ── Orchestrator ──────────────────────────────────────────────────────────────

class PipelineOrchestrator:
    def __init__(self, db: Session, run_id: uuid.UUID) -> None:
        self.db = db
        self.run_id = run_id
        self._run: PipelineRun | None = None

    def _load_run(self) -> PipelineRun:
        run = get_pipeline_run(self.db, self.run_id)
        if run is None:
            raise ValueError(f"Pipeline run {self.run_id} not found")
        self._run = run
        return run

    def _get_context(self) -> dict[str, Any]:
        assert self._run is not None
        input_data = json.loads(self._run.input_json or "{}")
        output_data = json.loads(self._run.output_json or "{}")
        return {**input_data, **output_data}

    def _save_output(self, updates: dict[str, Any]) -> None:
        assert self._run is not None
        current = json.loads(self._run.output_json or "{}")
        current.update(updates)
        self._run.output_json = json.dumps(current)
        self.db.commit()
        self.db.refresh(self._run)

    def run(self) -> None:
        run = self._load_run()
        stages = self._stages_slice(run.start_stage, run.end_stage)
        self._execute_stages(run, stages)

    def resume(self) -> None:
        run = self._load_run()
        if run.status == "paused_at_brief_approval":
            next_stage = "content_writing"
            self._verify_brief_approved()
        elif run.status == "paused_at_draft_approval":
            next_stage = "seo_aeo"
            self._verify_draft_approved()
        else:
            raise ValueError(
                f"Pipeline run is not paused (status: {run.status}). "
                "Can only resume from paused_at_brief_approval or paused_at_draft_approval."
            )
        run.status = "running"
        self.db.commit()
        self.db.refresh(run)
        stages = self._stages_slice(next_stage, run.end_stage)
        self._execute_stages(run, stages)

    def _verify_brief_approved(self) -> None:
        context = self._get_context()
        brief_id_str = context.get("brief_id")
        if not brief_id_str:
            return
        from app.modules.content.models import ContentBrief
        brief = self.db.scalar(
            select(ContentBrief).where(ContentBrief.id == uuid.UUID(brief_id_str))
        )
        if brief and brief.status != "approved":
            raise ValueError(
                f"Brief must be in 'approved' status before resuming. Current: '{brief.status}'."
            )

    def _verify_draft_approved(self) -> None:
        context = self._get_context()
        draft_id_str = context.get("draft_id")
        if not draft_id_str:
            return
        from app.modules.content.models import ContentDraft
        draft = self.db.scalar(
            select(ContentDraft).where(ContentDraft.id == uuid.UUID(draft_id_str))
        )
        if draft and draft.status not in ("approved", "published"):
            raise ValueError(
                f"Draft must be in 'approved' status before resuming. Current: '{draft.status}'."
            )

    def _stages_slice(self, start: str, end: str) -> list[str]:
        try:
            start_idx = PIPELINE_STAGES.index(start)
            end_idx = PIPELINE_STAGES.index(end)
        except ValueError as exc:
            raise ValueError(f"Invalid stage name: {exc}") from exc
        if start_idx > end_idx:
            raise ValueError(f"start_stage '{start}' must come before end_stage '{end}'")
        return PIPELINE_STAGES[start_idx : end_idx + 1]

    def _execute_stages(self, run: PipelineRun, stages: list[str]) -> None:
        for stage_name in stages:
            if run.status == "cancelled":
                break

            run.current_stage = stage_name
            self.db.commit()

            stage_record = _create_stage(self.db, run_id=run.id, stage_name=stage_name)

            try:
                context = self._get_context()
                stage_output = self._dispatch_stage(stage_name, context)
            except Exception as exc:
                _update_stage(
                    self.db,
                    stage_record,
                    status="failed",
                    error_detail=str(exc),
                    completed_at=datetime.now(timezone.utc),
                )
                _update_run(
                    self.db,
                    run,
                    status="failed",
                    error_detail=f"Stage '{stage_name}' failed: {exc}",
                    completed_at=datetime.now(timezone.utc),
                )
                return

            agent_run_id = stage_output.pop("agent_run_id", None)
            _update_stage(
                self.db,
                stage_record,
                status="completed",
                agent_run_id=agent_run_id,
                completed_at=datetime.now(timezone.utc),
            )
            if stage_output:
                self._save_output(stage_output)

            # Brief-approval checkpoint
            if stage_name in CHECKPOINT_AFTER:
                _update_run(self.db, run, status=CHECKPOINT_AFTER[stage_name])
                return

            # Draft-approval checkpoint: pause if draft needs fact-check review
            if stage_name == "content_writing":
                context = self._get_context()
                draft_id_str = context.get("draft_id")
                if draft_id_str:
                    from app.modules.content.models import ContentDraft
                    draft = self.db.scalar(
                        select(ContentDraft).where(
                            ContentDraft.id == uuid.UUID(draft_id_str)
                        )
                    )
                    if draft and draft.status == "requires_review":
                        _update_run(self.db, run, status="paused_at_draft_approval")
                        return

        if run.status == "running":
            _update_run(
                self.db,
                run,
                status="completed",
                current_stage=None,
                completed_at=datetime.now(timezone.utc),
            )

    # ── Stage dispatchers ──────────────────────────────────────────────────────

    def _dispatch_stage(self, stage_name: str, context: dict[str, Any]) -> dict[str, Any]:
        handlers = {
            "trend_discovery": self._run_trend_discovery,
            "keyword_cluster": self._run_keyword_cluster,
            "content_brief": self._run_content_brief,
            "content_writing": self._run_content_writing,
            "seo_aeo": self._run_seo_aeo,
            "publish": self._run_publish,
        }
        handler = handlers.get(stage_name)
        if handler is None:
            raise ValueError(f"Unknown stage: '{stage_name}'")
        return handler(context)

    def _run_trend_discovery(self, context: dict[str, Any]) -> dict[str, Any]:
        from app.modules.agents.trend_discovery.agent import TrendDiscoveryAgent
        seed_topics: list[str] = context.get("seed_topics") or []
        input_data = {"seed_topics": seed_topics}
        agent_run = agent_service.start_run(self.db, "trend_discovery", input_data)
        try:
            agent = TrendDiscoveryAgent(db=self.db)
            result = agent.run(input_data, run_id=agent_run.id)
            output = result.get("output", {})
            errors = result.get("errors", [])
            if errors:
                agent_service.fail_run(self.db, agent_run.id, "; ".join(errors))
                raise ValueError("; ".join(errors))
            agent_service.complete_run(self.db, agent_run.id, output)
            return {"agent_run_id": agent_run.id, "topic_ids": output.get("topic_ids", [])}
        except Exception:
            agent_service.fail_run(self.db, agent_run.id, "Stage failed")
            raise

    def _run_keyword_cluster(self, context: dict[str, Any]) -> dict[str, Any]:
        from app.modules.agents.keyword_cluster.agent import KeywordClusterAgent
        from app.modules.content.models import TopicOpportunity
        topic_ids: list[str] = context.get("topic_ids") or []
        if not topic_ids:
            # Trend discovery stored 0 new topics — fall back to 10 most-recent DB topics
            recent = self.db.scalars(
                select(TopicOpportunity)
                .order_by(TopicOpportunity.created_at.desc())
                .limit(10)
            ).all()
            topic_ids = [str(t.id) for t in recent]
            if not topic_ids:
                raise ValueError("No topic_ids available for keyword_cluster stage.")
        input_data = {"topic_ids": topic_ids}
        agent_run = agent_service.start_run(self.db, "keyword_cluster", input_data)
        try:
            agent = KeywordClusterAgent(db=self.db)
            result = agent.run(input_data, run_id=agent_run.id)
            output = result.get("output", {})
            errors = result.get("errors", [])
            if errors:
                agent_service.fail_run(self.db, agent_run.id, "; ".join(errors))
                raise ValueError("; ".join(errors))
            agent_service.complete_run(self.db, agent_run.id, output)
            return {"agent_run_id": agent_run.id, "cluster_ids": output.get("cluster_ids", [])}
        except Exception:
            agent_service.fail_run(self.db, agent_run.id, "Stage failed")
            raise

    def _run_content_brief(self, context: dict[str, Any]) -> dict[str, Any]:
        from app.modules.agents.content_brief.agent import ContentBriefAgent
        topic_ids: list[str] = context.get("topic_ids") or []
        cluster_ids: list[str] = context.get("cluster_ids") or []
        topic_id = topic_ids[0] if topic_ids else context.get("topic_id")
        cluster_id = cluster_ids[0] if cluster_ids else context.get("cluster_id")
        if not topic_id:
            raise ValueError("No topic_id available for content_brief stage.")
        input_data = {"topic_id": str(topic_id), "cluster_id": str(cluster_id) if cluster_id else None}
        agent_run = agent_service.start_run(self.db, "content_brief", input_data)
        try:
            agent = ContentBriefAgent(db=self.db)
            result = agent.run(input_data, run_id=agent_run.id)
            output = result.get("output", {})
            errors = result.get("errors", [])
            if errors:
                agent_service.fail_run(self.db, agent_run.id, "; ".join(errors))
                raise ValueError("; ".join(errors))
            agent_service.complete_run(self.db, agent_run.id, output)
            return {"agent_run_id": agent_run.id, "brief_id": output.get("brief_id", "")}
        except Exception:
            agent_service.fail_run(self.db, agent_run.id, "Stage failed")
            raise

    def _run_content_writing(self, context: dict[str, Any]) -> dict[str, Any]:
        from app.modules.agents.content_writing.agent import ContentWritingAgent
        brief_id = context.get("brief_id")
        if not brief_id:
            raise ValueError("No brief_id available for content_writing stage.")
        input_data = {"brief_id": str(brief_id)}
        agent_run = agent_service.start_run(self.db, "content_writing", input_data)
        try:
            agent = ContentWritingAgent(db=self.db)
            result = agent.run(input_data, run_id=agent_run.id)
            output = result.get("output", {})
            errors = result.get("errors", [])
            if errors:
                agent_service.fail_run(self.db, agent_run.id, "; ".join(errors))
                raise ValueError("; ".join(errors))
            agent_service.complete_run(self.db, agent_run.id, output)
            return {"agent_run_id": agent_run.id, "draft_id": output.get("draft_id", "")}
        except Exception:
            agent_service.fail_run(self.db, agent_run.id, "Stage failed")
            raise

    def _run_seo_aeo(self, context: dict[str, Any]) -> dict[str, Any]:
        from app.modules.agents.seo_aeo.agent import SEOAEOAgent
        draft_id = context.get("draft_id")
        if not draft_id:
            raise ValueError("No draft_id available for seo_aeo stage.")
        input_data = {"draft_id": str(draft_id)}
        agent_run = agent_service.start_run(self.db, "seo_aeo", input_data)
        try:
            agent = SEOAEOAgent(db=self.db)
            result = agent.run(input_data, run_id=agent_run.id)
            output = result.get("output", {})
            errors = result.get("errors", [])
            if errors:
                agent_service.fail_run(self.db, agent_run.id, "; ".join(errors))
                raise ValueError("; ".join(errors))
            agent_service.complete_run(self.db, agent_run.id, output)
            return {"agent_run_id": agent_run.id, "draft_id": str(draft_id)}
        except Exception:
            agent_service.fail_run(self.db, agent_run.id, "Stage failed")
            raise

    def _run_publish(self, context: dict[str, Any]) -> dict[str, Any]:
        from app.modules.publish.service import publish_to_cms
        draft_id_str = context.get("draft_id")
        if not draft_id_str:
            raise ValueError("No draft_id available for publish stage.")
        result = publish_to_cms(self.db, draft_id=uuid.UUID(str(draft_id_str)))
        return {
            "agent_run_id": None,
            "cms_page_id": str(result.cms_page_id),
            "published_url": result.published_url,
        }
