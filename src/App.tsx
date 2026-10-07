import { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  HeartHandshake,
  HelpCircle,
  Inbox,
  Leaf,
  MessageCircle,
  Mail,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Users,
  X,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Answer, Entry, Policy } from "./lib/types";
import { seedState } from "./lib/data";
import {
  directAnswer,
  keywordCandidates,
  policyAnswer,
  publicQuestion,
  isPrivateRoute,
  unknownAnswer,
} from "./lib/answer";
import { loadState, saveState } from "./lib/storage";
import { semanticSearch } from "./lib/semantic";
import { eligiblePolicies, selectRelatedPolicy } from "./lib/retrieval";
import "./App.css";
import Modal from "./components/Modal";
import PolicyEditor from "./components/PolicyEditor";
import ReplyEditor from "./components/ReplyEditor";
import EmailRequest from "./components/EmailRequest";
import {
  hasHiddenQuestion,
  recordStaffReply,
  draftFaqFromReply,
  requestEmailReply,
  cancelEmailReply,
} from "./lib/staff";
const categories = [
  { label: "Hours & drop-off", icon: Clock3, id: "hours" },
  { label: "Tuition & enrollment", icon: Users, id: "tuition" },
  { label: "Health & safety", icon: HeartHandshake, id: "illness" },
  { label: "Meals & snacks", icon: Leaf, id: "meals" },
];
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
const statusLabel = (entry: Entry) =>
  entry.privacyRedirect
    ? entry.answer.status === "urgent"
      ? "Urgent guidance shown"
      : "Portal guidance shown"
    : entry.emailFollowUp?.status === "pending"
      ? "Email reply requested"
      : entry.emailFollowUp?.status === "simulated"
        ? "Email reply simulated"
        : entry.answer.status === "urgent"
          ? "Urgent guidance"
          : entry.answer.status === "sensitive"
            ? "Private conversation"
            : entry.feedback === "unhelpful"
              ? "Not helpful"
              : entry.requested
                ? "Staff requested"
                : entry.answer.status === "answered"
                  ? "Policy shared"
                  : entry.answer.status === "related"
                    ? "Related policy"
                    : "Knowledge gap";
