"""Generate 4 realistic FDA/EMA regulatory PDFs for hackathon demo."""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

def make_styles():
    s = getSampleStyleSheet()
    styles = {
        'agency': ParagraphStyle('agency', fontSize=9, textColor=colors.HexColor('#1a3a6e'), alignment=TA_CENTER, fontName='Helvetica'),
        'doctitle': ParagraphStyle('doctitle', fontSize=15, textColor=colors.HexColor('#0d2b5e'), alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=6),
        'docmeta': ParagraphStyle('docmeta', fontSize=8, textColor=colors.HexColor('#555555'), alignment=TA_CENTER, fontName='Helvetica'),
        'h2': ParagraphStyle('h2', fontSize=11, textColor=colors.HexColor('#0d2b5e'), fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=4),
        'h3': ParagraphStyle('h3', fontSize=10, textColor=colors.HexColor('#1a3a6e'), fontName='Helvetica-Bold', spaceBefore=8, spaceAfter=3),
        'body': ParagraphStyle('body', fontSize=9, fontName='Helvetica', leading=14, alignment=TA_JUSTIFY),
        'rule_box': ParagraphStyle('rule_box', fontSize=9, fontName='Helvetica-Bold', textColor=colors.HexColor('#7b0000'), leading=14),
        'footer': ParagraphStyle('footer', fontSize=7, textColor=colors.gray, alignment=TA_CENTER),
        'warning': ParagraphStyle('warning', fontSize=9, fontName='Helvetica-Bold', textColor=colors.HexColor('#7b4000'), alignment=TA_CENTER),
    }
    return styles

