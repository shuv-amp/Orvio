# Orvio Pulse — pitch script for the live round

**Format:** 3–5 min presentation + live demo, then ~2 min Q&A with the jury.
**Live:** https://orvio-pulse.vercel.app/ · **Code:** https://github.com/shuv-amp/Orvio

The organisers asked for three things. This script delivers them in order:

1. Quick overview of how the platform solves the challenge → §4
2. Live walkthrough: QR check-in, team formation, broadcast feed, judging
   view, leaderboard → §5
3. Prompt engineering and technical architecture, including Google Antigravity
   usage and the tech stack → §6

> **§6d needs your input before you go on.** The architecture half I can write
> accurately, because it is in the code. The Antigravity and prompt
> engineering half is your account of how you actually worked, and I will not
> invent it for you. Fill in the four blanks — ten minutes of work, and it is
> the section a prompt engineering jury will probe hardest.

---

## 1. The one sentence

> Most event platforms tell you what already happened. Orvio tells you what is
> about to break, and it will not act without a human saying yes.

Say it once, early. Everything after it is evidence.

---

## 2. Pre-flight, five minutes before

- [ ] Live link open in a **fresh incognito window**, cold-loaded once so the
      first paint is warm.
- [ ] Five tabs in demo order: `/` · `/participant` · `/scanner` · `/judge` ·
      GitHub on `docs/architecture.md`. Switching tabs beats clicking through
      nav while you are talking.
- [ ] Pick a theme and leave it. **Dark reads better on a shared screen.**
- [ ] Browser zoom 110–125%.
- [ ] Share the **browser window**, not the whole desktop. Notifications off.
- [ ] `npm run dev` already running locally as a fallback tab.

**If the deploy is cold or the wifi is bad:** switch to localhost and say
_"running it locally so we don't lose time to a cold start."_ Nobody minds.
Forty seconds of spinner is what costs you.

---

## 3. Time budget

| Segment                                     | Target | If you are running late |
| ------------------------------------------- | ------ | ----------------------- |
| Problem + the one sentence (§4)             | 0:40   | —                       |
| Control tower, Event Pulse, recovery (§5.1) | 1:00   | —                       |
| Team formation + signed pass (§5.2)         | 0:45   | drop the live signup    |
| Scanner: offline → replay rejected (§5.3)   | 0:45   | **never cut this**      |
| Broadcast feed (§5.4)                       | 0:20   | shorten, do not skip    |
| Judging + leaderboard + analytics (§5.5)    | 0:35   | —                       |
| Architecture + prompt engineering (§6)      | 0:45   | trim to the stack list  |
| **Total**                                   | ~4:30  |                         |

Broadcast is explicitly on the organisers' list, so it stays in. If you are
overrunning, cut it to one sentence and one click rather than dropping it.

---

## 4. Open on the problem (0:00–0:40)

**Say this before you show anything:**

> Every hackathon I have been to runs on the same stack. A Google Form for
> registration. A WhatsApp group for announcements. A spreadsheet for teams.
> One volunteer at the gate with a printed list.
>
> It holds up until it doesn't. The queue backs up. Someone misses a room
> change because they muted the group. Judges score in a separate sheet, and
> the leaderboard is whatever the organizer types in at the end.
>
> Orvio Pulse is one dashboard for that entire lifecycle. Four roles —
> organizer, participant, judge, and the gate — reading one live event state.

Do not open with "I built an AI-powered platform." Open with the printed list.
You are describing their week.

---

## 5. Live walkthrough

### 5.1 Control tower — prediction (0:40–1:40)

**Screen:** `/`

**[POINT] the four tiles.**

> Organizer view. Attendance, team readiness, judging progress, announcement
> reach. Those sparklines are drawn from the same series the number comes
> from, so a chart can't imply a trend the data doesn't have.

**[POINT] Event Pulse.**

> This is the differentiator. Orvio watches four live constraints and ranks
> what is closest to breaking. Not a generic alert — each card gives you the
> metric, the threshold it crossed, and the next safe action.
>
> North Gate: 26 people a minute arriving, 20 a minute getting scanned. That
> gap is a queue forming, about twelve minutes before anyone in the room feels
> it.

**[CLICK] "Simulate disruption".**

> So let's break something. A judge drops out.

**[POINT] the before/after projection.**

> Orvio projects completion time without recovery and with it. It drafts the
> announcement. And then it stops. It will not send that message. It will not
> rebalance anything.

**[CLICK] "Review & approve".**

> A human approves. Now it applies, the announcement goes out, and it lands in
> the audit trail with my name on it.

**Land the thesis here:**

> That is the whole design. The machine measures and proposes. A person
> decides.

### 5.2 Participant — team formation and the signed pass (1:40–2:25)

**Screen:** `/participant`

**[POINT] Match Lab.**

