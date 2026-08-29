"use client";

import { ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { simulateIncident } from "@/lib/domain/pulse";
import type { IncidentType, RecoveryProposal } from "@/lib/domain/types";
import type { Command } from "@/lib/ui/commands";
import { TOUR_STEPS, nextStep, previousStep } from "@/lib/ui/tour";
import { useAppearance } from "./hooks/use-appearance";
import { useEventState } from "./hooks/use-event-state";
import { CommandPalette } from "./shell/command-palette";
import { GuidedTour } from "./shell/guided-tour";
import { MobileRoleDock } from "./shell/mobile-dock";
import { Sidebar } from "./shell/sidebar";
import { ToastMessage } from "./shell/toast";
import { Topbar } from "./shell/topbar";
import type { OrganizerSection, Toast, View } from "./types";
import { JudgeView } from "./views/judge/judge-view";
import { OrganizerView } from "./views/organizer/organizer-view";
import { ParticipantView } from "./views/participant/participant-view";
import { ScannerView } from "./views/scanner/scanner-view";

const TOAST_TIMEOUT_MS = 5000;
const ORGANIZER = "Shuvam (Organizer)";
const JUDGE = "Judge Arjun";

const viewLabels: Record<View, string> = {
  organizer: "Control tower",
  participant: "Participant home",
  judge: "Judging portal",
  scanner: "Gate scanner",
};

/**
 * Application shell.
 *
 * This component owns navigation, appearance, and the overlays; every
 * consequential change to event data goes through the pure reducer behind
 * {@link useEventState}, and every screen is a self-contained view module.
 */
export function OrvioApp({
  initialView = "organizer",
}: {
  initialView?: View;
}) {
  const [state, dispatch] = useEventState();
  const appearance = useAppearance();

  const [view, setView] = useState<View>(initialView);
  const [organizerSection, setOrganizerSection] =
    useState<OrganizerSection>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Element to hand focus back to once a modal overlay closes.
  const overlayReturnFocus = useRef<HTMLElement | null>(null);

  const [proposal, setProposal] = useState<RecoveryProposal | null>(null);
  const [incidentType, setIncidentType] =
    useState<IncidentType>("judge-dropout");
  const [simulating, setSimulating] = useState(false);

  const openOverlay = useCallback(() => {
    overlayReturnFocus.current = document.activeElement as HTMLElement | null;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // The palette is the only global shortcut, so it does not compete with the
  // browser's own bindings or with typing inside a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      setPaletteOpen((current) => {
        if (!current) openOverlay();
        return !current;
      });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openOverlay]);

  const goTo = useCallback((next: View, section?: OrganizerSection) => {
    setView(next);
    if (next === "organizer") setOrganizerSection(section ?? "overview");
    setNavOpen(false);
  }, []);

  const selectOrganizerSection = useCallback(
    (section: OrganizerSection) => goTo("organizer", section),
    [goTo],
  );

  const simulate = useCallback(
    async (incident: IncidentType) => {
      setIncidentType(incident);
      setSimulating(true);
      try {
        const response = await fetch("/api/recovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ incident }),
        });
        setProposal(
          response.ok
            ? await response.json()
            : simulateIncident(incident, state.metrics),
        );
      } catch {
        // A recovery draft must always appear; fall back to the deterministic
        // projection rather than leaving the incident desk empty.
        setProposal(simulateIncident(incident, state.metrics));
      } finally {
        setSimulating(false);
      }
    },
    [state.metrics],
  );

  const approveRecovery = useCallback(() => {
    if (!proposal) return;
    dispatch({ type: "recovery-approved", proposal, actor: ORGANIZER });
    setProposal({ ...proposal, status: "approved" });
    setToast({
      title: "Recovery plan activated",
      detail: "The approved change is now in the announcement and audit feed.",
    });
  }, [dispatch, proposal]);

  const runCommand = useCallback(
    (command: Command) => {
      setPaletteOpen(false);
      const { action } = command;
      switch (action.kind) {
        case "navigate":
          goTo(action.view, action.section);
          break;
        case "simulate":
          goTo("organizer", "overview");
          void simulate(action.incident);
          break;
        case "cycle-theme":
          appearance.cycleTheme();
          break;
        case "toggle-contrast":
          appearance.toggleContrast();
          break;
        case "start-tour":
          setTourStep(0);
          break;
      }
    },
    [appearance, goTo, simulate],
  );

  const startTour = useCallback(() => {
    openOverlay();
    goTo(TOUR_STEPS[0].view, TOUR_STEPS[0].section);
    setTourStep(0);
  }, [goTo, openOverlay]);

  const moveTour = useCallback(
    (direction: 1 | -1) => {
      setTourStep((current) => {
        if (current === null) return null;
        const next =
          direction === 1 ? nextStep(current) : previousStep(current);
        if (next === null) return direction === 1 ? null : current;
        const step = TOUR_STEPS[next];
        goTo(step.view, step.section);
        return next;
      });
    },
    [goTo],
  );

  // While a modal overlay is open the rest of the app is inert: it leaves the
  // accessibility tree and the tab order, so a screen reader or keyboard user
  // cannot wander into content that is visually behind a scrim.
  const overlayOpen = paletteOpen || tourStep !== null;

  useEffect(() => {
    if (overlayOpen) return;
    // Runs after the render that removed `inert`, so the trigger is focusable.
    overlayReturnFocus.current?.focus();
    overlayReturnFocus.current = null;
  }, [overlayOpen]);

  return (
    <>
      <div className="app-shell" inert={overlayOpen}>
        <Sidebar
          view={view}
          organizerSection={organizerSection}
          selectView={goTo}
          selectOrganizerSection={selectOrganizerSection}
          open={navOpen}
          close={() => setNavOpen(false)}
        />

        <main id="main-content" aria-label={viewLabels[view]}>
          <Topbar
            view={view}
            organizerSection={organizerSection}
            announcements={state.announcements}
            openMenu={() => setNavOpen(true)}
            navOpen={navOpen}
            openPalette={() => {
              openOverlay();
              setPaletteOpen(true);
            }}
            startTour={startTour}
            goToBroadcasts={() => goTo("organizer", "broadcasts")}
            themeChoice={appearance.themeChoice}
            resolvedTheme={appearance.resolvedTheme}
            cycleTheme={appearance.cycleTheme}
            contrast={appearance.contrast}
            toggleContrast={appearance.toggleContrast}
          />

          <p className="demo-ribbon">
            <span className="demo-ribbon-tag">
              <ShieldCheck size={13} aria-hidden="true" />
              Demo environment
            </span>
            Synthetic event data · production authorization documented and
            testable
          </p>

          <div className="page-content">
            {view === "organizer" && (
              <OrganizerView
                section={organizerSection}
                metrics={state.metrics}
                announcements={state.announcements}
                audits={state.audits}
                teams={state.teams}
                proposal={proposal}
                incidentType={incidentType}
                setIncidentType={setIncidentType}
                simulating={simulating}
                onSimulate={() => void simulate(incidentType)}
                onApprove={approveRecovery}
                onSendBroadcast={(audience, body) => {
                  dispatch({
                    type: "broadcast-sent",
                    audience,
                    body,
                    actor: ORGANIZER,
                  });
                  setToast({
                    title: "Broadcast queued",
                    detail: `${audience} will receive the update through the live feed.`,
                  });
                }}
                onOpenAudit={() => goTo("organizer", "audit")}
                startTour={startTour}
                toast={setToast}
              />
            )}

            {view === "participant" && (
              <ParticipantView
                announcements={state.announcements}
                teams={state.teams}
                toast={setToast}
              />
            )}

            {view === "judge" && (
              <JudgeView
                onFinalize={(input) =>
                  dispatch({ type: "score-finalized", judge: JUDGE, ...input })
                }
                toast={setToast}
              />
            )}

            {view === "scanner" && (
              <ScannerView
                metrics={state.metrics}
                onAccepted={(ticketSuffix, gate) =>
                  dispatch({ type: "check-in-accepted", ticketSuffix, gate })
                }
                toast={setToast}
              />
            )}
          </div>
        </main>

        <MobileRoleDock view={view} selectView={goTo} />
      </div>

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onRun={runCommand}
        />
      )}

      {tourStep !== null && (
        <GuidedTour
          stepIndex={tourStep}
          onNext={() => moveTour(1)}
          onPrevious={() => moveTour(-1)}
          onClose={() => setTourStep(null)}
        />
      )}

      <ToastMessage toast={toast} dismiss={() => setToast(null)} />
    </>
  );
}
