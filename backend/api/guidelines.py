from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.auth import get_current_user
from db.database import get_db
from db.models import Guideline, GuidelineStatus

router = APIRouter(prefix="/guidelines", tags=["guidelines"])

@router.get("/")
async def get_guidelines(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Guideline).order_by(Guideline.created_at.desc())
    result = await db.execute(query)
    guidelines = result.scalars().all()
    
    return {"data": guidelines}

from fastapi import BackgroundTasks
from agents.pipeline import run_pipeline_async
import uuid
import os
from datetime import datetime, timezone
from db.models import PipelineRun

@router.get("/stats/count")
async def get_guideline_stats(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import func
    # Example stats: total guidelines processed
    query = select(func.count(Guideline.id)).where(Guideline.status == GuidelineStatus.PROCESSED)
    result = await db.execute(query)
    count = result.scalar()
    return {"processed": count, "pending": 0}

@router.post("/upload")
async def upload_guideline(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(None),
    pdf_url: str = Form(None),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import hashlib
    
    # Ensure uploads directory exists
    os.makedirs("/app/uploads", exist_ok=True)
    
    if file:
        filename = file.filename
        file_path = f"/app/uploads/{filename}"
        content = await file.read()
        if not content:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        with open(file_path, "wb") as f:
            f.write(content)
        saved_size = os.path.getsize(file_path)
        print(f"[UPLOAD] Saved {filename} → {file_path} ({saved_size} bytes)")
        pdf_hash = hashlib.md5(content).hexdigest()
    else:
        filename = "sample_fda_guideline.pdf"
        file_path = f"/app/uploads/{filename}"
        pdf_hash = "placeholder_hash"
        # Just create an empty file for the demo if none provided and none exists
        if not os.path.exists(file_path):
            with open(file_path, "w") as f:
                f.write("Simulated PDF Content")

    query = select(Guideline).where(Guideline.pdf_hash == pdf_hash)
    result = await db.execute(query)
    existing_guideline = result.scalars().first()
    
    if existing_guideline:
        guideline_id = existing_guideline.id
        # Always update the stored path to the freshly uploaded file
        existing_guideline.pdf_url = filename
        await db.commit()
    else:
        new_guideline = Guideline(
            source="Uploaded Document" if file else "URL Import",
            pdf_url=pdf_url or filename,
            pdf_hash=pdf_hash,
            status=GuidelineStatus.PENDING
        )
        db.add(new_guideline)
        await db.commit()
        await db.refresh(new_guideline)
        guideline_id = new_guideline.id
    
    # Always create a new run record
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    new_run = PipelineRun(
        id=run_id,
        guideline_id=guideline_id,
        overall_status="PENDING",
        started_at=datetime.now(timezone.utc)
    )
    db.add(new_run)
    await db.commit()
    
    # Trigger pipeline
    background_tasks.add_task(run_pipeline_async, run_id, guideline_id, file_path)
    
    return {
        "status": "processing", 
        "guideline_id": guideline_id,
        "run_id": run_id
    }

@router.get("/{id}")
async def get_guideline(
    id: int, 
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Guideline).where(Guideline.id == id)
    result = await db.execute(query)
    guideline = result.scalars().first()
    
    if not guideline:
        return {"error": "Guideline not found"}
        
    return {"data": guideline}
