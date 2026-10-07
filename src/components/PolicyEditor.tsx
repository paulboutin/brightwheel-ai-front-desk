import { useState } from "react";
import { AlertTriangle, ArrowLeft, Check } from "lucide-react";
import type { Policy } from "../lib/types";
import Modal from "./Modal";

export default function PolicyEditor({
  policy,
  close,
  save,
  fromReply = false,
}: {
  policy: Policy;
  close: () => void;
  save: (p: Policy) => void;
  fromReply?: boolean;
}) {
  const [draft, setDraft] = useState(policy);
  const [generalUse, setGeneralUse] = useState(false);
  return (
    <Modal
      title={
        policy.version
          ? "Edit center policy"
          : "Give the next parent a better answer."
      }
      close={close}
    >
      <form
        className="policy-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (fromReply && draft.published && !generalUse) return;
          save(draft);
        }}
      >
        <p>
          Only published policies appear in parent answers. Changes take effect
          for new questions.
        </p>
        {fromReply && (
          <div className="muted-note">
            Turn this into guidance for all families. Remove names, individual
            circumstances, and private arrangements. A reply is not reusable
            until this FAQ is published.
          </div>
        )}
        <label>
          Policy title
          <input
            required
            maxLength={80}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="e.g. Holidays & closures"
          />
        </label>
        <label>
          Category
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          >
            <option>Daily essentials</option>
            <option>Health & safety</option>
            <option>Enrollment</option>
          </select>
        </label>
        <label>
          Approved answer
          <textarea
            required
            minLength={20}
            maxLength={1500}
            rows={6}
            value={draft.answer}
            onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
            placeholder="Write the exact answer parents should see. Include exceptions and when to contact staff."
          />
          <small>{draft.answer.length}/1,500 characters</small>
        </label>
        <label>
          Questions this policy answers
          <textarea
            required
            maxLength={1500}
            rows={3}
            value={draft.questions.join("\n")}
            onChange={(e) =>
              setDraft({ ...draft, questions: e.target.value.split("\n") })
            }
            placeholder="One question per line"
          />
          <small>
            Use parents’ wording. These examples help AI find this policy.
          </small>
        </label>
        <label className="publish-toggle">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) =>
              setDraft({ ...draft, published: e.target.checked })
            }
          />
          <span>
            <strong>Publish for parents</strong>
            <small>Turn off to save a draft or withdraw this policy.</small>
          </span>
        </label>
        <div className="muted-note">
          <AlertTriangle size={17} /> Fictional center data only. Review
          accuracy before publishing.
        </div>
        {fromReply && draft.published && (
          <label className="publish-toggle">
            <input
              type="checkbox"
              required
              checked={generalUse}
              onChange={(e) => setGeneralUse(e.target.checked)}
            />
            <span>
              I’ve reviewed this answer for all families and removed private
              details.
            </span>
          </label>
        )}
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={close}>
            <ArrowLeft size={15} /> Cancel
          </button>
          <button
            className="primary"
            type="submit"
            disabled={
              (fromReply && draft.published && !generalUse) ||
              !draft.title.trim() ||
              draft.answer.trim().length < 20 ||
              !draft.questions.some((q) => q.trim())
            }
          >
            {draft.published ? "Publish policy" : "Save draft"}
            <Check size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
