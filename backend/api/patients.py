from fastapi import APIRouter, Depends, Request, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi.responses import StreamingResponse, Response
import csv
import io
import os
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
from core.auth import get_current_user
from db.database import get_db
from db.models import Patient, TrialSite

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/stats")
async def get_patient_stats(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch all patients to calculate stats
    query = select(Patient).options(selectinload(Patient.evaluations))
    result = await db.execute(query)
    patients = result.scalars().unique().all()
    
    total = len(patients)
    flagged = 0
    safe = 0
    
    # Calculate by site
    by_site = {}
    
    for p in patients:
        evals = sorted(p.evaluations, key=lambda e: e.evaluated_at) if p.evaluations else []
        latest_eval = evals[-1] if evals else None
        is_flagged = latest_eval.flagged if latest_eval else False
        
        if is_flagged:
            flagged += 1
        else:
            safe += 1
            
        site_id = p.site_id
        if site_id not in by_site:
            by_site[site_id] = {"site_id": site_id, "total": 0, "flagged": 0}
            
        by_site[site_id]["total"] += 1
        if is_flagged:
            by_site[site_id]["flagged"] += 1
            
    return {
        "total_patients": total,
        "total_flagged": flagged,
        "total_safe": safe,
        "by_site": list(by_site.values())
    }

@router.get("/")
async def get_patients(
    request: Request,
    site_id: str = Query(None),
    export: str = Query(None),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Patient).options(selectinload(Patient.evaluations), selectinload(Patient.readings))
    if site_id:
        query = query.where(Patient.site_id == site_id)
        
    result = await db.execute(query)
    patients = result.scalars().unique().all()
    
    formatted_patients = []
    for p in patients:
        # Get latest HRV
        hrv_readings = [r for r in p.readings if r.biomarker == "HRV_SDNN"]
        latest_hrv = hrv_readings[-1].value if hrv_readings else None
        
        # Get evaluation status
        evals = sorted(p.evaluations, key=lambda e: e.evaluated_at) if p.evaluations else []
        latest_eval = evals[-1] if evals else None
        is_flagged = latest_eval.flagged if latest_eval else False
        
        formatted_patients.append({
            "id": p.id,
            "external_id": p.external_id,
            "site_id": p.site_id,
            "status": p.status,
            "latest_hrv": latest_hrv,
            "is_flagged": is_flagged,
            "old_status": latest_eval.old_status if latest_eval else "SAFE",
            "new_status": latest_eval.new_status if latest_eval else "SAFE",
            "enrolled_at": p.enrolled_at
        })

    if export == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Patient ID", "Site ID", "Status", "Latest HRV", "Flagged", "Enrolled At"])
        for p in formatted_patients:
            writer.writerow([p["external_id"] or p["id"], p["site_id"], p["status"], p["latest_hrv"], p["is_flagged"], p["enrolled_at"]])
        output.seek(0)
        return Response(
            content=output.getvalue(), 
            media_type="text/csv", 
            headers={"Content-Disposition": f"attachment; filename=patients_{site_id or 'all'}.csv"}
        )
        
    return {"data": formatted_patients, "site_scope": site_id}

@router.get("/{id}")
async def get_patient(
    id: str, 
    request: Request, 
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    site_id = getattr(request.state, "site_id", None)
    
    query = select(Patient).options(selectinload(Patient.evaluations), selectinload(Patient.readings)).where(Patient.id == id)
    if site_id:
        query = query.where(Patient.site_id == site_id)
        
    result = await db.execute(query)
    patient = result.scalars().unique().first()
    
    if not patient:
        return {"error": "Patient not found or unauthorized"}
        
    return {"data": patient, "site_scope": site_id}

@router.get("/{id}/readings")
async def get_patient_readings(
    id: str, 
    request: Request, 
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from db.models import BiomarkerReading
    
    query = select(BiomarkerReading).where(BiomarkerReading.patient_id == id).order_by(BiomarkerReading.recorded_at.asc())
    result = await db.execute(query)
    readings = result.scalars().all()
    
    return {"id": id, "readings": readings}

@router.post("/{id}/notify")
async def notify_doctor(
    id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Send email notification via SendGrid
    sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
    from_email_address = os.environ.get('SENDGRID_FROM_EMAIL', 'suzxxpro@gmail.com')
    to_email_address = os.environ.get('SENDGRID_TO_DOCTOR', 'sathwikbhat2@gmail.com')
    
    if not sendgrid_api_key or sendgrid_api_key == "SG.your_sendgrid_api_key_here":
        # For demo purposes if key is missing, pretend it succeeded
        return {"status": "success", "message": "Simulated email sent (SendGrid key missing)"}
        
    try:
        sg = sendgrid.SendGridAPIClient(api_key=sendgrid_api_key)
        from_email = Email(from_email_address)
        to_email = To(to_email_address)
        subject = f"URGENT: Patient {id} Flagged - Action Required"
        content = Content(
            "text/html", 
            f"""
            <html>
            <body>
                <h2>Pharmacovigilance Alert</h2>
                <p>Patient <strong>{id}</strong> has been flagged as AT RISK by the latest monitoring rules.</p>
                <p>Please log in to the ReguVigil Doctor Dashboard to review their 30-day HRV trend and take necessary clinical action.</p>
                <br>
                <a href="http://localhost:3000/dashboard/doctor">View Patient Details</a>
            </body>
            </html>
            """
        )
        mail = Mail(from_email, to_email, subject, content)
        sg.client.mail.send.post(request_body=mail.get())
        return {"status": "success", "message": "Email sent to Doctor"}
    except Exception as e:
        print(f"SendGrid error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send notification email")