> Team formation. Most tools hand you one match percentage and no reasoning.
> Orvio breaks it into the four things it actually measured — skill coverage,
> shared interests, role complement, availability.
>
> The research on hackathon teams is consistent: forced assignment kills
> agency, pure self-selection creates imbalance. So Orvio ranks, and the
> participant still picks. There is a structured swap if you disagree with it.

**[POINT] the QR pass.**

> And this is the check-in pass. Look at what is inside it.
>
> An event id, a ticket id, a nonce, an expiry. No name. No email. No phone
> number. If somebody photographs your pass off a table, they get nothing
> worth having.

_Optional if time allows:_ register a walk-up attendee live — name, role, one
skill, submit. A unique ticket UUID and a fresh signed pass come back in about
a second.

### 5.3 Scanner — the segment that wins the room (2:25–3:10)

**Screen:** `/scanner`

**Your strongest 45 seconds. Slow down. Click, pause, then say the line — do
not narrate over your own clicking.**

> Gate check-in. Venue wifi is the least reliable thing at any event, so watch
> this.

**[CLICK] the Online toggle → offline.** · **[CLICK] "Scan the signed demo pass".**

> Queued. And notice _what_ got queued: the signed token and an idempotency
> key. Nothing about the attendee is stored on that device.

**[CLICK] the toggle → reconnect.**

> Back online, the queue replays, the server verifies it.

**[CLICK] "Scan the signed demo pass" again.**

> Same pass, second time. Rejected.
>
> And the phone did not decide that. One Firestore transaction claims the
> nonce. Whether a scan arrives now or an hour later, the server is the only
> thing that decides whether it counts. You cannot inflate attendance by
> scanning twice.

### 5.4 Broadcast feed (3:10–3:30)

**Screen:** `/` → **Broadcasts**

**[POINT] the audience selector.**

> Broadcasts. The point is targeting — unchecked attendees, or just the
> assigned judges. Not one channel everybody muted an hour ago.

**[CLICK] "Send targeted update".**

> It goes out, the delivery ledger tracks acknowledgement, and it is written
> to the audit trail. Organizer text is sanitized and markup is rejected
> before it is ever stored, so the announcement feed can't become an injection
> surface for the participant screen that renders it.

### 5.5 Judging, leaderboard, analytics (3:30–4:05)

**Screen:** `/judge`

> Judging. Locked rubric, weighted, and the feedback field has to point at
> evidence.

**[CLICK] "Finalize".**

> Finalizing goes one way. The controls disable. There is no quietly editing a
> score afterwards, and it is written to the audit trail.

**[SWITCH] to the `/` tab.**

> And the leaderboard has already re-ranked. Not on refresh — now.

**[CLICK] Analytics in the sidebar.**

> And the organizer analytics view. Attendance, team formation, judging
> progress, reach, gate headroom. Every figure comes from the same live state
> the rest of the platform reads, so this view can't disagree with the control
> tower.
>
> Gate headroom is flagged Action needed. That is the same queue we saw at the
> start of the demo, now as a tracked measure.

---

## 6. Architecture and prompt engineering (4:05–4:50)

Stay on the analytics screen, or switch to `docs/architecture.md`.

### 6a. The stack — accurate, say it as written

> Next.js on the App Router with React Server Components, TypeScript in strict
> mode. Firebase Auth for role claims, Firestore for the ticket store and the
> replay lock, Vertex AI Gemini for one narrow job. Containerised with a
> Dockerfile and Cloud Build for Cloud Run; the link you are on is the Vercel
> deployment.

### 6b. The architecture decision worth one sentence

> The domain layer does no I/O. Matching, risk scoring, rubric maths,
> leaderboard ranking and analytics are pure functions over plain data — which
> is why there are 195 unit tests at about 90% coverage on the domain and
> server layers. Every consequential change goes through one reducer, and the
> audit entry is written by the same branch that changes the number, so the
> log and the state cannot drift apart.

### 6c. Where the AI actually sits

> Gemini has exactly one job: turning structured facts into a readable
> announcement. It never decides anything. Risk scoring, matching, pass
> verification and rubric scoring are deterministic — you can read the
> function and predict the output.
>
> And if Vertex AI is unavailable, the endpoint returns the same plan with
> `source: "deterministic-fallback"`, and the UI tells you which one you got.
> The demo cannot fail because a model call failed.

### 6d. Prompt engineering and Google Antigravity — **FILL THIS IN**

This is a prompt engineering competition. The jury _will_ ask. Prepare a true,
specific 30-second answer covering four things:

1. **Which tools you used, and for what.** Name them honestly — Antigravity,
   Gemini, an AI coding assistant, whichever you actually used. Judges respect
   a straight answer and can usually tell when one is being dodged.

2. **One concrete technique, and why.** Not "I wrote good prompts." Something
   specific. Examples of the shape they are looking for:
   - constraining model output to a fixed schema so the response could be
     parsed rather than scraped;
   - writing the deterministic fallback _first_, so the model path was never
     load-bearing;
   - iterating on the recovery prompt until it stopped inventing metrics and
     only rephrased numbers it had been handed.

