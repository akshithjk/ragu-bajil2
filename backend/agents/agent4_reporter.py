import os
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To
import logging
from db.database import AsyncSessionLocal
from db.models import PVReport, Patient, BiomarkerReading
from sqlalchemy import select
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)

# Hardcoded site-to-doctor mapping for the demo
# In production this would be a DB lookup on TrialSite.pi_user_id -> User.email
SITE_DOCTOR_MAP = {
    "site-3":  {"name": "Dr. Ramesh K.",        "email": "sathwikbhat2@gmail.com",  "hospital": "Apollo Hospitals, Chennai"},
    # Other sites fallback to data manager only
}
DATAMANAGER_EMAIL = os.environ.get('SENDGRID_TO_DATAMANAGER', 'drarjunbhat@gmail.com')
DATAMANAGER_NAME  = "Dr. Arjun M. (Data Manager)"

async def generate_and_send_pv_report(flagged_list, trial_id, new_rule_id, run_id):
    """
    Agent 4 — Auto PV Reporter:
    1. Creates PVReport in DB
    2. Groups flagged patients by site
    3. Looks up the doctor for each site
    4. Sends each doctor an email listing ONLY their flagged patients
    5. Also sends full summary to the Data Manager
    """

    total_flagged = len(flagged_list)

    # 1. Create DB record
    async with AsyncSessionLocal() as db:
        new_report = PVReport(
            trial_id=trial_id,
            rule_id=new_rule_id,
            run_id=run_id,
            status="GENERATED",
            severity_breakdown={"AT_RISK": total_flagged},
            report_html=None
        )
        db.add(new_report)
        await db.commit()
        await db.refresh(new_report)
        report_id = new_report.id

    if total_flagged == 0:
        logger.info("No flagged patients — skipping email dispatch.")
        return report_id

    # 2. Enrich flagged list with site_id from DB
    patient_ids = [f["patient_id"] for f in flagged_list]
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Patient)
            .options(selectinload(Patient.readings))
            .where(Patient.id.in_(patient_ids))
        )
        patients_db = {p.id: p for p in result.scalars().all()}

    enriched = []
    for f in flagged_list:
        patient = patients_db.get(f["patient_id"])
        if not patient:
            continue
        hrv_readings = [r for r in patient.readings if r.biomarker == "HRV_SDNN"]
        latest_hrv = round(hrv_readings[-1].value, 1) if hrv_readings else round(f.get("current_value", 0), 1)
        enriched.append({
            "patient_id": f["patient_id"],
            "site_id": patient.site_id,
            "hrv": latest_hrv
        })

    # 3. Group by site
    by_site: dict[str, list] = {}
    for e in enriched:
        site = e["site_id"]
        by_site.setdefault(site, []).append(e)

    # 4. Setup SendGrid
    sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
    from_email_address = os.environ.get('SENDGRID_FROM_EMAIL', 'suzxxpro@gmail.com')

    if not sendgrid_api_key or sendgrid_api_key == "SG.your_sendgrid_api_key_here":
        logger.warning("SENDGRID_API_KEY not configured — skipping email dispatch.")
        return report_id

    sg = sendgrid.SendGridAPIClient(api_key=sendgrid_api_key)

    def build_patient_rows(patients):
        rows = "".join(
            f"""<tr style='border-bottom:1px solid #fee2e2'>
                   <td style='padding:8px 12px;font-weight:600;color:#1e293b'>{p['patient_id']}</td>
                   <td style='padding:8px 12px;color:#dc2626;font-weight:700'>{p['hrv']} ms</td>
                   <td style='padding:8px 12px;color:#b91c1c'>⚠ AT RISK — Below Threshold</td>
               </tr>"""
            for p in patients
        )
        return rows or "<tr><td colspan='3' style='padding:8px 12px;color:#64748b'>No patient data available.</td></tr>"

    def build_html(recipient_name, site_name, patients, report_id, is_doctor=True):
        count = len(patients)
        dashboard_url = "http://localhost:3000/dashboard/doctor" if is_doctor else "http://localhost:3000/dashboard/datamanager"
        dashboard_label = "View Doctor Dashboard →" if is_doctor else "View Data Manager Dashboard →"
        return f"""
        <html>
        <body style='font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:32px'>
          <div style='max-width:620px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)'>
            <div style='background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 32px'>
              <h1 style='color:#fff;margin:0;font-size:22px;font-weight:700'>🚨 ReguVigil Pharmacovigilance Alert</h1>
              <p style='color:#fecaca;margin:8px 0 0;font-size:14px'>Trial: GlucoZen Phase III &middot; Site: {site_name}</p>
            </div>
            <div style='padding:28px 32px'>
              <p style='font-size:15px;color:#1e293b;margin:0 0 16px'>
                Dear {recipient_name},<br><br>
                The <strong>ReguVigil AI Pipeline</strong> has completed a new evaluation cycle and detected
                <strong style='color:#dc2626'>{count} patient(s)</strong> under your care who are currently
                <strong>AT RISK</strong> based on their latest HRV (SDNN) biomarker readings.
                <br><br>
                Immediate clinical review is required.
              </p>
              <table style='width:100%;border-collapse:collapse;margin:16px 0;border-radius:8px;overflow:hidden;border:1px solid #fee2e2'>
                <thead>
                  <tr style='background:#fef2f2'>
                    <th style='padding:10px 12px;text-align:left;color:#7f1d1d;font-size:13px'>Patient ID</th>
                    <th style='padding:10px 12px;text-align:left;color:#7f1d1d;font-size:13px'>Latest HRV (SDNN)</th>
                    <th style='padding:10px 12px;text-align:left;color:#7f1d1d;font-size:13px'>Status</th>
                  </tr>
                </thead>
                <tbody>{build_patient_rows(patients)}</tbody>
              </table>
              <p style='font-size:14px;color:#475569;margin:16px 0'>
                Please log into your dashboard immediately and take necessary clinical action for each flagged patient.
              </p>
              <a href='{dashboard_url}' style='display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px'>{dashboard_label}</a>
            </div>
            <div style='background:#f1f5f9;padding:16px 32px;font-size:12px;color:#94a3b8'>
              Automated alert from ReguVigil Pharmacovigilance AI &middot; Report ID: {report_id}. Do not reply to this email.
            </div>
          </div>
        </body>
        </html>
        """

    # 5. Send site-specific emails to each doctor
    for site_id, site_patients in by_site.items():
        doctor = SITE_DOCTOR_MAP.get(site_id)
        if doctor:
            try:
                html = build_html(doctor["name"], doctor["hospital"], site_patients, report_id, is_doctor=True)
                mail = Mail(
                    from_email=Email(from_email_address),
                    to_emails=To(doctor["email"]),
                    subject=f"🚨 URGENT: {len(site_patients)} Patient(s) AT RISK — {doctor['hospital']}",
                    html_content=html
                )
                resp = sg.client.mail.send.post(request_body=mail.get())
                logger.info(f"[Agent4] Doctor alert sent to {doctor['email']} ({site_id}) — {len(site_patients)} patients. Status: {resp.status_code}")
            except Exception as e:
                logger.error(f"[Agent4] Failed to email doctor for {site_id}: {str(e)}")

    # 6. Send full summary to Data Manager (all flagged across all sites)
    try:
        all_patients_html = build_html(DATAMANAGER_NAME, "All Sites", enriched, report_id, is_doctor=False)
        mail = Mail(
            from_email=Email(from_email_address),
            to_emails=To(DATAMANAGER_EMAIL),
            subject=f"🚨 URGENT: {total_flagged} Patient(s) AT RISK Across All Sites — GlucoZen Phase III",
            html_content=all_patients_html
        )
        resp = sg.client.mail.send.post(request_body=mail.get())
        logger.info(f"[Agent4] Data Manager summary sent to {DATAMANAGER_EMAIL} — {total_flagged} patients total. Status: {resp.status_code}")
    except Exception as e:
        logger.error(f"[Agent4] Failed to email Data Manager: {str(e)}")

    return report_id