def fda_header(story, S, title, docref, date, status, emergency=False):
    story.append(Paragraph("U.S. DEPARTMENT OF HEALTH AND HUMAN SERVICES", S['agency']))
    story.append(Paragraph("Food and Drug Administration (FDA) • Center for Drug Evaluation and Research (CDER)", S['agency']))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0d2b5e')))
    story.append(Spacer(1, 6))
    if emergency:
        story.append(Paragraph("⚠ URGENT SAFETY COMMUNICATION — IMMEDIATE ACTION REQUIRED ⚠", S['warning']))
        story.append(Spacer(1, 4))
    story.append(Paragraph(title, S['doctitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0d2b5e')))
    story.append(Spacer(1, 6))
    meta = [
        ['Document Reference:', docref, 'Effective Date:', date],
        ['Classification:', 'PUBLIC', 'Status:', status],
    ]
    t = Table(meta, colWidths=[1.4*inch, 2.0*inch, 1.4*inch, 2.0*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,0), (0,-1), colors.HexColor('#0d2b5e')),
        ('TEXTCOLOR', (2,0), (2,-1), colors.HexColor('#0d2b5e')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

def rule_table(story, biomarker, operator, old_val, new_val, unit, phase, confidence_note=""):
    data = [
        ['Parameter', 'Previous Rule', 'NEW Requirement', 'Phase'],
        [biomarker, f'{operator} {old_val}{unit}', f'{operator} {new_val}{unit}', phase],
    ]
    t = Table(data, colWidths=[1.5*inch, 1.5*inch, 1.8*inch, 1.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0d2b5e')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BACKGROUND', (2,1), (2,1), colors.HexColor('#ffe5e5')),
        ('FONTNAME', (2,1), (2,1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (2,1), (2,1), colors.HexColor('#7b0000')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t)
    if confidence_note:
        story.append(Spacer(1, 4))
        story.append(Paragraph(confidence_note, ParagraphStyle('cn', fontSize=8, textColor=colors.gray, fontName='Helvetica-Oblique')))

def footer(story, S, docref, page="1"):
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.gray))
    story.append(Paragraph(f"{docref} | Page {page} | This document is the property of the U.S. Food and Drug Administration. Unauthorized reproduction is prohibited.", S['footer']))

# ─────────────────────────────────────────────
# PDF 1: HRV threshold raised to 30ms (v1.4)
# Confidence: ~0.93 | High | More patients flagged
# ─────────────────────────────────────────────
def make_pdf1():
    doc = SimpleDocTemplate("FDA_Cardiac_Safety_Update_v14.pdf", pagesize=letter,
                            rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    S = make_styles()
    story = []
    fda_header(story, S,
        "GUIDANCE FOR INDUSTRY\nCardiovascular Safety Monitoring in Phase III Hypoglycemic Trials",
        "FDA-CDER-2026-CARD-004", "June 1, 2026", "FINAL (Rule v1.4)")

    story.append(Paragraph("1. INTRODUCTION", S['h2']))
    story.append(Paragraph(
        "The Food and Drug Administration (FDA) is issuing this final guidance to assist sponsors "
        "conducting Phase III clinical trials for investigational hypoglycemic agents. This document "
        "revises the cardiac safety monitoring parameters established in Rule v1.3 (October 2024) and "
        "supersedes those thresholds in their entirety.", S['body']))

    story.append(Paragraph("2. BACKGROUND", S['h2']))
    story.append(Paragraph(
        "Post-market telemetry data aggregated from 9 ongoing Phase III trials demonstrates a statistically "
        "significant correlation between suppressed HRV SDNN values and silent ischemic events. A meta-analysis "
        "of 3,812 patient-years of wearable data revealed that subjects with HRV SDNN between 28ms and 30ms "
        "experienced a 17.4% higher rate of Grade 2+ adverse cardiac events compared to subjects above 30ms. "
        "These findings necessitate an upward revision of the safety flagging threshold.", S['body']))

    story.append(Paragraph("3. REVISED MONITORING REQUIREMENT", S['h2']))
    story.append(Paragraph("3.1. HRV SDNN Threshold — MANDATORY REVISION", S['h3']))
    story.append(Paragraph(
        "Effective June 1, 2026, all sponsors must update their pharmacovigilance and EDC systems to implement "
        "the following revised safety stopping criterion. The biomarker of interest is HRV_SDNN (Standard "
        "Deviation of NN Intervals). The new threshold is defined as follows:", S['body']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "MANDATORY: Any trial subject whose HRV_SDNN value is Less Than (LT) 30 milliseconds, calculated "
        "over a 30-day rolling average, MUST be immediately classified as AT RISK. This replaces the "
        "previous threshold of less than 28 milliseconds (Rule v1.3). The new rule version is v1.4. "
        "This applies to all Phase II and Phase III trial subjects.", S['rule_box']))
    story.append(Spacer(1, 8))
    rule_table(story, "HRV_SDNN", "LT", "28ms", "30ms", "", "Phase II / III",
               "Source: FDA-CDER meta-analysis of 9 active Phase III trials, N=3,812 patient-years.")

    story.append(Paragraph("4. SPONSOR OBLIGATIONS", S['h2']))
    story.append(Paragraph(
        "All clinical sites and central pharmacovigilance vendors must implement Rule v1.4 by the effective "
        "date. Any subject newly flagged under this criterion must have study drug withheld pending PI review. "
        "An IND Safety Report must be submitted within 15 calendar days for any flagged subject who subsequently "
        "experiences a cardiovascular adverse event. Failure to comply may result in clinical hold under 21 CFR 312.42.", S['body']))

    story.append(Paragraph("5. REPORTING", S['h2']))
    story.append(Paragraph(
        "Sponsors must submit a cohort re-evaluation summary, including the count of newly flagged subjects "
        "under Rule v1.4, to the IND file within 10 business days of this guidance's effective date. "
        "Additional guidance is available from CDER.DMEP.Safety@fda.hhs.gov.", S['body']))

    footer(story, S, "FDA-CDER-2026-CARD-004")
    doc.build(story)
    print("✓ Created: FDA_Cardiac_Safety_Update_v14.pdf  [HRV_SDNN LT 30ms | Confidence ~0.93]")

# ─────────────────────────────────────────────
# PDF 2: EMA Draft - SpO2 monitoring (AMBIGUOUS)
# Confidence: ~0.58 → HUMAN REVIEW triggered
# ─────────────────────────────────────────────
def make_pdf2():
    doc = SimpleDocTemplate("EMA_SpO2_Draft_Consultation_2026.pdf", pagesize=letter,
                            rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    S = make_styles()
    story = []

    story.append(Paragraph("EUROPEAN MEDICINES AGENCY • Committee for Medicinal Products for Human Use (CHMP)", S['agency']))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#003399')))
    story.append(Spacer(1, 6))
    story.append(Paragraph("DRAFT CONCEPT PAPER\nRespiratory & SpO2 Monitoring in Metabolic Syndrome Trials", S['doctitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#003399')))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Reference: EMA/CHMP/2026-DRAFT-091 | Status: PUBLIC CONSULTATION — NOT ADOPTED | Date: April 20, 2026", S['docmeta']))
    story.append(Spacer(1, 10))

    story.append(Paragraph("IMPORTANT NOTICE", S['h2']))
    story.append(Paragraph(
        "This document is a DRAFT for public consultation only. It does NOT represent final adopted policy. "
        "Sponsors should NOT implement changes to automated pharmacovigilance systems based solely on this document.", S['body']))

    story.append(Paragraph("1. INTRODUCTION", S['h2']))
    story.append(Paragraph(
        "The intersection of metabolic syndrome and nocturnal hypoxia presents complex challenges in clinical "
        "drug development. Novel incretin mimetics may affect respiratory drive. The EMA is reviewing current "
        "monitoring standards to evaluate whether enhanced SpO2 monitoring should be mandated. This concept "
        "paper explores preliminary proposals and solicits expert opinion.", S['body']))

    story.append(Paragraph("2. PROPOSED MONITORING CONSIDERATIONS", S['h2']))
    story.append(Paragraph("2.1 — Preliminary Threshold Discussion (NOT FINAL)", S['h3']))
    story.append(Paragraph(
        "Retrospective EMPA-RESP registry analysis suggests patients with nocturnal SpO2 dipping below "
        "90% for periods exceeding 5 minutes may be at elevated cardiovascular risk. Some experts on the "
        "CHMP advisory panel advocate for a threshold of SpO2 less than 94%. Others in the registry "
        "working group suggest the intervention threshold may need to be below 96% to capture borderline "
        "hypoxemia. The exact threshold value remains under statistical review.", S['body']))

    story.append(Paragraph("2.2 — Conflicting Expert Opinions", S['h3']))
    story.append(Paragraph(
        "NOTE: As of the date of this draft, no consensus has been reached. Annex 3 (pending) will "
        "provide the final harmonized threshold value upon conclusion of expert consultation. The SpO2 "
        "biomarker (designated SpO2 in EDC systems) and operator (Less Than) are proposed, but the "
        "specific numeric cutoff — whether 90%, 94%, or 96% — remains unresolved pending final committee vote.", S['body']))

    story.append(Paragraph("3. NEXT STEPS", S['h2']))
    story.append(Paragraph(
        "Stakeholders are invited to submit responses to this concept paper by July 31, 2026. The CHMP "
        "secretariat will compile responses and publish a final adopted guideline in Q4 2026. Sponsors "
        "should refrain from unilateral system changes until the final document is adopted.", S['body']))

    footer(story, S, "EMA/CHMP/2026-DRAFT-091")
    doc.build(story)
    print("✓ Created: EMA_SpO2_Draft_Consultation_2026.pdf  [SpO2 AMBIGUOUS | Confidence ~0.58 → HUMAN REVIEW]")

# ─────────────────────────────────────────────
# PDF 3: Emergency HRV raised to 32ms (v1.5)
# Confidence: ~0.95 | Emergency | Most patients flagged
# ─────────────────────────────────────────────
def make_pdf3():
    doc = SimpleDocTemplate("FDA_Emergency_HRV_Alert_v15.pdf", pagesize=letter,
                            rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    S = make_styles()
    story = []
    fda_header(story, S,
        "URGENT SAFETY COMMUNICATION\nEmergency HRV Threshold Revision — Hypoglycemic Phase III Trials",
        "FDA-OSE-URGENT-2026-08-A", "IMMEDIATE — NO GRACE PERIOD", "EMERGENCY OVERRIDE (v1.5)",
        emergency=True)

    story.append(Paragraph("1. SUMMARY OF CRITICAL ISSUE", S['h2']))
    story.append(Paragraph(
        "The FDA Office of Surveillance and Epidemiology (OSE) is issuing this Emergency Safety Communication "
        "following a newly identified cluster of 14 acute myocardial infarctions and 6 cases of sudden cardiac "
        "death across three multi-national Phase III trials. Retrospective DMC analysis of wearable telemetry "
        "data from these patients revealed suppressed HRV SDNN values hovering between 30ms and 32ms — "
        "above the current v1.4 flagging threshold — which were therefore not automatically flagged by "
        "existing pharmacovigilance systems. This oversight necessitates an immediate emergency revision.", S['body']))

    story.append(Paragraph("2. MANDATORY EMERGENCY PROTOCOL MODIFICATION", S['h2']))
    story.append(Paragraph(
        "Effective immediately, under FDA authority 21 CFR 312.42, all active Phase II and Phase III trials "
        "for this drug class must implement the following emergency rule change. This is not optional:", S['body']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "EMERGENCY RULE v1.5: The biomarker HRV_SDNN must be evaluated using the Less Than (LT) operator "
        "against a new critical threshold of 32 milliseconds. This supersedes Rule v1.4 (threshold of 30ms) "
        "with immediate effect. Any trial subject with HRV_SDNN less than 32ms MUST be classified as AT RISK "
        "and study drug must be immediately withheld. Applicable to ALL enrolled Phase II and Phase III subjects. "
        "30-day rolling evaluation window applies.", S['rule_box']))
    story.append(Spacer(1, 8))
    rule_table(story, "HRV_SDNN", "LT", "30ms", "32ms", "", "ALL (Emergency)",
               "Source: FDA-OSE FAERS signal detection, N=23 adverse events across 3 Phase III trials.")

    story.append(Paragraph("3. REQUIRED SPONSOR ACTIONS — WITHIN 24 HOURS", S['h2']))
    for action in [
        "1. Immediately implement HRV_SDNN < 32ms (LT) as the new AT RISK flagging threshold in all EDC and pharmacovigilance systems.",
        "2. Execute a full cohort re-evaluation against the new 32ms threshold across all active trial participants.",
        "3. Withhold study drug from all newly flagged subjects pending in-person cardiovascular assessment.",
        "4. Submit IND Safety Report within 5 business days with count of newly flagged subjects.",
        "5. Notify all principal investigators at all trial sites by secure email within 24 hours."
    ]:
        story.append(Paragraph(action, S['body']))
        story.append(Spacer(1, 3))

    story.append(Paragraph("4. CONTACT", S['h2']))
    story.append(Paragraph("CDER.DMEP.Safety@fda.hhs.gov | Emergency Hotline: +1-855-543-3784 (24/7)", S['body']))

    footer(story, S, "FDA-OSE-URGENT-2026-08-A")
    doc.build(story)
    print("✓ Created: FDA_Emergency_HRV_Alert_v15.pdf  [HRV_SDNN LT 32ms | Confidence ~0.95 | EMERGENCY]")

# ─────────────────────────────────────────────
# PDF 4: Heart Rate monitoring (new biomarker)
# Heart_Rate GT 95 bpm → flags tachycardia patients
# Confidence: ~0.87
# ─────────────────────────────────────────────
def make_pdf4():
    doc = SimpleDocTemplate("FDA_Tachycardia_Monitoring_Guidance_2026.pdf", pagesize=letter,
                            rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    S = make_styles()
    story = []
    fda_header(story, S,
        "GUIDANCE FOR INDUSTRY\nResting Heart Rate Safety Thresholds in Oral Hypoglycemic Phase III Trials",
        "FDA-CDER-2026-TACHY-011", "September 1, 2026", "FINAL")

    story.append(Paragraph("1. INTRODUCTION", S['h2']))
    story.append(Paragraph(
        "This guidance establishes new safety requirements for monitoring resting Heart Rate (HR) in subjects "
        "enrolled in Phase III trials for novel oral hypoglycemic agents. Evidence from spontaneous adverse "
        "event reports and observational cohort studies indicates that drug-induced sympathomimetic activity "
        "may cause persistent sinus tachycardia, which if undetected, increases the risk of adverse cardiac "
        "remodeling over the trial duration.", S['body']))

    story.append(Paragraph("2. CLINICAL EVIDENCE", S['h2']))
    story.append(Paragraph(
        "Analysis of 2,103 subjects enrolled in the GLUCOZEN-SENTINEL and GLYCORA-PILOT trials revealed "
        "that 12.4% of subjects in the active treatment arm developed resting heart rates consistently "
        "above 95 beats per minute (bpm) within the first 90 days of treatment, compared to 3.1% in the "
        "placebo arm. Multivariate Cox regression confirmed this elevation was independently associated "
        "with a 2.3-fold increased risk of supraventricular tachyarrhythmias (SVT) at the 6-month "
        "safety follow-up visit.", S['body']))

    story.append(Paragraph("3. NEW HEART RATE MONITORING REQUIREMENT", S['h2']))
    story.append(Paragraph("3.1. Mandatory Safety Threshold", S['h3']))
    story.append(Paragraph(
        "Effective September 1, 2026, sponsors must implement a new continuous safety criterion for resting "
        "Heart Rate monitoring. The new requirement is defined as follows:", S['body']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "MANDATORY: Any trial subject whose resting Heart_Rate is Greater Than (GT) 95 beats per minute, "
        "as measured by a validated wearable device or clinic vital sign assessment, averaged over any "
        "30-day observation window during active treatment, MUST be classified as AT RISK and flagged "
        "in the sponsor's pharmacovigilance system. This is a new rule with no previous version — "
        "it introduces Heart_Rate as an independent monitoring biomarker. Applicable to all Phase III "
        "subjects. Operator: Greater Than (GT). Threshold: 95 bpm.", S['rule_box']))
    story.append(Spacer(1, 8))
    rule_table(story, "Heart_Rate", "GT", "N/A (new)", "95 bpm", "", "Phase III",
               "Source: GLUCOZEN-SENTINEL trial safety analysis, N=2,103 subjects, 6-month follow-up.")

    story.append(Paragraph("4. DEVICE STANDARDS", S['h2']))
    story.append(Paragraph(
        "Heart rate data from validated medical-grade wearables (Class IIa or above) is acceptable for "
        "regulatory purposes. Consumer-grade smartwatches are acceptable as a screening tool only. Any "
        "subject flagged using consumer-grade data must have the finding confirmed by a clinical-grade "
        "ECG or pulse oximeter reading before study drug is withheld.", S['body']))

    story.append(Paragraph("5. REPORTING", S['h2']))
    story.append(Paragraph(
        "Subjects flagged under this new Heart Rate criterion who subsequently develop SVT or other "
        "tachyarrhythmias must be reported via expedited IND Safety Report within 15 calendar days. "
        "Annual aggregate summaries must include Heart Rate flagging statistics in the DSUR.", S['body']))

    footer(story, S, "FDA-CDER-2026-TACHY-011")
    doc.build(story)
    print("✓ Created: FDA_Tachycardia_Monitoring_Guidance_2026.pdf  [Heart_Rate GT 95 bpm | Confidence ~0.87]")

if __name__ == "__main__":
    print("Generating 4 demo PDFs...\n")
    make_pdf1()
    make_pdf2()
    make_pdf3()
    make_pdf4()
    print("\n✅ All 4 PDFs generated successfully!")
    print("\n📋 DEMO CHEAT SHEET:")
    print("  PDF 1: FDA_Cardiac_Safety_Update_v14.pdf    → HRV_SDNN LT 30ms  | Confidence ~0.93 | Flags PT-0101, PT-0102, PT-0351 + more")
    print("  PDF 2: EMA_SpO2_Draft_Consultation_2026.pdf → SpO2 AMBIGUOUS     | Confidence ~0.58 | HUMAN REVIEW triggered")
    print("  PDF 3: FDA_Emergency_HRV_Alert_v15.pdf      → HRV_SDNN LT 32ms  | Confidence ~0.95 | MOST patients flagged (emergency)")
    print("  PDF 4: FDA_Tachycardia_Monitoring_2026.pdf  → Heart_Rate GT 95   | Confidence ~0.87 | Tachycardia patients flagged")
