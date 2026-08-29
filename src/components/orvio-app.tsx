"use client";

import {
  Activity, ArrowRight, Bell, Bot, Check, CheckCircle2, ChevronRight, CircleGauge, CloudOff,
  Eye, Gauge, LayoutDashboard, Lightbulb, ListChecks, LogOut, Megaphone, Menu,
  QrCode, Radio, RefreshCw, Scale, ScanLine, Search, ShieldCheck, Sparkles, TimerReset,
  TriangleAlert, UserRound, Users, Wifi, WifiOff, X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { announcements as seededAnnouncements, auditEvents, currentParticipant, initialMetrics, teams } from "@/lib/domain/seed";
import { recommendTeams } from "@/lib/domain/matching";
import { deriveSignals, simulateJudgeDropout } from "@/lib/domain/pulse";
import { rubric, weightedScore } from "@/lib/domain/judging";
import type { Announcement, AuditEvent, EventMetrics, RecoveryProposal, Severity } from "@/lib/domain/types";

type View = "organizer" | "participant" | "judge" | "scanner";
type Toast = { title: string; detail: string; kind?: "success" | "warning" } | null;

const EVENT_ID = "abhiyantrix-2026";
const DEMO_TICKET_ID = "5c327c3a-2d3f-49c6-b087-f8de29ae1042";

const viewMeta: Record<View, { label: string; icon: typeof Users }> = {
  organizer: { label: "Control tower", icon: LayoutDashboard },
  participant: { label: "Participant", icon: UserRound },
  judge: { label: "Judge workspace", icon: Scale },
  scanner: { label: "Scanner", icon: ScanLine },
};

const severityLabel: Record<Severity, string> = { healthy: "Healthy", watch: "Watch", critical: "Action needed" };

function Brand() {
  return (
    <div className="brand" aria-label="Orvio Pulse home">
      <span className="brand-mark"><span /></span>
      <span>orvio</span>
      <span className="brand-product">PULSE</span>
    </div>
  );
}

function StatusPill({ severity }: { severity: Severity }) {
  return <span className={`status-pill ${severity}`}><span aria-hidden="true" />{severityLabel[severity]}</span>;
}

function ToastMessage({ toast, dismiss }: { toast: Toast; dismiss: () => void }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.kind ?? "success"}`} role="status" aria-live="polite">
      <CheckCircle2 size={20} aria-hidden="true" />
      <div><strong>{toast.title}</strong><span>{toast.detail}</span></div>
      <button onClick={dismiss} aria-label="Dismiss message"><X size={17} /></button>
    </div>
  );
}

function Sidebar({ view, setView, open, close }: { view: View; setView: (view: View) => void; open: boolean; close: () => void }) {
  return (
    <>
      {open && <button className="nav-scrim" onClick={close} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Brand />
        <div className="event-chip"><span className="live-dot" />LIVE EVENT<span>ABHIYANTRIX</span></div>
        <nav aria-label="Role workspaces">
          <p className="nav-label">WORKSPACES</p>
          {(Object.entries(viewMeta) as [View, (typeof viewMeta)[View]][]).map(([key, item]) => {
            const Icon = item.icon;
            return <button key={key} className={view === key ? "active" : ""} onClick={() => { setView(key); close(); }}><Icon size={18} />{item.label}</button>;
          })}
          <p className="nav-label spaced">EVENT OPS</p>
          <button onClick={() => setView("organizer")}><Radio size={18} />Live signals<span className="nav-count">4</span></button>
          <button onClick={() => setView("organizer")}><Megaphone size={18} />Broadcasts</button>
          <button onClick={() => setView("organizer")}><ListChecks size={18} />Audit trail</button>
        </nav>
        <div className="sidebar-foot">
          <div className="demo-badge"><ShieldCheck size={16} /><div><strong>Safe demo mode</strong><span>Synthetic data only</span></div></div>
          <div className="profile-mini"><span className="avatar">PS</span><div><strong>Priya Shah</strong><span>Lead organizer</span></div><LogOut size={16} /></div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ view, openMenu }: { view: View; openMenu: () => void }) {
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={openMenu} aria-label="Open navigation"><Menu /></button>
      <div><p>PromptWars × AbhiyantriX</p><h1>{viewMeta[view].label}</h1></div>
      <div className="topbar-actions">
        <div className="command-search"><Search size={16} /><span>Search event</span><kbd>⌘ K</kbd></div>
        <button className="icon-button" aria-label="Notifications"><Bell size={19} /><span className="notification-dot" /></button>
        <span className="top-avatar">PS</span>
      </div>
    </header>
  );
}

function OrganizerView({ metrics, setMetrics, setAnnouncements, audits, setAudits, toast }: {
  metrics: EventMetrics; setMetrics: React.Dispatch<React.SetStateAction<EventMetrics>>;
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  audits: AuditEvent[]; setAudits: React.Dispatch<React.SetStateAction<AuditEvent[]>>; toast: (toast: Toast) => void;
}) {
  const signals = useMemo(() => deriveSignals(metrics), [metrics]);
  const [proposal, setProposal] = useState<RecoveryProposal | null>(null);
  const [loading, setLoading] = useState(false);

  async function createRecovery() {
    setLoading(true);
    try {
      const response = await fetch("/api/recovery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ incident: "judge-dropout" }) });
      setProposal(response.ok ? await response.json() : simulateJudgeDropout(metrics));
    } catch {
      setProposal(simulateJudgeDropout(metrics));
    } finally { setLoading(false); }
  }

  function approveRecovery() {
    if (!proposal) return;
    setProposal({ ...proposal, status: "approved" });
    setMetrics((current) => ({ ...current, activeJudges: current.activeJudges + 1, announcementReach: 96 }));
    setAnnouncements((current) => [{ id: crypto.randomUUID(), title: "Judging queue rebalanced", body: proposal.announcement, audience: "Assigned judges", time: "Just now", urgent: true, reach: 96 }, ...current]);
    setAudits((current) => [{ id: crypto.randomUUID(), actor: "Priya (Organizer)", action: "Recovery approved", detail: "5 reviews rebalanced · affected judges notified", time: "Now" }, ...current]);
    toast({ title: "Recovery plan activated", detail: "Assignments rebalanced and a targeted update was sent." });
  }

  const criticalCount = signals.filter((signal) => signal.severity === "critical").length;
  return (
    <div className="view-stack">
      <section className="hero-row">
        <div><span className="eyebrow"><Activity size={14} />LIVE OPERATIONS</span><h2>Good afternoon, Priya.</h2><p>Orvio found <strong>{criticalCount} risks</strong> that need attention before they become incidents.</p></div>
        <div className="hero-actions"><button className="secondary-button"><Eye size={17} />Demo guide</button><button className="primary-button" onClick={createRecovery}><Sparkles size={17} />{loading ? "Simulating…" : "Simulate disruption"}</button></div>
      </section>

      <section className="metric-grid" aria-label="Live event metrics">
        <MetricCard label="Checked in" value={`${metrics.checkedIn}`} suffix={`/ ${metrics.totalParticipants}`} change="85.5% attendance" icon={Users} tone="indigo" />
        <MetricCard label="Team readiness" value={`${metrics.totalParticipants - metrics.unmatchedParticipants}`} suffix=" matched" change={`${metrics.unmatchedParticipants} need a team`} icon={UserRound} tone="amber" />
        <MetricCard label="Judging progress" value="68" suffix="%" change={`${metrics.pendingReviews} reviews remaining`} icon={Scale} tone="violet" />
        <MetricCard label="Announcement reach" value={`${metrics.announcementReach}`} suffix="%" change="Live acknowledgement" icon={Radio} tone="green" />
      </section>

      <section className="content-grid">
        <div className="panel pulse-panel">
          <div className="panel-head"><div><span className="eyebrow"><CircleGauge size={14} />EVENT PULSE</span><h3>What is about to break?</h3></div><span className="sync-label"><span />Updated live</span></div>
          <div className="signal-list">
            {signals.map((signal) => <article className={`signal-card ${signal.severity}`} key={signal.id}>
              <div className="signal-icon">{signal.type === "queue" ? <ScanLine /> : signal.type === "teams" ? <Users /> : signal.type === "judging" ? <Scale /> : <Megaphone />}</div>
              <div className="signal-copy"><div><h4>{signal.title}</h4><StatusPill severity={signal.severity} /></div><strong>{signal.value}</strong><p>{signal.evidence}</p><button>{signal.recommendation}<ChevronRight size={15} /></button></div>
            </article>)}
          </div>
        </div>

        <aside className="right-stack">
          <div className="panel recovery-card">
            <div className="recovery-orbit"><Bot size={25} /><span /><span /></div>
            <span className="eyebrow"><Sparkles size={14} />ORVIO RECOVERY</span>
            <h3>{proposal ? proposal.incident : "Test your event before reality does."}</h3>
            {!proposal ? <><p>Simulate a judge dropout and see how Orvio protects the judging deadline.</p><button className="dark-button" onClick={createRecovery}>{loading ? <RefreshCw className="spin" size={17} /> : <TimerReset size={17} />}{loading ? "Building plan…" : "Run chaos scenario"}</button></> : <RecoveryDetails proposal={proposal} approve={approveRecovery} />}
          </div>
          <div className="panel audit-card"><div className="panel-head"><h3>Immutable audit trail</h3><button>View all</button></div>{audits.slice(0, 3).map((event) => <div className="audit-row" key={event.id}><span className="audit-line"><i /></span><div><strong>{event.action}</strong><p>{event.detail}</p><small>{event.actor} · {event.time}</small></div></div>)}</div>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ label, value, suffix, change, icon: Icon, tone }: { label: string; value: string; suffix: string; change: string; icon: typeof Users; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={20} /></div><p>{label}</p><h3>{value}<span>{suffix}</span></h3><small>{change}</small><div className={`mini-chart ${tone}`}><i /><i /><i /><i /><i /><i /></div></article>;
}

function RecoveryDetails({ proposal, approve }: { proposal: RecoveryProposal; approve: () => void }) {
  return <div className="recovery-detail">
    <div className="recovery-comparison"><div><span>WITHOUT ORVIO</span><strong>{proposal.before.completionMinutes} min</strong><small>{proposal.before.overloadedJudges} judges overloaded</small></div><ArrowRight size={18} /><div><span>WITH RECOVERY</span><strong>{proposal.after.completionMinutes} min</strong><small>Balanced queue</small></div></div>
    <ul>{proposal.actions.slice(0, 3).map((action) => <li key={action}><Check size={15} />{action}</li>)}</ul>
    <div className="ai-source"><Bot size={15} /><span>{proposal.source === "gemini" ? "Gemini grounded draft" : "Verified deterministic fallback"}</span></div>
    {proposal.status === "approved" ? <button className="approved-button"><CheckCircle2 size={17} />Recovery active</button> : <button className="dark-button" onClick={approve}><ShieldCheck size={17} />Review & approve</button>}
  </div>;
}

function ParticipantView({ announcements, toast }: { announcements: Announcement[]; toast: (toast: Toast) => void }) {
  const recommendations = useMemo(() => recommendTeams(currentParticipant, teams), []);
  const [selected, setSelected] = useState(recommendations[0]?.teamId);
  const [joined, setJoined] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState("Loading signed pass…");
  const recommendation = recommendations.find((item) => item.teamId === selected) ?? recommendations[0];
  const team = teams.find((item) => item.id === recommendation?.teamId);

  useEffect(() => {
    fetch("/api/check-ins/issue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: EVENT_ID, ticketId: DEMO_TICKET_ID }) })
      .then((response) => response.json()).then((data) => setQrToken(data.token ?? "Demo pass unavailable"))
      .catch(() => setQrToken("Demo pass unavailable"));
  }, []);

  return <div className="view-stack">
    <section className="hero-row participant-hero"><div><span className="eyebrow"><Sparkles size={14} />PARTICIPANT HOME</span><h2>Ready to build, Aanya?</h2><p>Your check-in is verified. Your strongest team match is ready.</p></div><div className="participant-status"><CheckCircle2 /><div><strong>Checked in</strong><span>North Gate · 13:42</span></div></div></section>
    <section className="participant-grid">
      <div className="panel match-panel">
        <div className="panel-head"><div><span className="eyebrow"><Users size={14} />EXPLAINABLE MATCH LAB</span><h3>Not just a match. A reason to build together.</h3></div><span className="match-score">{recommendation?.totalScore}% FIT</span></div>
        <div className="team-selector" role="tablist" aria-label="Recommended teams">{recommendations.map((item, index) => <button role="tab" aria-selected={selected === item.teamId} className={selected === item.teamId ? "active" : ""} onClick={() => setSelected(item.teamId)} key={item.teamId}><span>0{index + 1}</span>{teams.find((candidate) => candidate.id === item.teamId)?.name}<strong>{item.totalScore}%</strong></button>)}</div>
        {team && recommendation && <div className="match-detail"><div className="match-team-head"><div className="avatar-stack">{team.members.map((member) => <span key={member.id}>{member.initials}</span>)}<span className="you-avatar">YOU</span></div><div><h4>{team.name}</h4><p>{team.project}</p></div></div>
          <div className="fit-bars"><FitBar label="Skill coverage" value={recommendation.skillCoverage} /><FitBar label="Shared interests" value={recommendation.interestMatch} /><FitBar label="Role complement" value={recommendation.roleComplementarity} /><FitBar label="Availability" value={recommendation.availabilityMatch} /></div>
          <div className="why-card"><Lightbulb size={19} /><div><strong>Why this match works</strong>{recommendation.reasons.map((reason) => <p key={reason}><Check size={14} />{reason}</p>)}</div></div>
          <div className="member-list">{team.members.map((member) => <div key={member.id}><span className="avatar small">{member.initials}</span><div><strong>{member.name}</strong><small>{member.role} · {member.skills.slice(0, 2).join(", ")}</small></div></div>)}</div>
          <div className="match-actions">{joined === team.id ? <button className="joined-button"><CheckCircle2 />Request sent to {team.name}</button> : <><button className="secondary-button" onClick={() => toast({ title: "Swap preferences opened", detail: "You stay in control; Orvio never forces a team." })}>Request structured swap</button><button className="primary-button" onClick={() => { setJoined(team.id); toast({ title: "Team request sent", detail: `${team.name} received your skills and match rationale.` }); }}>Ask to join<ArrowRight size={17} /></button></>}</div>
        </div>}
      </div>
      <aside className="right-stack">
        <div className="panel pass-card"><div className="panel-head"><div><span className="eyebrow"><QrCode size={14} />SIGNED EVENT PASS</span><h3>Your check-in QR</h3></div><ShieldCheck size={21} /></div><div className="qr-wrap">{qrToken.startsWith("ey") ? <QRCodeSVG value={qrToken} size={148} level="M" marginSize={2} /> : <RefreshCw className="spin" />}</div><strong>AANYA SHARMA</strong><span>Ticket ••••1042 · No personal data in QR</span><div className="secure-note"><ShieldCheck size={15} />Signed · event-scoped · replay protected</div></div>
        <div className="panel feed-card"><div className="panel-head"><h3>Live updates</h3><span className="live-label"><span />LIVE</span></div>{announcements.slice(0, 2).map((item) => <article key={item.id} className={item.urgent ? "urgent" : ""}><span>{item.urgent ? <TriangleAlert size={16} /> : <Megaphone size={16} />}</span><div><strong>{item.title}</strong><p>{item.body}</p><small>{item.time}</small></div></article>)}</div>
      </aside>
    </section>
    <Leaderboard />
  </div>;
}

function FitBar({ label, value }: { label: string; value: number }) {
  return <div><span><label>{label}</label><strong>{value}%</strong></span><div className="bar"><i style={{ width: `${value}%` }} /></div></div>;
}

function JudgeView({ toast, setAudits }: { toast: (toast: Toast) => void; setAudits: React.Dispatch<React.SetStateAction<AuditEvent[]>> }) {
  const [scores, setScores] = useState<Record<string, number>>({ functionality: 8, innovation: 9, impact: 8, google: 9, presentation: 8 });
  const [feedback, setFeedback] = useState("Strong operational insight and unusually coherent real-time recovery flow.");
  const [finalized, setFinalized] = useState(false);
  const total = weightedScore(scores);
  function finalize() {
    if (feedback.trim().length < 20) return toast({ title: "Add actionable feedback", detail: "Final feedback must be at least 20 characters.", kind: "warning" });
    setFinalized(true);
    setAudits((current) => [{ id: crypto.randomUUID(), actor: "Judge Arjun", action: "Score finalized", detail: `Project Aster · ${total}/100 · rubric v3`, time: "Now" }, ...current]);
    toast({ title: "Score finalized", detail: "The immutable rubric v3 result is now included in the live aggregate." });
  }
  return <div className="view-stack">
    <section className="hero-row"><div><span className="eyebrow"><Scale size={14} />JUDGE WORKSPACE</span><h2>Review Project Aster</h2><p>Assignment 4 of 7 · conflict check passed · rubric version 3 locked</p></div><div className="score-orb"><strong>{total}</strong><span>/ 100</span></div></section>
    <section className="judge-grid">
      <div className="panel submission-card"><span className="eyebrow">SUBMISSION 04</span><h3>Project Aster</h3><p className="submission-tagline">An AI crowd-flow copilot that helps organizers prevent bottlenecks before attendees feel them.</p><div className="submission-meta"><span>AI/ML</span><span>Cloud Run</span><span>Firebase</span><span>Accessibility</span></div><div className="demo-frame"><div className="demo-top"><i/><i/><i/></div><div className="demo-visual"><Activity size={48}/><strong>Live prototype</strong><span>Last verified 2 minutes ago</span><button><Eye size={16}/>Open deployed app</button></div></div><div className="evidence-callout"><ShieldCheck /><div><strong>Evidence integrity</strong><span>Commit a84e21 · deployed build matches submission · checks passed</span></div></div></div>
      <div className="panel rubric-card"><div className="panel-head"><div><span className="eyebrow">STRUCTURED RUBRIC · V3</span><h3>Score against evidence</h3></div><span className="autosave"><Check size={14}/>Saved</span></div>
        <div className="rubric-list">{rubric.map((item) => <div className="rubric-row" key={item.id}><div><strong>{item.label}</strong><span>{item.weight}% of final score</span></div><div className="score-picker" role="group" aria-label={`${item.label} score`}>{[6,7,8,9,10].map((value) => <button disabled={finalized} className={scores[item.id] === value ? "active" : ""} onClick={() => setScores((current) => ({ ...current, [item.id]: value }))} key={value}>{value}</button>)}</div></div>)}</div>
        <label className="feedback-label">Evidence-linked feedback<textarea disabled={finalized} value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={500}/><span>{feedback.length}/500 · visible after results publish</span></label>
        <div className="fairness-note"><Scale size={19}/><div><strong>FairScore lens</strong><p>Your scoring is within 0.4 points of the panel mean. Advisory only—Orvio never changes your score.</p></div></div>
        <button className={finalized ? "approved-button full" : "primary-button full"} onClick={finalize} disabled={finalized}>{finalized ? <><CheckCircle2/>Score finalized</> : <><ShieldCheck/>Finalize {total}/100</>}</button>
      </div>
    </section>
  </div>;
}

function ScannerView({ metrics, setMetrics, setAudits, toast }: { metrics: EventMetrics; setMetrics: React.Dispatch<React.SetStateAction<EventMetrics>>; setAudits: React.Dispatch<React.SetStateAction<AuditEvent[]>>; toast: (toast: Toast) => void }) {
  const [online, setOnline] = useState(true);
  const [token, setToken] = useState("");
  const [pending, setPending] = useState<{ token: string; key: string }[]>([]);
  const [result, setResult] = useState<"idle" | "accepted" | "duplicate" | "queued" | "invalid">("idle");
  useEffect(() => { fetch("/api/check-ins/issue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: EVENT_ID, ticketId: DEMO_TICKET_ID }) }).then((response) => response.json()).then((data) => setToken(data.token ?? "")); }, []);

  async function syncPass(qrToken: string, key: string) {
    const response = await fetch("/api/check-ins/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: EVENT_ID, qrToken, scannerId: "north-gate-01", scannedAt: new Date().toISOString(), idempotencyKey: key }) });
    const data = await response.json();
    setResult(data.status === "accepted" ? "accepted" : data.status === "duplicate" ? "duplicate" : "invalid");
    if (data.status === "accepted") {
      setMetrics((current) => ({ ...current, checkedIn: current.checkedIn + 1, scanThroughput: current.scanThroughput + 3 }));
      setAudits((current) => [{ id: crypto.randomUUID(), actor: "North Gate 01", action: "QR verified", detail: `Ticket •••${data.ticketSuffix} accepted · replay lock stored`, time: "Now" }, ...current]);
    }
    return data.status;
  }
  async function scan() {
    if (!token) return;
    const key = crypto.randomUUID();
    if (!online) { setPending((current) => [...current, { token, key }]); setResult("queued"); toast({ title: "Stored safely offline", detail: "Only the signed pass and idempotency key were queued—no personal data." }); return; }
    const status = await syncPass(token, key);
    toast(status === "accepted" ? { title: "Check-in accepted", detail: "Attendance and Event Pulse updated live." } : { title: "Duplicate blocked", detail: "This pass was already checked in; no second attendance record was created.", kind: "warning" });
  }
  async function reconnect() { setOnline(true); for (const item of pending) await syncPass(item.token, item.key); setPending([]); toast({ title: "Offline queue synchronized", detail: "All queued scans were verified against the server replay lock." }); }
  return <div className="scanner-shell">
    <section className="scanner-header"><div><span className="eyebrow"><ScanLine size={14}/>NORTH GATE · SCANNER 01</span><h2>Fast check-in. Safe under pressure.</h2><p>Signed passes verify without exposing attendee data.</p></div><button className={`connection-toggle ${online ? "online" : "offline"}`} onClick={() => online ? setOnline(false) : reconnect()}>{online ? <Wifi/> : <WifiOff/>}<span><strong>{online ? "Online" : "Offline mode"}</strong><small>{online ? "Server replay checks active" : `${pending.length} scan queued`}</small></span></button></section>
    <section className="scanner-grid"><div className="scan-stage"><div className={`scan-frame ${result}`}><span className="corner top-left"/><span className="corner top-right"/><span className="corner bottom-left"/><span className="corner bottom-right"/>{result === "idle" ? <><QrCode size={96}/><strong>Ready to scan</strong><span>Camera preview represented in demo mode</span></> : result === "accepted" ? <><CheckCircle2 size={96}/><strong>Check-in accepted</strong><span>Ticket ••••1042 · North Gate</span></> : result === "duplicate" ? <><TriangleAlert size={96}/><strong>Duplicate blocked</strong><span>First accepted at this gate moments ago</span></> : result === "queued" ? <><CloudOff size={96}/><strong>Stored offline</strong><span>Will verify automatically on reconnect</span></> : <><X size={96}/><strong>Pass invalid</strong><span>Ask the attendee to open a fresh pass</span></>}</div><button className="scan-button" onClick={scan} disabled={!token}><ScanLine/>Scan Aanya&apos;s signed demo pass</button><button className="text-button" onClick={() => setResult("idle")}>Reset scanner view</button></div>
      <aside className="scan-sidebar"><div className="panel"><div className="panel-head"><h3>Gate pulse</h3><StatusPill severity={metrics.arrivalRate / metrics.scanThroughput > 1.2 ? "critical" : "watch"}/></div><div className="gate-number"><strong>{metrics.scanThroughput}</strong><span>people/min</span></div><p>{metrics.arrivalRate} people/min arriving. Each accepted demo scan improves throughput.</p><div className="throughput-bar"><i style={{width:`${Math.min(100, metrics.scanThroughput / metrics.arrivalRate * 100)}%`}}/></div></div><div className="panel privacy-card"><ShieldCheck/><div><strong>Privacy by design</strong><p>QR contains event ID, ticket ID, nonce, audience, and expiry—never a name, email, or phone number.</p></div></div><div className="panel sync-queue"><div className="panel-head"><h3>Offline queue</h3><span>{pending.length}</span></div>{pending.length ? pending.map((_, index) => <div key={index}><CloudOff/><span>Signed pass ••••1042</span><small>Waiting</small></div>) : <p>No pending scans. Disconnect to demonstrate resilient check-in.</p>}</div></aside>
    </section>
  </div>;
}

function Leaderboard() {
  return <section className="panel leaderboard"><div className="panel-head"><div><span className="eyebrow"><Gauge size={14}/>LIVE LEADERBOARD</span><h3>Published aggregate scores</h3></div><span className="fair-badge"><Scale size={14}/>Raw scores · FairScore monitored</span></div><div className="leaderboard-head"><span>Rank</span><span>Team</span><span>Reviews</span><span>Score</span></div>{teams.map((team, index) => <div className="leader-row" key={team.id}><strong>0{index + 1}</strong><div><span className={`rank-mark rank-${index + 1}`}>{team.name.slice(0,1)}</span><span><b>{team.name}</b><small>{team.project}</small></span></div><span>{team.judged}/3</span><strong>{team.score}</strong></div>)}</section>;
}

export function OrvioApp({ initialView = "organizer" }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [announcements, setAnnouncements] = useState(seededAnnouncements);
  const [audits, setAudits] = useState(auditEvents);
  const [toast, setToast] = useState<Toast>(null);
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 5000); return () => window.clearTimeout(timer); }, [toast]);
  return <div className="app-shell"><Sidebar view={view} setView={setView} open={navOpen} close={() => setNavOpen(false)}/><main><Topbar view={view} openMenu={() => setNavOpen(true)}/><div className="demo-ribbon"><span><ShieldCheck size={14}/>DEMO ENVIRONMENT</span>Synthetic event data · production authorization documented and testable</div><div className="page-content">{view === "organizer" && <OrganizerView metrics={metrics} setMetrics={setMetrics} setAnnouncements={setAnnouncements} audits={audits} setAudits={setAudits} toast={setToast}/>} {view === "participant" && <ParticipantView announcements={announcements} toast={setToast}/>} {view === "judge" && <JudgeView toast={setToast} setAudits={setAudits}/>} {view === "scanner" && <ScannerView metrics={metrics} setMetrics={setMetrics} setAudits={setAudits} toast={setToast}/>}</div></main><ToastMessage toast={toast} dismiss={() => setToast(null)}/></div>;
}
