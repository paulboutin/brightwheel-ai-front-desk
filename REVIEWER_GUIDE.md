# Try the parent-to-staff improvement loop

**[Open Little Grove](https://brightwheel-ai-front-desk.onrender.com/)** · Allow about 5–7 minutes · [Project overview](README.md) · [One-page explanation](output/pdf/little-grove-explanation.pdf)

These two scenarios demonstrate an answer from an existing policy, a deliberate knowledge gap, and a staff response that becomes a reusable policy. All center details and dates below are fictional.

## Before you start

- Keep the demo in the **same browser tab** while switching between **For parents** and **Staff workspace**. Both perspectives share browser-local data; another device or browser will not see your edits.
- Use `parent@example.com` for the reply request. No email is sent, no real center is notified, and the staff switch is not authentication.
- Start without a published winter-break policy. If you have already completed this walkthrough, a separate browser profile provides a fresh sandbox without removing your earlier work.
- The first AI search downloads the model and can take a moment. Look for **AI search ready · on this device** after the answer. **Basic search · AI unavailable** means fallback search was used; it does not demonstrate model retrieval.

## Scenario 1 — Find an existing policy

In **For parents**, select **Ask a question** (or reopen the chat and choose **New question**). Enter:

> How much would preschool set us back every month?

**What to look for:** The answer cites **Tuition & billing**, including the published preschool rate of **$1,450 per month** and toddler rate of **$1,650 per month**. Open the source to inspect its version and approved wording.

This question paraphrases the policy examples. MiniLM finds the related policy; the answer is the staff-approved text, not generated prose. The related-policy notice asks you to check whether the policy covers your question. The system does not calculate an individual family's bill.

## Scenario 2 — Answer once, help the next family

### 1. Ask a question the current policies cannot answer

Select **New question** and enter:

> Are you open during winter break?

**What to look for:** The front desk says it does not have a published answer. It should not infer holiday availability from normal weekday hours.

Choose **Request an email reply**. Enter `parent@example.com`, check the opt-in box, and select **Save demo reply request**. The parent has requested an asynchronous reply; they do not need to keep the chat open while waiting for staff.

### 2. Reply from the staff perspective

Switch to **Staff workspace → Question inbox**. Expand the newly submitted winter-break question with **Waiting for an email reply**. There is also a preloaded winter-break sample; choose your new request with the fictional email address.

Select **Reply by email** and paste this fictional response into **Your email reply**:

> Little Grove will be closed from December 24, 2026 through January 1, 2027, inclusive. Regular hours resume on January 4, 2027. There is no childcare during this closure.

Select **Simulate reply & draft FAQ**.

**What to look for:** The response is saved as a simulated email reply, and a separate FAQ draft opens. Replying alone does not publish anything for other families.

### 3. Review and publish the reusable policy

The draft contains the reply and original question. Complete it as follows:

| Field               | Value                              |
| ------------------- | ---------------------------------- |
| **Policy title**    | `Winter break closure: 2026–27`    |
| **Category**        | `Daily essentials`                 |
| **Approved answer** | Keep the fictional response above. |

In **Questions this policy answers**, put these on separate lines:

```text
Are you open during winter break?
What dates is the center closed for winter break?
```

Select **Publish for parents**. Check **I've reviewed this answer for all families and removed private details**, then select **Publish policy**.

**What to look for:** The new FAQ is available under **Center policies**. This structured policy library is the prototype's source of truth; the walkthrough does not upload or rewrite a handbook file. Publication is an explicit staff decision, separate from the reply.

### 4. Return to the parent and close the loop

Switch to **For parents** and reopen the chat. The original request now includes the saved simulated staff reply; **History** also lets you reopen that request. Its earlier “no published answer” response remains intact as a historical record.

Select **New question** and ask the same question again:

> Are you open during winter break?

**Expected result:** The newly published closure policy answers immediately, with its source and version. An exact authored question uses a direct lookup.

To demonstrate AI retrieval of the new policy, select **New question** once more and ask this different wording, which you did not add to the draft:

> Which days will you be closed over winter break?

**Expected result:** AI search retrieves the new closure policy as related guidance, including the approved dates and citation. No developer action or redeployment is needed.

## What happens when staff publish?

1. **The source of truth changes.** Publishing saves the policy and increments its version in this browser. Drafts are excluded from parent answers.
2. **The next semantic search refreshes the index.** The background worker compares the eligible published policies with its cached index signature, including policy IDs, versions, titles, example questions, and publication status. When that set changes, it rebuilds the embeddings for those policy titles and example questions before matching the new question.
3. **The answer stays controlled by staff.** The model retrieves a policy; the app displays its current approved answer verbatim. Answer paragraphs and private replies are not embedded as search examples. Earlier answers retain their original source snapshots.

This is **search-index refresh, not model retraining**. MiniLM's weights do not change. The same model is reused, and the work runs in a browser worker. Exact authored questions bypass semantic search, which is why the final paraphrase is useful to try.

## What this demonstrates

The parent gets a grounded answer or an honest acknowledgment of a gap. Staff can respond on their own schedule, review the answer for general use, and publish it so the next family can get help automatically. The working retrieval and publication loop is real; authentication, shared storage, and email delivery remain outside this browser-local prototype.
