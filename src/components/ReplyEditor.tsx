import { useState } from "react";
import { BookOpen, Mail } from "lucide-react";
import type { Entry } from "../lib/types";
import { hasHiddenQuestion } from "../lib/staff";
import Modal from "./Modal";
export default function ReplyEditor({
  entry,
  close,
  save,
}: {
  entry: Entry;
  close: () => void;
  save: (text: string, draftFaq: boolean) => void;
}) {
  const [text, setText] = useState("");
  const hidden = hasHiddenQuestion(entry);
  const pending = entry.emailFollowUp?.status === "pending";
  return (
    <Modal title="Reply by email" close={close}>
      <form
        className="policy-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) save(text, false);
        }}
      >
        <div className="original-question">
          <span className="eyebrow">Parent’s question</span>
          <p>{entry.question}</p>
        </div>
        {hidden && (
          <div className="muted-note">
            The old version did not retain this question. Ask the parent to
            resend it; its wording cannot be recovered.
          </div>
        )}
        <p>
          <strong>To:</strong> {entry.emailFollowUp?.email}
          <br />
          <small>
            The parent opted in to an email reply about this question.
          </small>
        </p>
        <div className="muted-note">
          Simulated delivery: your reply will be saved in this browser. No email
          is sent. This personal reply is never used automatically to answer
          other families.
        </div>
        <label>
          Your email reply
          <textarea
            required
            maxLength={1500}
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Answer the question, or explain the next step."
          />
        </label>
        <div className="muted-note">
          <BookOpen size={17} /> A common question? Open an FAQ draft after
          replying. Review it for all families before publishing.
        </div>
        <div className="modal-actions reply-editor-actions">
          <button
            className="secondary"
            type="button"
            disabled={!text.trim() || hidden || !pending}
            onClick={() => save(text, true)}
          >
            Simulate reply & draft FAQ
          </button>
          <button
            className="primary"
            type="submit"
            disabled={!text.trim() || !pending}
          >
            <Mail size={16} /> Simulate email reply
          </button>
        </div>
      </form>
    </Modal>
  );
}
