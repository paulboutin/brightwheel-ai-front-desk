"""Reproduce the one-page explanation. Requires reportlab and pypdf."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.pagesizes import letter
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'output/pdf/little-grove-explanation.pdf'
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
green = colors.HexColor('#254b40')
muted = colors.HexColor('#637568')
body = ParagraphStyle('Body', fontName='Helvetica', fontSize=10, leading=14, textColor=colors.HexColor('#344b3e'), spaceAfter=8)
heading = ParagraphStyle('Heading', parent=body, fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=green, spaceBefore=7, spaceAfter=5)
meta = ParagraphStyle('Meta', parent=body, fontSize=9, leading=12, textColor=muted)
title = ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=29, leading=34, textColor=green, spaceAfter=8)

def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor('#dce5d7'))
    canvas.line(48, 40, 564, 40)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(muted)
    canvas.drawString(48, 27, 'Paul Boutin | Independent brightwheel engineering exercise | Fictional data only')
    canvas.drawRightString(564, 27, '1 / 1')

story = [Paragraph('LITTLE GROVE / AI FRONT DESK', meta), Spacer(1, 5),
         Paragraph('Clear answers. Human judgment.', title),
         Paragraph('Public policy answers for families. Personal questions belong in their secure portal.', body),
         HRFlowable(width='100%', thickness=1, color=colors.HexColor('#dce5d7')), Spacer(1, 9)]
sections = [
 ('Scope: a public front desk, not a parent portal',
  'This prototype helps prospective and enrolled families ask general questions about a fictional center. The assignment leaves the access model open; a public front desk is a deliberate scope choice. Nine policies cover hours, tuition, meals, nut awareness, gluten-free requests, tours, emergencies, and medication administration. Child-specific conversations belong in the center’s existing authenticated parent portal. That portal is outside this prototype: no login, child records, or secure teacher messaging is implemented or connected.'),
 ('Where AI helps, and where it stops',
  'A quantized MiniLM model runs in a browser worker to match natural wording to published policy examples. Answers use the exact approved text with a source and version. Semantic matches are labeled related guidance; weak or ambiguous matches abstain. General emergency and medication questions get policy answers. Reports of immediate danger receive urgent guidance even without a name. Personal care decisions point to the existing portal. Name and intent rules are incomplete; names are never proof of identity.'),
 ('Parent experience and operator control',
  'Parents open or close an in-page chat panel, switch topics without stacking conversations, and revisit saved questions. General unanswered questions can request a simulated email reply. Operators see gaps and feedback, reply, and turn a reviewed answer into an FAQ draft. Publication requires explicit review for all families; private replies never become knowledge automatically. New questions use current policies while earlier answers preserve their citations. Newly recognized personal or urgent questions retain only a routing label; no personal message is forwarded.'),
 ('Technical choices and honest boundaries',
  'React, TypeScript, static Render hosting, and browser-local storage make each reviewer’s demo inexpensive and independent. The staff switch and email delivery are simulations, not protected accounts or real notifications. In a production portal, verified parent/child relationships and staff permissions would identify the sender and limit access; a secure staff screen alone cannot authenticate a public sender. No question text goes to a cloud model. First use downloads model/runtime assets; failures fall back to labeled basic search. Do not enter real family data; detection and redaction are incomplete.'),
 ('Validation, tradeoffs, and next steps',
  'Codex assisted implementation and debugging. Validation includes 143 unit cases, a production build, 30 real-model retrieval cases, and browser checks of mobile layout, persistence, publication, and routing. Parent testing exposed lunch-assistance overclassification and missing nut-free/gluten-free answers. Fixes add explicit dietary guidance and examples without guaranteeing an individual meal is safe; uncovered diets still abstain. This small development set is not an independent accuracy estimate. Next: a held-out evaluation and operator pilot, then an authorized existing-portal integration, durable tenant-isolated storage, audit history, delivery status, and retention controls. No portal URL is invented for this fictional center.'),
]
for label, text in sections:
    story.extend([Paragraph(label, heading), Paragraph(text, body)])
story.append(Spacer(1, 4))
story.append(Paragraph('Source and run instructions: <link href="https://github.com/paulboutin/brightwheel-ai-front-desk" color="#24685c">github.com/paulboutin/brightwheel-ai-front-desk</link>', meta))
story.append(Paragraph('Context: <link href="https://mybrightwheel.com/communication/" color="#24685c">brightwheel family communication</link> - saving staff time while keeping family communication visible and organized.', meta))
SimpleDocTemplate(str(OUTPUT), pagesize=letter, rightMargin=48, leftMargin=48, topMargin=39, bottomMargin=51,
                  title='Little Grove AI Front Desk - Decisions and Tradeoffs', author='Paul Boutin').build(story, onFirstPage=footer, onLaterPages=footer)
pdf = PdfReader(str(OUTPUT))
assert len(pdf.pages) == 1, f'Expected one page, got {len(pdf.pages)}'
(ROOT / 'public/explanation.pdf').write_bytes(OUTPUT.read_bytes())
print(f'Created {OUTPUT}; verified one page.')
