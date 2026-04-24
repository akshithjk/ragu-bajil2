import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.models import Patient, PatientEvaluation, Rule, BiomarkerReading, EvaluationStatus

async def evaluate_patient(db, pt, rule):
    # Fetch last reading
    readings_query = select(BiomarkerReading).where(
        BiomarkerReading.patient_id == pt.id,
        BiomarkerReading.biomarker.in_([rule.biomarker, rule.biomarker.replace("_SDNN", ""), "HRV"])
    ).order_by(BiomarkerReading.recorded_at.desc()).limit(1)
    result = await db.execute(readings_query)
    reading = result.scalar_one_or_none()
    
    if not reading:
        return None
        
    # Evaluation logic
    status = EvaluationStatus.SAFE
    
    if rule.operator == "LT" and reading.value < rule.threshold:
        status = EvaluationStatus.AT_RISK
    elif rule.operator == "LTE" and reading.value <= rule.threshold:
        status = EvaluationStatus.AT_RISK
    elif rule.operator == "GT" and reading.value > rule.threshold:
        status = EvaluationStatus.AT_RISK
    elif rule.operator == "GTE" and reading.value >= rule.threshold:
        status = EvaluationStatus.AT_RISK
        
    is_flagged = (status == EvaluationStatus.AT_RISK)
    
    eval_record = PatientEvaluation(
        patient_id=pt.id,
        rule_id=rule.id,
        new_status=status,
        current_value=reading.value,
        flagged=is_flagged,
        evaluation_triggered_by="agent3"
    )
    return eval_record

async def run_agent3(db: AsyncSession, new_rule_id: int):
    # Fetch rule
    rule = await db.get(Rule, new_rule_id)
    if not rule: 
        return []
    
    # Fetch patients
    query = select(Patient).where(Patient.trial_id == rule.trial_id)
    result = await db.execute(query)
    patients = result.scalars().all()
    
    flagged_evals = []
    
    # Batch process in groups of 50
    batch_size = 50
    for i in range(0, len(patients), batch_size):
        batch = patients[i:i+batch_size]
        tasks = [evaluate_patient(db, pt, rule) for pt in batch]
        eval_records = await asyncio.gather(*tasks)
        
        for eval_record in eval_records:
            if eval_record:
                db.add(eval_record)
                if eval_record.flagged:
                    flagged_evals.append(eval_record)
                    
    await db.commit()
    return flagged_evals