function Icon({
  icon: IconType,
  size = 20,
}: {
  icon: LucideIcon;
  size?: number;
}) {
  return <IconType size={size} strokeWidth={1.7} aria-hidden="true" />;
}
export default function App() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState<"parent" | "operator">("parent");
  const [tab, setTab] = useState<"inbox" | "policies">("inbox");
  const [question, setQuestion] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const chatOpenRef = useRef(false);
  const [unreadResponse, setUnreadResponse] = useState(false);
  const [pendingReplyId, setPendingReplyId] = useState<string | null>(null);
  const chatLauncher = useRef<HTMLButtonElement>(null);
  const chatClose = useRef<HTMLButtonElement>(null);
  const chatScroll = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState("Finding the right policy…");
  const [aiMode, setAiMode] = useState("AI search on this device");
  const [toast, setToast] = useState("");
  const [source, setSource] = useState<Policy | null>(null);
  const [editing, setEditing] = useState<Policy | null>(null);
  const [replying, setReplying] = useState<Entry | null>(null);
  const [requesting, setRequesting] = useState<Entry | null>(null);
  const [policySourceEntryId, setPolicySourceEntryId] = useState<string | null>(
    null,
  );
  const [filter, setFilter] = useState<"all" | "open">("open");
  const [search, setSearch] = useState("");
  const [topicPicker, setTopicPicker] = useState(false);
  const [history, setHistory] = useState(false);
  const questionInput = useRef<HTMLTextAreaElement>(null);
  const [portalHelp, setPortalHelp] = useState(false);
  const [about, setAbout] = useState(false);
  const [reset, setReset] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const published = state.policies.filter((p) => p.published);
  const needsReview = (e: Entry) => e.review === "open";
  const openCount = state.entries.filter(needsReview).length;
  useEffect(() => {
    // Storage is an external system; surface write failures rather than silently losing edits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStorageError(!saveState(state));
  }, [state]);
  useEffect(() => {
    if (!chatOpen) return;
    const scroller = chatScroll.current;
    if (scroller)
      scroller.scrollTop =
        conversation.length > 1 || busy ? scroller.scrollHeight : 0;
  }, [conversation, busy, chatOpen]);
  useEffect(() => {
    if (chatOpen) chatClose.current?.focus();
  }, [chatOpen]);
  function openChat() {
    chatOpenRef.current = true;
    setChatOpen(true);
    setUnreadResponse(false);
    if (pendingReplyId) {
      setConversation([pendingReplyId]);
      setPendingReplyId(null);
    }
  }
  function closeChat() {
    chatOpenRef.current = false;
    setChatOpen(false);
    chatLauncher.current?.focus();
  }
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const updateEntry = (id: string, update: Partial<Entry>) =>
    setState((s) => ({
      ...s,
      entries: s.entries.map((e) => (e.id === id ? { ...e, ...update } : e)),
    }));
  function addAnswer(q: string, answer: Answer, replace = false) {
    const entry: Entry = {
      id: crypto.randomUUID(),
      question: publicQuestion(q, answer),
      privacyRedirect: isPrivateRoute(answer),
      answer,
      // Created by a submitted question or topic click, never during render.
      // oxlint-disable-next-line react/purity
      createdAt: new Date().toISOString(),
      review:
        answer.status === "answered" || isPrivateRoute(answer)
          ? "resolved"
          : "open",
      requested: false,
    };
    setState((s) => ({ ...s, entries: [entry, ...s.entries].slice(0, 200) }));
    setConversation((c) => (replace ? [entry.id] : [...c, entry.id]));
    if (!chatOpenRef.current) setUnreadResponse(true);
  }
  async function ask(q: string) {
    q = q.trim();
    if (!q || busy) return;
    setQuestion("");
    const direct = directAnswer(q, state.policies);
    if (direct) {
      addAnswer(q, direct);
      return;
    }
    const candidates = eligiblePolicies(q, state.policies);
    if (!candidates.length) {
      addAnswer(q, unknownAnswer());
      return;
    }
    setBusy(true);
    setLoading("Finding the right policy…");
    let answer: Answer;
    try {
      const matches = await semanticSearch(q, candidates, () =>
        setLoading(
          "Preparing private AI search for the first time. This may take a moment…",
        ),
      );
      const policy = selectRelatedPolicy(matches, candidates);
      // Similarity is relevance, not confidence. Never call a semantic match a verified answer.
      answer = policy
        ? policyAnswer(policy, "semantic", true)
        : unknownAnswer();
      setAiMode("AI search ready · on this device");
    } catch {
      const candidate = keywordCandidates(q, candidates)[0];
      answer = candidate
        ? policyAnswer(candidate, "policy", true)
        : unknownAnswer();
      setAiMode("Basic search · AI unavailable");
      setToast(
        "AI search is unavailable. Published policies and basic search still work.",
      );
    }
    addAnswer(q, answer);
    setBusy(false);
  }
  function openPolicy(p: Policy) {
    if (busy) return;
    openChat();
    setQuestion("");
    setTopicPicker(false);
    addAnswer(p.questions[0] || p.title, policyAnswer(p), true);
  }
  function newPolicy(entry?: Entry) {
    setPolicySourceEntryId(entry?.id ?? null);
    const existing =
      entry && state.policies.find((p) => p.id === entry.faqPolicyId);
    setEditing(
      existing ||
        (entry
          ? draftFaqFromReply(entry, crypto.randomUUID())
          : {
              id: crypto.randomUUID(),
              title: "",
              category: "Daily essentials",
              answer: "",
              questions: [""],
              keywords: [],
              updatedAt: "",
              version: 0,
              published: false,
            }),
    );
  }
  function saveReply(text: string, draftFaq: boolean) {
    if (!replying || !text.trim()) return;
    const next = recordStaffReply(state, replying.id, {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
      delivery: "simulated",
    });
    if (
      next.entries.find((e) => e.id === replying.id) ===
      state.entries.find((e) => e.id === replying.id)
    )
      return;
    setState(next);
    setReplying(null);
    setUnreadResponse(true);
    setPendingReplyId(replying.id);
    setToast("Email reply simulated and saved. No email was sent.");
    if (draftFaq) newPolicy(next.entries.find((e) => e.id === replying.id));
  }
  function savePolicy(p: Policy) {
    const next = {
      ...p,
      title: p.title.trim(),
      answer: p.answer.trim(),
      questions: p.questions.map((q) => q.trim()).filter(Boolean),
      version: p.version + 1,
      updatedAt: new Date().toISOString(),
      keywords: [
        ...new Set(
          p.title
            .toLowerCase()
            .split(/\W+/)
            .filter((w) => w.length > 3)
            .concat(p.keywords),
        ),
      ],
    };
    setState((s) => ({
      ...s,
      entries: policySourceEntryId
        ? s.entries.map((e) =>
            e.id === policySourceEntryId ? { ...e, faqPolicyId: next.id } : e,
          )
        : s.entries,
      policies: s.policies.some((item) => item.id === next.id)
        ? s.policies.map((item) => (item.id === next.id ? next : item))
        : [...s.policies, next],
    }));
    setEditing(null);
    setPolicySourceEntryId(null);
    setToast(
      next.published
        ? "Policy published. New questions use this version."
        : "Draft saved. Parents cannot see it yet.",
    );
  }
  const visibleEntries = state.entries.filter(
    (e) =>
      (filter === "all" || needsReview(e)) &&
      e.question.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="demo-bar">
        <span>
          <span className="demo-dot" /> A little demo, a big help.
        </span>
        <span>
          Public front desk demo · Data stays in this browser{" "}
          <button onClick={() => setAbout(true)}>
            About this prototype <ArrowUpRight size={13} />
          </button>
        </span>
      </div>
      <header className="header">
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("parent");
          }}
        >
          <span className="brand-icon">
            <Sun size={24} />
          </span>{" "}
          little grove
          <span className="brand-divider" />{" "}
          <span className="product-name">front desk</span>
        </a>
        <nav className="view-switch" aria-label="Choose perspective">
          <button
            className={view === "parent" ? "active" : ""}
            onClick={() => setView("parent")}
          >
            <MessageCircle size={16} /> For parents
          </button>
          <button
            className={view === "operator" ? "active" : ""}
            onClick={() => {
              closeChat();
              setView("operator");
            }}
          >
            <Settings2 size={16} /> Staff workspace{" "}
            {openCount > 0 && <span className="count">{openCount}</span>}
          </button>
        </nav>
        <button
          className="avatar"
          onClick={() => setAbout(true)}
          aria-label="About this demo"
        >
          LG
        </button>
      </header>
      {storageError && (
        <div className="storage-warning" role="alert">
          Browser storage is unavailable. Changes will last only until this page
          closes.
        </div>
      )}
      {view === "parent" ? (
        <div className="parent-layout">
          <aside className="center-sidebar">
            <div className="center-card">
              <div className="center-illustration" aria-hidden="true">
                <div className="sun-shape" />
                <div className="hill hill-one" />
                <div className="hill hill-two" />
                <div className="house">
                  <div className="roof" />
                  <div className="window" />
                  <div className="door" />
                </div>
                <div className="tree tree-one" />
                <div className="tree tree-two" />
                <span className="cloud cloud-one" />
                <span className="cloud cloud-two" />
              </div>
              <div className="center-info">
                <span className="eyebrow">A place to grow</span>
                <h2>
                  Little Grove
                  <br />
                  Early Learning
                </h2>
                <p>
                  Small moments.
                  <br />
                  Wonderful beginnings.
                </p>
                <div className="center-tag">
                  <span /> Fictional demo center
                </div>
              </div>
            </div>
            <div className="sidebar-section">
              <h3>Your center, at a glance</h3>
              <p>
                <Clock3 size={17} />
                <span>
                  Planning your day?
                  <br />
                  <button
                    className="text-link"
                    onClick={() => {
                      const p = published.find((p) => p.id === "hours");
                      if (p) openPolicy(p);
                      else
                        setToast(
                          "The hours policy is not currently published.",
                        );
                    }}
                  >
                    View current center hours
                  </button>
                  <small>From the latest published policy</small>
                </span>
              </p>
              <button
                className="text-link"
                onClick={() => {
                  const p = published.find((p) => p.id === "tours");
                  if (p) openPolicy(p);
                  else setToast("The tour policy is not currently published.");
                }}
              >
                Plan a visit <ArrowUpRight size={15} />
              </button>
            </div>
            <div className="human-card">
              <div className="human-icon">
                <HeartHandshake size={23} />
              </div>
              <h3>Some things need a person.</h3>
              <p>
                Already enrolled? Use your center’s authenticated parent portal
                for questions about your child. This public front desk is for
                general policies.
              </p>
              <button onClick={() => setPortalHelp(true)}>
                For enrolled families <ArrowRight size={15} />
              </button>
            </div>
            <div className="sidebar-footer">
              <ShieldCheck size={15} /> No child records. No personal details
              needed.
            </div>
          </aside>
          <main className="parent-main" id="main-content">
            <div className="desk-status">
              <span>
                <span className="online-dot" /> Your center’s public AI front
                desk
              </span>
              <button onClick={() => setAbout(true)}>
                <ShieldCheck size={14} /> How answers work
              </button>
            </div>
            <section className="welcome">
              <div className="hello-icon">
                <Sparkles size={23} />
              </div>
              <span className="eyebrow">A little clarity for your day</span>
              <h1>
                Big questions.
                <br />
                <span>Little answers, right here.</span>
              </h1>
              <p>
                From the morning drop-off to what’s for lunch.
                <br className="desktop-break" /> Find answers from Little
                Grove’s own policies.
              </p>
            </section>
            <div className="home-chat-actions">
              <button className="primary" onClick={openChat}>
                <MessageCircle size={18} />
                {unreadResponse
                  ? "Read your response"
                  : conversation.length
                    ? "Continue your chat"
                    : "Ask a question"}
                <ArrowUpRight size={17} />
              </button>
              <p>
                {unreadResponse
                  ? "A response is ready in your front desk chat."
                  : "Open the front desk anytime. Your chat stays here when you close it."}
              </p>
            </div>
            <div className="topic-grid home-topics">
              {categories.map(({ label, icon, id }) => (
                <button
                  key={id}
                  disabled={busy}
                  onClick={() => {
                    const policy = published.find((p) => p.id === id);
                    if (policy) openPolicy(policy);
                    else setToast("This policy is not currently published.");
                  }}
                >
                  <span className={`topic-icon ${id}`}>
                    <Icon icon={icon} />
                  </span>
                  <span>Browse {label}</span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
            <button
              className={`chat-launcher ${unreadResponse ? "has-response" : ""}`}
              ref={chatLauncher}
              onClick={chatOpen ? closeChat : openChat}
              aria-expanded={chatOpen}
              aria-controls="front-desk-chat"
              aria-live="polite"
            >
              <MessageCircle size={21} />
              <span>
                {unreadResponse
                  ? "Response ready"
                  : busy
                    ? "Finding your answer…"
                    : "Little Grove chat"}
              </span>
              {unreadResponse && <span className="unread-dot" />}
            </button>
            <section
              id="front-desk-chat"
              className="chat-panel"
              hidden={!chatOpen}
              aria-label="Front desk chat"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.stopPropagation();
                  closeChat();
                }
              }}
            >
              <header className="chat-panel-header">
                <div>
                  <strong>
                    <Sparkles size={18} /> Little Grove front desk
                  </strong>
                  <small>
                    {busy
                      ? "Finding your answer…"
                      : "Public policies · Personal questions belong in your portal"}
                  </small>
                </div>
                <button
                  ref={chatClose}
                  onClick={closeChat}
                  aria-label="Close chat"
                >
                  <X size={21} />
                </button>
              </header>
              <div className="chat-scroll" ref={chatScroll}>
                <nav className="topic-navigation" aria-label="Chat navigation">
                  <div className="topic-navigation-heading">
                    <button
                      className="all-topics"
                      disabled={busy}
                      onClick={() => setTopicPicker(true)}
                    >
                      <BookOpen size={15} /> All topics{" "}
                      <ChevronDown size={14} />
                    </button>
                    <div>
                      <button disabled={busy} onClick={() => setHistory(true)}>
                        <Clock3 size={15} /> History
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          setConversation([]);
                          setQuestion("");
                          questionInput.current?.focus();
                        }}
                      >
                        <Plus size={15} /> New question
                      </button>
                    </div>
                  </div>
                  <div className="topic-grid">
                    {categories.map(({ label, icon, id }) => (
                      <button
                        key={id}
                        disabled={busy}
                        aria-pressed={
                          conversation.length === 1 &&
                          state.entries.find((e) => e.id === conversation[0])
                            ?.answer.policy?.id === id
                        }
                        onClick={() => {
                          const p = published.find((p) => p.id === id);
                          if (p) openPolicy(p);
                          else
                            setToast(
                              "This policy is not currently published. Please ask the staff.",
                            );
                        }}
                      >
                        <span className={`topic-icon ${id}`}>
                          <Icon icon={icon} />
                        </span>
                        <span>{label}</span>
                        <ArrowUpRight size={16} />
                      </button>
                    ))}
                  </div>
                </nav>
                {!conversation.length && !busy && (
                  <div className="try-question">
                    <span>Or try asking</span>
                    <button
                      onClick={() => ask("Can we visit before enrolling?")}
                    >
                      “Can we visit before enrolling?” <ArrowRight size={14} />
                    </button>
                  </div>
                )}
                <div
                  className="conversation"
                  aria-live="polite"
                  aria-label="Your questions and answers"
                >
                  {conversation
                    .map((id) => state.entries.find((e) => e.id === id))
                    .filter((e): e is Entry => !!e)
                    .map((entry) => (
                      <div className="exchange" key={entry.id}>
                        <div className="question-bubble">{entry.question}</div>
                        <article
                          className={`answer-card ${entry.answer.status}`}
                        >
                          <div className="answer-heading">
                            <span className="small-spark">
                              <Sparkles size={17} />
                            </span>
                            <strong>Little Grove front desk</strong>
                            <span>
                              {entry.answer.status === "answered"
                                ? "From your center"
                                : entry.answer.status === "related"
                                  ? "Related policy"
                                  : "Let’s get the right help"}
                            </span>
                          </div>
                          {entry.answer.status === "related" && (
                            <div className="related-note">
                              <HelpCircle size={16} /> This policy may help. It
                              may not cover every part of your question.
                            </div>
                          )}
                          <p className="answer-text">{entry.answer.text}</p>
                          {entry.answer.policy && (
                            <button
                              className="source-link"
                              onClick={() => setSource(entry.answer.policy!)}
                            >
                              <BookOpen size={16} />
                              <span>
                                {entry.answer.policy.title}
                                <small>
                                  Version {entry.answer.policy.version} ·
                                  Updated {date(entry.answer.policy.updatedAt)}
                                </small>
                              </span>
                              <ChevronRight size={16} />
                            </button>
                          )}
                          {entry.answer.status === "sensitive" && (
                            <div className="portal-route">
                              <p>
                                Use the center’s existing parent portal to reach
                                your child’s teacher. No message was forwarded
                                from this demo.
                              </p>
                              <button
                                className="secondary"
                                onClick={() => setPortalHelp(true)}
                              >
                                <ShieldCheck size={16} /> How to contact your
                                teacher
                              </button>
                            </div>
                          )}
                          {!isPrivateRoute(entry.answer) && (
                            <div className="answer-actions">
                              <span>Did this help?</span>
                              <button
                                aria-label="Mark answer helpful"
                                aria-pressed={entry.feedback === "helpful"}
                                className={
                                  entry.feedback === "helpful" ? "selected" : ""
                                }
                                onClick={() =>
                                  updateEntry(entry.id, { feedback: "helpful" })
                                }
                              >
                                <ThumbsUp size={15} />
                              </button>
                              <button
                                aria-label="Mark answer not helpful"
                                aria-pressed={entry.feedback === "unhelpful"}
                                className={
                                  entry.feedback === "unhelpful"
                                    ? "selected"
                                    : ""
                                }
                                onClick={() => {
                                  updateEntry(entry.id, {
                                    feedback: "unhelpful",
                                    review: "open",
                                  });
                                  setToast(
                                    "Flagged for staff review in this demo.",
                                  );
                                }}
                              >
                                <ThumbsDown size={15} />
                              </button>
                              {entry.answer.status !== "urgent" &&
                                !hasHiddenQuestion(entry) &&
                                !entry.emailFollowUp && (
                                  <button
                                    className="handoff"
                                    onClick={() => setRequesting(entry)}
                                  >
                                    <Mail size={14} /> Request an email reply
                                  </button>
                                )}
                            </div>
                          )}
                          {entry.emailFollowUp && (
                            <div className="followup-receipt">
                              <Mail size={18} />
                              <div>
                                <strong>
                                  {entry.emailFollowUp.status === "pending"
                                    ? "Email reply requested · demo"
                                    : "Email reply simulated"}
                                </strong>
                                <p>
                                  {entry.emailFollowUp.status === "pending"
                                    ? `Your request is saved for ${entry.emailFollowUp.email}. Staff replies are asynchronous; you don’t need to keep the chat open.`
                                    : `A demo reply for ${entry.emailFollowUp.email} was saved. No email was sent.`}
                                </p>
                                {entry.emailFollowUp.status === "pending" && (
                                  <>
                                    <small>
                                      This demo is not monitored and does not
                                      send email.
                                    </small>
                                    <button
                                      className="text-link"
                                      onClick={() => {
                                        updateEntry(entry.id, {
                                          ...cancelEmailReply(entry),
                                          emailFollowUp: undefined,
                                        });
                                        setToast(
                                          "Reply request canceled and email address removed.",
                                        );
                                      }}
                                    >
                                      Cancel reply request
                                    </button>
                                  </>
                                )}
                                {entry.staffReplies?.map((reply) => (
                                  <blockquote key={reply.id}>
                                    <span className="eyebrow">
                                      Simulated staff email ·{" "}
                                      {date(reply.createdAt)}
                                    </span>
                                    <p>{reply.text}</p>
                                  </blockquote>
                                ))}
                              </div>
                            </div>
                          )}
                        </article>
                      </div>
                    ))}
                </div>
                {busy && (
                  <div className="thinking" role="status">
                    <span className="pulse" />
                    <span>{loading}</span>
                  </div>
                )}
              </div>
              <div className="chat-composer">
                <form
                  className="composer"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void ask(question);
                  }}
                >
                  <label className="sr-only" htmlFor="question">
                    Ask a question about Little Grove
                  </label>
                  <textarea
                    id="question"
                    ref={questionInput}
                    rows={2}
                    maxLength={500}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What would you like to know?"
                    disabled={busy}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        void ask(question);
                      }
                    }}
                  />
                  <div className="composer-bottom">
                    <span>
                      <ShieldCheck size={14} /> Please leave out names and
                      personal details.
                    </span>
                    <button
                      type="submit"
                      disabled={busy || !question.trim()}
                      aria-label="Send question"
                    >
                      <ArrowUp size={21} />
                    </button>
                  </div>
                </form>
                <button
                  className="portal-shortcut"
                  onClick={() => setPortalHelp(true)}
                >
                  <ShieldCheck size={13} /> Enrolled family? Ask about your
                  child in your parent portal <ArrowUpRight size={13} />
                </button>
                <div className="composer-meta">
                  <span>
                    <Sparkles size={12} />
                    {aiMode}
                  </span>
                  <span>Staff-published policies</span>
                </div>
              </div>
            </section>
          </main>
        </div>
      ) : (
        <main className="operator-main">
          <div className="operator-title">
            <div>
              <span className="eyebrow">Little Grove · Staff workspace</span>
              <h1>
                A clearer picture.
                <br className="mobile-break" /> A lighter workload.
              </h1>
              <p>See what families need. Make the next answer better.</p>
            </div>
            <button className="secondary" onClick={() => setView("parent")}>
              Preview parent experience <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="sandbox-note">
            <ShieldCheck size={18} />
            <span>
              <strong>Your own demo workspace.</strong> Edits and questions are
              saved in this browser only. Three labeled sample questions get you
              started. Staff access and email delivery are simulated, with no
              sign-in or protected teacher accounts. Use fictional data only.
            </span>
            <button onClick={() => setReset(true)}>
              <RotateCcw size={14} /> Reset demo
            </button>
          </div>
          <div className="stats">
            <div>
              <span>Questions in this workspace</span>
              <strong>{state.entries.length}</strong>
              <small>
                Includes {state.entries.filter((entry) => entry.sample).length}{" "}
                sample questions
              </small>
            </div>
            <div className="attention">
              <span>Ready for a closer look</span>
              <strong>
                {openCount}
                <span className="stat-dot" />
              </strong>
              <small>Gaps, related matches, and requests</small>
            </div>
            <div>
              <span>Helpful responses</span>
              <strong>
                {state.entries.filter((e) => e.feedback === "helpful").length}
                <span className="stat-denominator">
                  {" "}
                  / {state.entries.filter((e) => e.feedback).length}
                </span>
              </strong>
              <small>Based on explicit parent feedback</small>
            </div>
            <div>
              <span>Published policies</span>
              <strong>{published.length}</strong>
              <small>Source of truth for new answers</small>
            </div>
          </div>
          <div
            className="workspace-tabs"
            role="tablist"
            aria-label="Staff tools"
          >
            <button
              role="tab"
              aria-selected={tab === "inbox"}
              className={tab === "inbox" ? "active" : ""}
              onClick={() => setTab("inbox")}
            >
              <Inbox size={18} /> Question inbox <span>{openCount}</span>
            </button>
            <button
              role="tab"
              aria-selected={tab === "policies"}
              className={tab === "policies" ? "active" : ""}
              onClick={() => setTab("policies")}
            >
              <BookOpen size={18} /> Center policies
            </button>
          </div>
          {tab === "inbox" ? (
            <section className="inbox-panel">
              <div className="panel-toolbar">
                <div>
                  <h2>Every question is a chance to improve.</h2>
                  <p>
                    Review a gap, update a policy, then try the question again.
                  </p>
                </div>
                <div className="filter-switch">
                  <button
                    className={filter === "open" ? "active" : ""}
                    onClick={() => setFilter("open")}
                  >
                    Needs review
                  </button>
                  <button
                    className={filter === "all" ? "active" : ""}
                    onClick={() => setFilter("all")}
                  >
                    All questions
                  </button>
                </div>
              </div>
              <label className="search-box">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a question…"
                  aria-label="Search questions"
                />
              </label>
              <div className="inbox-list">
                {visibleEntries.length ? (
                  visibleEntries.map((entry) => (
                    <details className="inbox-row" key={entry.id}>
                      <summary>
                        <span
                          className={`inbox-symbol ${entry.review === "resolved" ? "resolved" : ""}`}
                        >
                          {entry.review === "resolved" ? (
                            <CheckCheck size={19} />
                          ) : (
                            <MessageCircle size={19} />
                          )}
                        </span>
                        <span className="inbox-question">
                          <strong>{entry.question}</strong>
                          <small>
                            {entry.sample && (
                              <span className="sample-label">Sample</span>
                            )}
                            {date(entry.createdAt)} · {entry.answer.reason}
                          </small>
                        </span>
                        <span
                          className={`status-pill ${entry.answer.status === "answered" && entry.review === "resolved" ? "green" : ""}`}
                        >
                          {entry.emailFollowUp || entry.privacyRedirect
                            ? statusLabel(entry)
                            : entry.review === "resolved"
                              ? "Reviewed"
                              : statusLabel(entry)}
                        </span>
                        <ChevronDown size={17} />
                      </summary>
                      <div className="inbox-detail">
                        <div>
                          <span className="eyebrow">What the parent saw</span>
                          <p>{entry.answer.text}</p>
                          {entry.answer.policy && (
                            <button
                              className="text-link"
                              onClick={() => setSource(entry.answer.policy!)}
                            >
                              View cited policy · v{entry.answer.policy.version}{" "}
                              <ExternalLink size={13} />
                            </button>
                          )}
                        </div>
                        {hasHiddenQuestion(entry) && (
                          <p className="muted-note">
                            {entry.privacyRedirect
                              ? "The public front desk showed private-channel or urgent guidance. Personal wording was not saved and no message was forwarded. The family must contact staff through its existing authenticated portal; this is not a teacher reply request."
                              : "This question was hidden by an older version and cannot be recovered."}
                          </p>
                        )}
                        <div className="staff-followup">
                          {entry.emailFollowUp ? (
                            <>
                              <strong>
                                <Mail size={16} />{" "}
                                {entry.emailFollowUp.status === "pending"
                                  ? "Waiting for an email reply"
                                  : "Reply simulated · no email sent"}
                              </strong>
                              <p>
                                {entry.emailFollowUp.email} · Opted in{" "}
                                {date(entry.emailFollowUp.consentedAt)}
                              </p>
                              {entry.staffReplies?.map((reply) => (
                                <blockquote key={reply.id}>
                                  <p>{reply.text}</p>
                                  <small>
                                    Simulated {date(reply.createdAt)} · Personal
                                    reply, excluded from AI search
                                  </small>
                                </blockquote>
                              ))}
                            </>
                          ) : (
                            <p>
                              The parent has not requested an email reply. You
                              can still improve the published guidance.
                            </p>
                          )}
                          {entry.faqPolicyId && (
                            <p>
                              Reusable FAQ:{" "}
                              {state.policies.find(
                                (p) => p.id === entry.faqPolicyId,
                              )?.published
                                ? "Published for future questions"
                                : "Draft · not used for answers"}
                            </p>
                          )}
                        </div>
                        {!entry.privacyRedirect && (
                          <div className="review-actions">
                            {entry.emailFollowUp?.status === "pending" && (
                              <button
                                className="primary"
                                onClick={() => setReplying(entry)}
                              >
                                <Mail size={15} /> Reply by email
                              </button>
                            )}
                            {!!entry.staffReplies?.length && (
                              <button
                                className="secondary"
                                onClick={() => newPolicy(entry)}
                              >
                                <BookOpen size={15} />
                                {entry.faqPolicyId
                                  ? "Edit reusable FAQ"
                                  : "Turn reply into FAQ"}
                              </button>
                            )}

                            <button
                              className="secondary"
                              onClick={() =>
                                entry.answer.policy
                                  ? setEditing(
                                      state.policies.find(
                                        (p) => p.id === entry.answer.policy!.id,
                                      ) || null,
                                    )
                                  : newPolicy(entry)
                              }
                            >
                              <FileText size={15} />
                              {entry.answer.policy
                                ? "Improve this policy"
                                : "Draft a policy"}
                            </button>
                            <button
                              className="secondary"
                              disabled={hasHiddenQuestion(entry)}
                              onClick={() => {
                                setView("parent");
                                openChat();
                                setConversation([]);
                                void ask(entry.question);
                              }}
                            >
                              Test question <ArrowUpRight size={15} />
                            </button>
                            <button
                              className="secondary"
                              disabled={
                                entry.emailFollowUp?.status === "pending"
                              }
                              title={
                                entry.emailFollowUp?.status === "pending"
                                  ? "Reply to the waiting parent before closing this request"
                                  : undefined
                              }
                              onClick={() => {
                                updateEntry(entry.id, {
                                  review:
                                    entry.review === "open"
                                      ? "resolved"
                                      : "open",
                                });
                                setToast(
                                  entry.review === "open"
                                    ? "Marked reviewed. No message was sent to a parent."
                                    : "Reopened for review.",
                                );
                              }}
                            >
                              <Check size={15} />
                              {entry.review === "open"
                                ? "Mark reviewed"
                                : "Reopen review"}
                            </button>
                          </div>
                        )}
                      </div>
                    </details>
                  ))
                ) : (
                  <div className="empty-state">
                    <CheckCheck size={30} />
                    <h3>
                      {search ? "No matching questions" : "All caught up."}
                    </h3>
                    <p>
                      {search
                        ? "Try another search or switch to all questions."
                        : "New gaps and feedback will appear here."}
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="policies-panel">
              <div className="panel-toolbar">
                <div>
                  <h2>Good answers start here.</h2>
                  <p>
                    Write a clear policy and the questions it answers. Publish
                    when it’s ready.
                  </p>
                </div>
                <button className="primary" onClick={() => newPolicy()}>
                  <Plus size={17} /> Add policy
                </button>
              </div>
              <div className="policy-grid">
                {state.policies.map((p) => (
                  <button
                    className="policy-card"
                    key={p.id}
                    onClick={() => setEditing(p)}
                  >
                    <div>
                      <span className="policy-book">
                        <BookOpen size={20} />
                      </span>
                      <span
                        className={`status-pill ${p.published ? "green" : ""}`}
                      >
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <span className="eyebrow">{p.category}</span>
                    <h3>{p.title}</h3>
                    <p>{p.answer}</p>
                    <footer>
                      <span>
                        v{p.version} · Updated {date(p.updatedAt)}
                      </span>
                      <span>
                        Edit policy <ArrowUpRight size={14} />
                      </span>
                    </footer>
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>
      )}
      <footer className="page-footer">
        <span>
          <Sun size={16} /> Built with care, for the people who care.
        </span>
        <span>Paul Boutin · Independent brightwheel exercise</span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {topicPicker && (
        <Modal title="Choose a new topic" close={() => setTopicPicker(false)}>
          <p className="navigation-note">
            Open a topic to start fresh. Earlier questions and reply requests
            stay in History.
          </p>
          <div className="topic-picker-list">
            {published.map((p) => (
              <button key={p.id} onClick={() => openPolicy(p)}>
                <span>
                  <strong>{p.title}</strong>
                  <small>{p.category}</small>
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
          {!published.length && (
            <p>No topics are published yet. Please contact the center.</p>
          )}
        </Modal>
      )}
      {history && (
        <Modal title="Your saved questions" close={() => setHistory(false)}>
          <p className="navigation-note">
            Saved in this browser, including email reply requests. Open one
            question at a time.
          </p>
          <div className="topic-picker-list">
            {state.entries
              .filter((e) => !e.sample)
              .map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setConversation([entry.id]);
                    setQuestion("");
                    setHistory(false);
                  }}
                >
                  <span>
                    <strong>{entry.question}</strong>
                    <small>
                      {date(entry.createdAt)} · {statusLabel(entry)}
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
          </div>
          {!state.entries.some((e) => !e.sample) && (
            <p>
              No saved questions yet. Ask a question or choose a topic to get
              started.
            </p>
          )}
        </Modal>
      )}
      {source && (
        <Modal
          title="The source behind this answer"
          close={() => setSource(null)}
        >
          <div className="source-modal">
            <span className="eyebrow">Little Grove · Center handbook</span>
            <h3>{source.title}</h3>
            <span className="status-pill green">
              Published version {source.version} · {date(source.updatedAt)}
            </span>
            <p>{source.answer}</p>
            <div className="muted-note">
              <ShieldCheck size={18} /> This is the policy version used for this
              answer. Staff may have published a newer version since then.
            </div>
          </div>
        </Modal>
      )}
      {editing && (
        <PolicyEditor
          policy={editing}
          key={editing.id}
          fromReply={
            !!policySourceEntryId ||
            state.entries.some((e) => e.faqPolicyId === editing.id)
          }
          close={() => {
            setEditing(null);
            setPolicySourceEntryId(null);
          }}
          save={savePolicy}
        />
      )}
      {requesting && (
        <EmailRequest
          entry={requesting}
          close={() => setRequesting(null)}
          save={(email) => {
            setState((s) => ({
              ...s,
              entries: s.entries.map((e) =>
                e.id === requesting.id
                  ? requestEmailReply(e, email, new Date().toISOString())
                  : e,
              ),
            }));
            setRequesting(null);
            setToast("Demo email reply request saved. No email was sent.");
          }}
        />
      )}
      {replying && (
        <ReplyEditor
          entry={replying}
          close={() => setReplying(null)}
          save={saveReply}
        />
      )}
      {portalHelp && (
        <Modal
          title="Questions about your enrolled child"
          close={() => setPortalHelp(false)}
        >
          <div className="about-content">
            <p>
              This public front desk can explain general center policies. For
              personal updates, care needs, medication requests, or records, use
              the parent portal your center already provides.
            </p>
            <ol>
              <li>Open your center’s existing parent portal and sign in.</li>
              <li>
                Select your child and message their teacher or the office.
              </li>
              <li>Keep personal details in that authenticated conversation.</li>
            </ol>
            <div className="muted-note">
              <ShieldCheck size={20} /> Little Grove is fictional. This demo has
              no connected portal, verified family accounts, or protected
              teacher inbox. Nothing is forwarded from here.
            </div>
            <p>
              For immediate danger, call local emergency services. Do not wait
              for a portal or email response.
            </p>
            <button className="primary" onClick={() => setPortalHelp(false)}>
              Back to general questions
            </button>
          </div>
        </Modal>
      )}
      {about && (
        <Modal
          title="A front desk that knows its limits."
          close={() => setAbout(false)}
        >
          <div className="about-content">
            <p>
              This is a fictional Little Grove center, built by Paul Boutin for
              a brightwheel engineering exercise. It is not a brightwheel
              product or a real childcare service.
            </p>
            <h3>Policies first. People when it matters.</h3>
            <p>
              A small AI model finds related policies on your device. Each
              question is handled independently; follow-up questions need their
              own context. Answers use the exact wording staff publish, with a
              visible source and version. Similarity is not a guarantee that a
              policy answers every detail.
            </p>
            <h3>Your demo stays with you.</h3>
            <p>
              Questions, feedback, and edits are stored in this browser, up to
              200 questions. General questions remain visible in the demo staff
              view, with common email and phone patterns removed. Newly
              recognized personal and urgent questions retain only a routing
              label, not their wording. Names and personal situations cannot be
              detected reliably; don’t enter them here. Earlier demo entries may
              still contain their original wording. This is not comprehensive
              personal-data detection. An opt-in reply address is stored
              separately and is never included in AI search. Both perspectives
              share that local workspace. No accounts, shared database, real
              messages, or child records are connected. Don’t enter personal
              information.
            </p>
            <h3>Reaching a person</h3>
            <p>
              “Request an email reply” saves your explicit opt-in and a reply
              address in this browser. Staff can simulate an email response; no
              real email is sent. A general-question reply becomes reusable
              guidance only after staff review and publish an FAQ. This demo is
              not monitored. Enrolled families should use their existing
              authenticated parent portal for child-specific questions. The
              public staff switch is not a protected inbox. For immediate
              danger, contact local emergency services.
            </p>
            <h3>About the AI</h3>
            <p>
              First use downloads a small public model from Hugging Face; model
              and runtime hosts receive standard download metadata. Question
              text stays on your device. If the model fails, labeled basic
              search and the policy library remain available.
            </p>
          </div>
        </Modal>
      )}
      {reset && (
        <Modal title="Start fresh?" close={() => setReset(false)}>
          <p>
            This clears the questions and policy edits in this browser’s demo
            and restores the fictional sample data.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setReset(false)}>
              Keep my changes
            </button>
            <button
              className="primary"
              onClick={() => {
                setState(seedState());
                setConversation([]);
                setUnreadResponse(false);
                setPendingReplyId(null);
                setReset(false);
                setToast("Demo reset to its original sample data.");
              }}
            >
              Reset this demo
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
