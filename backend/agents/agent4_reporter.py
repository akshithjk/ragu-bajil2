import os
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import AsyncSessionLocal
from db.models import PVReport
import google.generativeai as genai

logger = logging.getLogger(__name__)

async def generate_and_send_pv_report(evaluations, trial_id, new_rule_id, run_id):
    """
    Agent 4 logic:
    1. Generate PV narrative via Gemini 2.0 Flash
    2. Create PVReport in DB
    3. Send email to PIs via SendGrid
    """
    
    # Generate Narrative via Gemini (DEFERRED to PDF Download to save quota)
    ai_summary = None

    # 1. Create DB record
    async with AsyncSessionLocal() as db:
        new_report = PVReport(
            trial_id=trial_id,
            rule_id=new_rule_id,
            run_id=run_id,
            status="GENERATED",
            severity_breakdown={"AT_RISK": len(evaluations)},
            report_html=ai_summary
        )
        db.add(new_report)
        await db.commit()
        await db.refresh(new_report)
        report_id = new_report.id
    
    # 2. Send Email via SendGrid
    sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
    from_email_address = os.environ.get('SENDGRID_FROM_EMAIL', 'suzxxpro@gmail.com')
    
    if not sendgrid_api_key or sendgrid_api_key == "SG.your_sendgrid_api_key_here":
        logger.warning("SENDGRID_API_KEY not found. Skipping email dispatch.")
        return report_id
        
    try:
        sg = sendgrid.SendGridAPIClient(api_key=sendgrid_api_key)
        
        demo_emails = ["suzxxpro@gmail.com", "sathwikbhat2@gmail.com"]
        
        for email in demo_emails:
            from_email = Email(from_email_address)
            to_email = To(email)
            subject = f"URGENT: PV Safety Report - Trial {trial_id} - New Rule Violations"
            content = Content(
                "text/html", 
                f"""
                <html>
                <body>
                    <h2>Pharmacovigilance Alert</h2>
                    <p>A new regulatory rule has been applied to Trial {trial_id} by the AI Pipeline.</p>
                    <p><strong>{len(evaluations)} patients</strong> have been newly flagged as AT RISK based on recent biomarker readings.</p>
                    <p>Please log in to the ReguVigil dashboard to download the full PDF safety report and approve the rule deployment.</p>
                    <br>
                    <a href="http://localhost:3000/dashboard/manager">View Data Manager Dashboard</a>
                </body>
                </html>
                """
            )
            
            mail = Mail(from_email, to_email, subject, content)
            
            response = sg.client.mail.send.post(request_body=mail.get())
            logger.info(f"Email sent to {email}. Status Code: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Failed to send email via SendGrid: {str(e)}")
        
    return report_id
