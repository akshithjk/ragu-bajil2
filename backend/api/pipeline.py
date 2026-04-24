from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from core.auth import get_current_user
from db.database import get_db
from db.models import PipelineRun, PipelineAgentStatus, PipelineLog, Guideline
import uuid
from datetime import datetime, timezone
from agents.pipeline import run_pipeline_async, approve_pipeline_run

router = APIRouter(prefix="/pipeline", tags=["pipeline"])

@router.get("/status")
async def get_pipeline_status(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Get the latest run
    query = select(PipelineRun).order_by(desc(PipelineRun.started_at)).limit(1)
    res = await db.execute(query)
    latest_run = res.scalar_one_or_none()
    
    if not latest_run:
        return {"status": "IDLE", "active_run": None}
        
    # Get agents for this run
    agents_query = select(PipelineAgentStatus).filter_by(run_id=latest_run.id).order_by(PipelineAgentStatus.agent_number)
    agents_res = await db.execute(agents_query)
    agents = agents_res.scalars().all()
        
    return {
        "status": latest_run.overall_status,
        "active_run": latest_run.id,
        "started_at": latest_run.started_at,
        "completed_at": latest_run.completed_at,
        "confidence_score": getattr(latest_run, 'confidence_score', None),
        "patients_evaluated": latest_run.patients_evaluated,
        "patients_flagged": latest_run.patients_flagged,
        "agents": [
            {
                "number": a.agent_number,
                "name": a.agent_name,
                "status": a.status,
                "duration_ms": a.duration_ms,
                "error": a.error_message
            } for a in agents
        ]
    }

@router.get("/runs")
async def get_pipeline_runs(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(PipelineRun).order_by(desc(PipelineRun.started_at))
    res = await db.execute(query)
    runs = res.scalars().all()
    
    return {"runs": [
        {
            "id": run.id,
            "status": run.overall_status,
            "started_at": run.started_at,
            "completed_at": run.completed_at,
            "guideline_id": run.guideline_id,
            "confidence_score": getattr(run, 'confidence_score', None),
            "patients_evaluated": run.patients_evaluated,
            "patients_flagged": run.patients_flagged
        } for run in runs
    ]}

@router.get("/run/{run_id}")
async def get_run_details(run_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    run_obj = await db.get(PipelineRun, run_id)
    if not run_obj:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
        
    # Get agents
    agents_query = select(PipelineAgentStatus).filter_by(run_id=run_id).order_by(PipelineAgentStatus.agent_number)
    agents_res = await db.execute(agents_query)
    agents = agents_res.scalars().all()
    
    # Get logs
    logs_query = select(PipelineLog).filter_by(run_id=run_id).order_by(PipelineLog.logged_at)
    logs_res = await db.execute(logs_query)
    logs = logs_res.scalars().all()
    
    return {
        "id": run_obj.id,
        "status": run_obj.overall_status,
        "started_at": run_obj.started_at,
        "completed_at": run_obj.completed_at,
        "confidence_score": getattr(run_obj, 'confidence_score', None),
        "patients_evaluated": run_obj.patients_evaluated,
        "patients_flagged": run_obj.patients_flagged,
        "agents": [
            {
                "number": a.agent_number,
                "name": a.agent_name,
                "status": a.status,
                "duration_ms": a.duration_ms,
                "error": a.error_message
            } for a in agents
        ],
        "logs": [
            {
                "timestamp": l.logged_at,
                "level": l.log_level,
                "message": l.message
            } for l in logs
        ]
    }

@router.post("/run/{run_id}/approve")
async def approve_run(run_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from db.models import Rule, PatientEvaluation, Patient, RuleStatus
    from sqlalchemy import select
    
    run_obj = await db.get(PipelineRun, run_id)
    if not run_obj:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
        
    if run_obj.overall_status != "HUMAN_REVIEW":
        raise HTTPException(status_code=400, detail="Run is not awaiting human review")
        
    run_obj.overall_status = "RUNNING"
    await db.commit()
    
    # Activate the pending rule from this run
    rule_query = select(Rule).where(Rule.status == RuleStatus.PENDING).order_by(Rule.id.desc()).limit(1)
    rule_res = await db.execute(rule_query)
    pending_rule = rule_res.scalars().first()
    if pending_rule:
        pending_rule.status = RuleStatus.ACTIVE
        await db.commit()
        
        # Update patient.status based on their evaluations against this rule
        evals_query = select(PatientEvaluation).where(PatientEvaluation.rule_id == pending_rule.id)
        evals_res = await db.execute(evals_query)
        for ev in evals_res.scalars().all():
            patient = await db.get(Patient, ev.patient_id)
            if patient:
                patient.status = ev.new_status.value if hasattr(ev.new_status, 'value') else str(ev.new_status)
        await db.commit()
    
    background_tasks.add_task(approve_pipeline_run, run_id)
    return {"status": "success", "message": "Pipeline approved and resumed"}

@router.post("/run/{run_id}/reject")
async def reject_run(run_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    run_obj = await db.get(PipelineRun, run_id)
    if not run_obj:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
        
    if run_obj.overall_status != "HUMAN_REVIEW":
        raise HTTPException(status_code=400, detail="Run is not awaiting human review")
        
    run_obj.overall_status = "REJECTED"
    run_obj.completed_at = datetime.now(timezone.utc)
    
    # Update pending agents
    agents_query = select(PipelineAgentStatus).filter_by(run_id=run_id, status="PENDING_REVIEW")
    agents_res = await db.execute(agents_query)
    for agent in agents_res.scalars().all():
        agent.status = "CANCELLED"
        
    await db.commit()
    return {"status": "success", "message": "Pipeline rejected and cancelled"}

@router.post("/trigger")
async def trigger_pipeline(background_tasks: BackgroundTasks, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Create a new run record
    gl_query = select(Guideline).filter_by(id=1)
    res = await db.execute(gl_query)
    guideline = res.scalar_one_or_none()
    if not guideline:
        raise HTTPException(status_code=404, detail="Guideline not found for trigger.")
        
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    new_run = PipelineRun(
        id=run_id,
        guideline_id=guideline.id,
        overall_status="PENDING",
        started_at=datetime.now(timezone.utc)
    )
    db.add(new_run)
    await db.commit()
    
    # Spawn background task
    pdf_path = "sample_fda_guideline.pdf" 
    background_tasks.add_task(run_pipeline_async, run_id, guideline.id, pdf_path)
    
    return {"status": "TRIGGERED", "run_id": run_id}
