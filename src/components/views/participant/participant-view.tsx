"use client";

import { CheckCircle2, RadioTower } from "lucide-react";
import { useMemo, useState } from "react";
import { postJson, type RegistrationResponse } from "@/lib/api/contracts";
import { DEMO_EVENT_ID } from "@/lib/domain/demo";
import { recommendTeams } from "@/lib/domain/matching";
import { currentParticipant } from "@/lib/domain/seed";
import type { Announcement, Team } from "@/lib/domain/types";
import { useSignedPass } from "../../hooks/use-signed-pass";
import type { ShowToast } from "../../types";
import { Leaderboard } from "../leaderboard";
import { EventPass } from "./event-pass";
import { LiveUpdates } from "./live-updates";
import { MatchLab } from "./match-lab";
import { RegistrationForm, type RegistrationDraft } from "./registration-form";

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
  const { state: pass, retry: retryPass, adopt: adoptPass } = useSignedPass();
  const [registering, setRegistering] = useState(false);

  async function register(draft: RegistrationDraft) {
    setRegistering(true);
    const result = await postJson<RegistrationResponse>("/api/registration", {
      eventId: DEMO_EVENT_ID,
      ...draft,
    });
    setRegistering(false);

    if (!result.ok) {
      toast({
        title: "Registration blocked",
        detail: result.error,
        kind: "warning",
      });
      return;
    }

    const suffix = result.data.ticketId.slice(-4);
    // The new attendee's pass replaces the seeded one everywhere it is shown.
    adoptPass({
      token: result.data.token,
      ticketSuffix: suffix,
      name: result.data.participant.name,
    });
    toast({
      title: "Attendee registered",
      detail: `Unique ticket \u2022\u2022\u2022\u2022${suffix} issued with a signed QR pass.`,
    });
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
          <EventPass state={pass} onRetry={retryPass} />
          <LiveUpdates announcements={announcements} />
        </aside>
      </section>

      <Leaderboard teams={teams} />
    </div>
  );
}
