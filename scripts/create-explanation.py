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
         Paragraph('A focused prototype for families and the people running their center.', body),
         HRFlowable(width='100%', thickness=1, color=colors.HexColor('#dce5d7')), Spacer(1, 9)]
sections = [
 ('The customer problem and scope',
  'Parents need a quick, dependable answer; operators need fewer repeat interruptions and a way to fix recurring gaps. This prototype finishes one loop: ask a question, inspect a cited policy, request an asynchronous email reply, publish an improvement, and test again. Seven fictional policies cover everyday questions. Text and topic shortcuts keep the mobile experience simple; voice and document ingestion are intentionally out of scope.'),
 ('Where AI helps, and where it stops',
  'A small, quantized MiniLM model runs in a browser worker to match natural wording to staff-authored policy examples. Answers use the exact approved text, with a source and version. Semantic matches are labeled related guidance, not verified answers. Weak or ambiguous matches abstain. Topic-coverage checks prevent ordinary opening hours from answering holiday questions. Recognized emergencies and individual medical, custody, or account questions take a separate human-help path before retrieval. No model generates prices, grants exceptions, or authorizes pickup.'),
 ('Operator control and visible quality',
  'The inbox retains question wording so staff can act on gaps and negative feedback. Parents may explicitly request an email reply; their address and consent are kept separate from AI search. Staff simulate a personal email response, then optionally turn it into a reviewed FAQ draft. Replies never become shared knowledge automatically: staff must approve and publish guidance for all families. New questions use the latest policy; previous answers retain their citation. Pending requests cannot be closed as reviewed without a reply. Email delivery is clearly labeled simulated.'),
 ('Technical choices and limits',
  'React and TypeScript, a static Render deployment configuration, and browser-local storage keep the demo inexpensive and isolated for each reviewer. No API key, per-question inference fee, or cloud transmission of question text is needed. First use downloads model/runtime assets; network hosts receive normal request metadata. A timeout or model error falls back to labeled basic search. Sensitive questions remain visible for staff review; basic email/phone redaction is incomplete. The public staff switch is simulated access, not authentication. There is no shared database, real notification, or conversational memory; this is not ready for real parent data.'),
 ('Validation, tradeoffs, and next steps',
  'Codex assisted implementation and debugging. Validation includes 82 unit cases, a production build, 16 real-model retrieval cases, and browser checks of local inference, mobile layout, persistence, and the question-to-policy loop. Testing caught snow-day confusion and an overly broad health rule for lunch assistance; both drove fixes. This small development set is not an independent accuracy estimate; heuristic safety and retrieval remain limited. Next: a held-out set of de-identified parent questions, an operator pilot, then authenticated roles, tenant-isolated persistence, policy approval history, real handoffs, and retention controls.'),
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
