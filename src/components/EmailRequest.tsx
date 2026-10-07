import { useState } from "react";
import { Mail } from "lucide-react";
import type { Entry } from "../lib/types";
import { validEmail } from "../lib/staff";
import Modal from "./Modal";

export default function EmailRequest({
  entry,
  close,
  save,
}: {
  entry: Entry;
  close: () => void;
  save: (email: string) => void;
}) {
  const [email, setEmail] = useState(entry.emailFollowUp?.email ?? "");
  const [consent, setConsent] = useState(false);
  return (
    <Modal title="Request an email reply" close={close}>
      <form
        className="policy-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (consent && validEmail(email)) save(email.trim());
        }}
      >
        <div className="original-question">
          <span className="eyebrow">Your question for the center</span>
          <p>{entry.question}</p>
        </div>
        <p>
          Staff can review your question and reply by email when available. You
          won’t need to keep the chat open. This is not an instant response or
          an emergency contact. For a question about your enrolled child, use
          your center’s authenticated parent portal instead of this public form.
        </p>
        <div className="muted-note">
          Demo only: this saves a request in this browser. No center is notified
          and no email will be sent. Use a fictional address such as
          parent@example.com.
        </div>
        <label>
          Email for this reply
          <input
            type="email"
            autoComplete="off"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="parent@example.com"
          />
        </label>
        <label className="publish-toggle">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          <span>
            I’d like the center to email me about this question. Share my
            question and this address with staff for this reply.
          </span>
        </label>
        <small>
          Your address is kept separate from policy content and AI search. You
          can cancel a pending request from your saved question.
        </small>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={close}>
            Not now
          </button>
          <button
            className="primary"
            type="submit"
            disabled={!consent || !validEmail(email)}
          >
            <Mail size={16} /> Save demo reply request
          </button>
        </div>
      </form>
    </Modal>
  );
}