3. **One thing that did not work, and what you changed.** This is the single
   most credible thing you can say in a Q&A. A team that can name a failed
   approach sounds like a team that actually built the thing.

4. **How you stopped the model fabricating.** True for this codebase: Gemini
   only ever receives already-computed facts and only rewrites them into
   prose. It is never asked to produce a number that reaches the UI.

**Fill in before you present:**

```
Tools used:              ____________________________________________
Where Antigravity fit:   ____________________________________________
Technique + why:         ____________________________________________
What failed + the fix:   ____________________________________________
```

---

## 7. Close (4:50–5:00)

> Registration, QR check-in, team formation, broadcasts, judging, live
> leaderboard, analytics. One dashboard, four roles, one source of truth.
>
> And one rule running through all of it: Orvio measures and proposes. A human
> decides.

**Then stop.** Do not trail off into "yeah, so that's basically it."

---

## 8. The 90-second version, if you get cut short

1. The printed-list problem. (15s)
2. Event Pulse → simulate → **stop at human approval**. (30s)
3. Scanner: offline → reconnect → duplicate rejected. (30s)
4. Finalize a score, leaderboard re-ranks. (10s)
5. "Measures and proposes. A human decides." (5s)

---

## 9. Q&A — two minutes, expect three or four questions

**"How is this different from Devfolio or Hi.Events?"**

> They are very good at recording what happened — registration, tickets, logs.
> Orvio is built around the fifteen minutes _before_ something goes wrong. I
> studied Hi.Events, eventyay and pretix while designing this; the attendee
> lifecycle patterns are proven, so I didn't reinvent them. The pulse engine
> and the recovery desk are what I added.

**"Where is the AI? This looks deterministic."**
Deliver §6c.

**"Is this real or a mockup?"**

> Real. The QR is signed with JOSE and verified server-side. Check-in runs a
> Firestore transaction. 195 unit tests, about 90% coverage on the domain and
> server layers, plus Playwright end-to-end tests and axe accessibility checks.
> The event data is synthetic and the UI labels it as demo data — I would
> rather tell you that than have you find it.

**"What about scale?"**

> Every analytics figure is constant time over the live event slice, apart
> from one linear pass over the team list. Queries are event-scoped. No client
> downloads a collection to compute one screen. I have not load tested it, so
> I won't give you a number.

**"Security?"**

> No personal data in the QR. Passes are signed, short-lived, scoped to one
> event and one audience. Replay is blocked by a Firestore transaction, not by
> the client. Mutating endpoints require a same-origin header, cap body size,
> and rate limit per identity. Attendee text is sanitized and markup rejected.
> Nonce-based CSP with no inline scripts.

**"Accessibility?"**

> Tested, not claimed. axe-core runs against every screen, light and dark. Fit
> scores are real `meter` elements so the value is announced. The leaderboard
> is a real table with a caption. High contrast works independently of dark
> mode, because contrast is an access need and dark mode is a preference.
> Every status carries a word, not only a colour.

**"Which Google services?"**

> Firebase Auth for role claims. Firestore for the ticket store and the atomic
> replay lock. Vertex AI Gemini for announcement drafting. Cloud Build and
> Cloud Run for the container. Each has a deterministic fallback, so an API
> outage cannot take the demo down.

**"What would you build next?"**

> Three things. Real-time sync so two organizers see the same board without
> refreshing. Per-event configuration — the rubric and thresholds are fixed
> right now. And load testing, because I have a scaling argument but not a
> scaling measurement.

---

## 10. Do not say

- ~~"Production ready."~~ → "The security and data model are designed for
  production; the event data here is synthetic."
- ~~"It scales to thousands."~~ → You have not measured it. Say so.
- ~~"Fully tested."~~ → "195 unit tests, ~90% coverage on domain and server."
  The number convinces more than the adjective, and cannot be challenged.
- ~~"Powered by AI."~~ → Undersell Gemini. Let the fallback design impress
  them instead.
- Do not apologise for synthetic data. Label it once, confidently, move on.

---

## 11. If something breaks mid-demo

| Breaks               | Do this                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Pass won't issue     | The card shows the error and a Retry button. Click it: "that's the failure path — it tells you instead of hanging." |
| Deploy is cold       | Switch to the local tab. "Cold start; same build, running locally."                                                 |
| A click does nothing | Move on. Do not click it twice on camera.                                                                           |
| You lose your place  | Go to `/`, press ⌘K, type the screen name. Two keystrokes to anywhere.                                              |
| Asked for the code   | Fifth tab: `docs/architecture.md` — diagrams and the requirement-to-code map.                                       |

---

## 12. Delivery

- **One idea per screen.** Control tower = prediction. Participant = privacy.
  Scanner = resilience. Judge = integrity. Analytics = one source of truth.
- **Do not read the screen aloud.** They can read. Tell them what it means.
- **Slow down on the scanner.** Everything before it is setup.
- Practise §4 and §5.3 out loud, twice. Those two decide the round.
