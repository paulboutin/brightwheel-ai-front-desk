# Little Grove — AI Front Desk

A mobile-friendly **public AI front desk** for a fictional childcare center, built for the brightwheel engineering manager exercise. Parents find staff-approved policy answers; staff see unanswered questions, publish improvements, and test the next answer. This is an independent exercise, not an official brightwheel product.

**[Open the hosted prototype](https://brightwheel-ai-front-desk.onrender.com)** · [One-page explanation](output/pdf/little-grove-explanation.pdf)

## Project outline: what this prototype represents

**Product context:** a public front desk for prospective and enrolled families asking general questions about the center. It is **not an authenticated parent portal**, a child-record system, or a secure teacher messaging service. The assignment leaves the access model open; this is our deliberate scope choice.

**Public questions:** hours, tuition, meals, nut awareness, gluten-free accommodation requests, tours, emergency procedures, and medication administration policies. Answers use published fictional policy text. Unanswered general questions can request a clearly simulated email reply; staff can turn a reviewed response into a reusable FAQ.

**Questions about an enrolled child:** direct the family to its center’s **existing authenticated parent portal**. In that system, the signed-in parent’s identity and authorized child relationship would accompany the message, and teachers would see only conversations they are allowed to access. Names are neither proof of identity nor a reliable way to detect personal information. Reports of immediate danger receive urgent guidance even without a child’s name.

**Demo boundary:** the staff switch, inbox, email replies, and policy edits are a browser-local simulation, with no authentication or protected teacher accounts. No question is forwarded to an actual teacher or portal. Little Grove is fictional, so no portal URL is invented. Newly recognized personal or urgent questions keep only a routing label in demo history; detection remains incomplete. Do not enter real family data.

This scope demonstrates policy grounding and the operator improvement loop while leaving authenticated child-specific communication to an existing system. Production integration would require verified family/child relationships, staff authorization, tenant isolation, retention controls, and auditable message delivery. A secure staff screen alone would not authenticate a public sender.

## Try the complete loop

1. In **For parents**, select **Browse Hours & drop-off** to open the chat panel. Open the citation to inspect the policy version.
2. Ask **“Do I need to put together a packed lunch each morning?”** to exercise real local AI retrieval. The first model download takes longer; later searches reuse it.
3. Ask **“Are you open during winter break?”**. No holiday policy is published, so the system abstains. Choose **Request an email reply**, enter `parent@example.com`, and explicitly opt in. This is asynchronous and clearly simulated; no email is sent.
4. Switch to **Staff workspace**, expand that question, and choose **Reply by email**. Write a fictional response and choose **Simulate reply & draft FAQ**. Review the prefilled answer for all families, add a title, and explicitly approve it for publication. Private replies alone never become AI knowledge.
5. Test the question again. The new answer cites the new policy. The original conversation retains the old answer; the reply request is resolved independently of FAQ publication. Saved questions and requests remain accessible after reload.
6. Try **“My child has a fever, can she attend?”** or **“My child cannot breathe”** to inspect private/urgent handling. Personal questions point to the existing parent portal and retain only a routing label. Emergency guidance does not offer asynchronous email as a substitute for immediate help. Also ask **“What is your emergency procedure?”** and **“Does the center administer medication?”**: both return general published policies.

Try the reported regression: **“If my child needs assistance with eating lunch can I count on someone being there for her?”** It remains visible as a knowledge gap until staff publish suitable guidance; ordinary eating assistance is no longer treated as a health decision. Older questions whose wording was discarded cannot be recovered.

The front desk opens in an in-page panel. Close it to browse the center and reopen it to continue; a **Response ready** badge appears if an AI answer finishes while closed or a simulated staff reply is saved. Topic shortcuts and **All topics** start a fresh conversation. **History** opens earlier questions individually, including reply requests. **New question** clears only the current view.

Every reviewer gets their own browser-local sandbox. Three entries are explicitly labeled sample data. Reset restores the original nine policies and three questions. The staff switch is a demo perspective, **not authentication**. No real messages or emergency alerts are sent.

## Run locally

Use Node 24 (Node 22.12+ supported).

```sh
npm ci
npm run dev
```

```sh
npm run check     # lint, 143 unit cases, TypeScript, production build
npm run eval:ai   # 30 real-model retrieval cases; downloads the pinned model
npm run preview  # serve the production build locally
```

No API keys or environment variables are needed. Dependency versions are locked. Render builds with `npm ci && npm run check` and serves `dist/`. GitHub Actions runs the same checks on pushes and pull requests. The initial Render service uses the public repository URL, so deploys are manual until the new repository is added to the existing GitHub/Render connection. `render.yaml` records the service configuration; the live service belongs to the separate **Brightwheel AI Front Desk / Prototype** project environment.

## AI and grounding

This is **semantic retrieval, not generated prose**. The quantized `Xenova/all-MiniLM-L6-v2` model runs through Transformers.js in a Web Worker. Question embeddings are compared with published policy titles and example questions. The model revision is pinned in `src/lib/retrieval.ts`.

- Safety rules run before retrieval. Recognized emergencies receive urgent contact guidance. Recognized individual health, account, custody, and other personal questions are directed to the family’s existing authenticated portal. General emergency and medication questions remain answerable; the word “emergency” alone is not a report of danger.
- An exact staff-authored question returns the approved answer. Conflicting exact answers cause abstention.
- Natural-language paraphrases use similarity plus a separation margin. Common specific topics (e.g. snow days versus ordinary opening hours) require coverage in the candidate policy. These are finite heuristics, not a complete understanding of intent.
- Semantic results are always labeled **Related policy**, not confidence percentages or proof that every detail was answered. Weak or ambiguous matches abstain.
- Responses quote the approved answer verbatim and retain its source/version snapshot. AI cannot invent a fee, change a rule, authorize pickup, or make a booking.
- Published edits invalidate the embedding index on the next search. Withdrawn policies are excluded. Older citations remain historical snapshots.
- On model failure or a 45-second timeout, clearly labeled basic keyword search and the policy library remain usable. Coverage guards still apply. The app never silently claims AI succeeded.

The real-model evaluation includes dietary paraphrases and missing-policy questions. Parent testing exposed unanswered nut-free/gluten-free questions: explicit examples and approved dietary guidance address that gap, without lowering the relevance threshold or promising safe meals for an individual child. Uncovered diets (such as dairy-free, vegan, kosher, or sesame-free) still abstain. An untouched original meals policy upgrades on reload; staff edits and withdrawals are preserved, as are older answer citations. It caught snow-day/illness and holiday/hours confusion; coverage checks and an ambiguity margin addressed those cases. **30/30 passing is a small regression set used during development, not an independent accuracy estimate.** Scores can vary slightly by inference backend. Browser testing also exercised actual WASM inference, policy publication, persistence after reload, source inspection, and the 390-pixel mobile layout.

## Privacy, cost, and boundaries

- No backend, child records, analytics, cloud inference, authentication, or shared database. Questions stay on the device; localStorage retains at most 200 entries. A blocked or full store produces a visible warning.
- General questions retain their wording so operators can improve the policies. Newly recognized personal and urgent questions retain only a routing label, with no public email handoff. Older demo entries may still contain original wording; reset the demo to clear them. Common email and telephone patterns are removed from question text. An explicitly opted-in email address is stored separately with a consent timestamp and never embedded or copied into an FAQ. Canceling a pending request removes its address. This **does not comprehensively detect personal data**. The UI asks users not to enter it. Anyone with access to the browser profile can inspect its demo data.
- The browser downloads model assets from Hugging Face and runtime assets from hosting/CDN infrastructure. Google Fonts supplies fonts. Those hosts receive normal request metadata, but question text is not sent to them.
- The first AI request downloads a quantized model (about 23 MB) plus the WASM runtime; downloads may be slow or blocked. There is no per-question inference fee. Render static hosting uses the free static-site offering, subject to account bandwidth and build allowances.
- Questions are independent, in English, and retrieve at most one policy. There is no conversational memory, translation, voice, ingestion, or real email delivery. The asynchronous email-request and staff-reply workflow is simulated within one browser.
- Safety rules are incomplete, as are the specificity checks. A published policy can itself be wrong; local demo edits are not access controlled. This is not suitable for real parent data or unattended production use.

## What comes next

Start with a small operator pilot and a held-out evaluation of real, de-identified parent questions. Measure unsupported-answer rate, successful handoff, explicit helpfulness, and repeated gaps; avoid treating “a policy was shown” as resolution. Then add authenticated roles, durable tenant-isolated storage, policy approval/audit history, an authenticated email queue with delivery/retry status, retention controls, and broader safety evaluation. Test language accessibility and low-end mobile performance before adding ingestion or voice.

## Structure

- `src/lib/answer.ts` — safety, exact grounding, snapshots, redaction
- `src/lib/retrieval.ts` — model pin, coverage checks, selection thresholds
- `src/lib/semantic.worker.ts` — local embedding inference and index invalidation
- `src/lib/semantic.ts` — worker lifecycle, timeout, and fallback signaling
- `src/lib/staff.ts` — opt-in reply requests, cancellation, simulated delivery, explicit FAQ drafting
- `src/lib/storage.ts` — validated browser persistence and retention
- `src/lib/data.ts` — nine fictional policies and labeled sample questions
- `src/components/` — accessible dialog and policy editor
- `scripts/evaluate-search.mjs` — executable real-model regression cases

## Context and implementation

brightwheel emphasizes saving operators time and organizing family communication with administrator visibility. That informed the explicit parent/staff perspectives and the practical question-to-policy loop. Implementation and debugging were assisted by Codex, including actual model evaluation and browser verification. No private brightwheel data was used.

- [brightwheel family communication](https://mybrightwheel.com/communication/)
- [brightwheel messaging roles and administrator visibility](https://help.mybrightwheel.com/en/articles/2098452-start-messaging-in-brightwheel)
- [Transformers.js](https://huggingface.co/docs/transformers.js/index)
- [MiniLM model and Apache 2.0 license](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
- [Render free hosting limits](https://render.com/docs/free)
