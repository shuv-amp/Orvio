"use client";

import { CheckCircle2, RadioTower } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DEMO_EVENT_ID } from "@/lib/domain/demo";
import { recommendTeams } from "@/lib/domain/matching";
import { currentParticipant } from "@/lib/domain/seed";
import type { Announcement, Team } from "@/lib/domain/types";
import type { ShowToast } from "../../types";
import { Leaderboard } from "../leaderboard";
import { EventPass } from "./event-pass";
import { LiveUpdates } from "./live-updates";
import { MatchLab } from "./match-lab";
import { RegistrationForm, type RegistrationDraft } from "./registration-form";

const DEMO_TICKET_ID = "5c327c3a-2d3f-49c6-b087-f8de29ae1042";

export function ParticipantView({
  announcements,
  teams,
  toast,
}: {
  announcements: Announcement[];
  teams: Team[];
  toast: ShowToast;
}) {
  const recommendations = useMemo(
    () => recommendTeams(currentParticipant, teams),
    [teams],
  );
  const [token, setToken] = useState("");
  const [passName, setPassName] = useState(currentParticipant.name);
  const [ticketSuffix, setTicketSuffix] = useState(DEMO_TICKET_ID.slice(-4));
  const [registering, setRegistering] = useState(false);

  // Issue the demo pass once on mount; the token is short-lived and scoped.
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/check-ins/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: DEMO_EVENT_ID,
        ticketId: DEMO_TICKET_ID,
      }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: { token?: string }) => setToken(data.token ?? ""))
      .catch(() => {
        // Aborted on unmount, or the issuer is unavailable; the pass card
        // keeps showing its loading state rather than claiming a valid pass.
      });
    return () => controller.abort();
  }, []);

  async function register(draft: RegistrationDraft) {
    setRegistering(true);
    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: DEMO_EVENT_ID, ...draft }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({
          title: "Registration blocked",
          detail: data.error ?? "Check the name, role, and skill allowlist.",
          kind: "warning",
        });
        return;
      }
      const suffix = String(data.ticketId).slice(-4);
      setToken(data.token);
      setPassName(data.participant.name);
      setTicketSuffix(suffix);
      toast({
        title: "Attendee registered",
        detail: `Unique ticket ••••${suffix} issued with a signed QR pass.`,
      });
    } catch {
      toast({
        title: "Registration unavailable",
        detail: "The registration service could not be reached.",
        kind: "warning",
      });
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="view-stack">
      <section className="hero-row participant-hero">
        <div>
          <p className="eyebrow">
            <RadioTower size={13} aria-hidden="true" />
            Participant home
          </p>
          <h2>Ready to build, {currentParticipant.name.split(" ")[0]}?</h2>
          <p className="hero-sub">
            Your check-in is verified. Your strongest team match is ready.
          </p>
        </div>
        <p className="participant-status">
          <CheckCircle2 size={20} aria-hidden="true" />
          <span>
            <strong>Checked in</strong>
            <span>North Gate · 13:42</span>
          </span>
        </p>
      </section>

      <RegistrationForm busy={registering} onSubmit={register} />

      <section className="participant-grid">
        <MatchLab
          recommendations={recommendations}
          teams={teams}
          toast={toast}
        />
        <aside className="right-stack" aria-label="Event pass and live updates">
          <EventPass
            token={token}
            name={passName}
            ticketSuffix={ticketSuffix}
          />
          <LiveUpdates announcements={announcements} />
        </aside>
      </section>

      <Leaderboard teams={teams} />
    </div>
  );
}
