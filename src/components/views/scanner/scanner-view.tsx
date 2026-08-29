"use client";

import {
  CheckCircle2,
  CloudOff,
  QrCode,
  ScanLine,
  ShieldCheck,
  TriangleAlert,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DEMO_EVENT_ID } from "@/lib/domain/demo";
import type { EventMetrics } from "@/lib/domain/types";
import { StatusPill } from "../../ui/status-pill";
import type { ShowToast } from "../../types";

const DEMO_TICKET_ID = "5c327c3a-2d3f-49c6-b087-f8de29ae1042";
const SCANNER_ID = "north-gate-01";
const GATE_LABEL = "North Gate 01";

type ScanResult = "idle" | "accepted" | "duplicate" | "queued" | "invalid";

interface QueuedScan {
  token: string;
  idempotencyKey: string;
}

const resultCopy: Record<
  Exclude<ScanResult, "idle">,
  { title: string; detail: string; icon: typeof CheckCircle2 }
> = {
  accepted: {
    title: "Check-in accepted",
    detail: "Ticket ••••1042 · North Gate",
    icon: CheckCircle2,
  },
  duplicate: {
    title: "Duplicate blocked",
    detail: "First accepted at this gate moments ago",
    icon: TriangleAlert,
  },
  queued: {
    title: "Stored offline",
    detail: "Will verify automatically on reconnect",
    icon: CloudOff,
  },
  invalid: {
    title: "Pass invalid",
    detail: "Ask the attendee to open a fresh pass",
    icon: X,
  },
};

/**
 * Gate scanner.
 *
 * Offline scans are held locally as a signed token plus an idempotency key —
 * never attendee data — and replayed on reconnect. Whether a scan arrives
 * immediately or an hour later, the server transaction is the single authority
 * on whether it counts, so a duplicate can never inflate attendance.
 */
export function ScannerView({
  metrics,
  onAccepted,
  toast,
}: {
  metrics: EventMetrics;
  onAccepted: (ticketSuffix: string, gate: string) => void;
  toast: ShowToast;
}) {
  const [online, setOnline] = useState(true);
  const [token, setToken] = useState("");
  const [queue, setQueue] = useState<QueuedScan[]>([]);
  const [result, setResult] = useState<ScanResult>("idle");

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
        // Leave the scan button disabled rather than scanning an empty pass.
      });
    return () => controller.abort();
  }, []);

  async function sync(qrToken: string, idempotencyKey: string) {
    const response = await fetch("/api/check-ins/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: DEMO_EVENT_ID,
        qrToken,
        scannerId: SCANNER_ID,
        scannedAt: new Date().toISOString(),
        idempotencyKey,
      }),
    });
    const data: { status?: string; ticketSuffix?: string } =
      await response.json();
    const status: ScanResult =
      data.status === "accepted"
        ? "accepted"
        : data.status === "duplicate"
          ? "duplicate"
          : "invalid";
    setResult(status);
    if (status === "accepted") {
      onAccepted(data.ticketSuffix ?? "1042", GATE_LABEL);
    }
    return status;
  }

  async function scan() {
    if (!token) return;
    const idempotencyKey = crypto.randomUUID();
    if (!online) {
      setQueue((current) => [...current, { token, idempotencyKey }]);
      setResult("queued");
      toast({
        title: "Stored safely offline",
        detail:
          "Only the signed pass and idempotency key were queued — no personal data.",
      });
      return;
    }
    const status = await sync(token, idempotencyKey);
    toast(
      status === "accepted"
        ? {
            title: "Check-in accepted",
            detail: "Attendance and Event Pulse updated live.",
          }
        : {
            title:
              status === "duplicate" ? "Duplicate blocked" : "Pass rejected",
            detail:
              status === "duplicate"
                ? "This pass was already checked in; no second attendance record was created."
                : "The signature, audience, or expiry did not verify.",
            kind: "warning",
          },
    );
  }

  async function reconnect() {
    setOnline(true);
    const pending = queue;
    setQueue([]);
    for (const item of pending) {
      await sync(item.token, item.idempotencyKey);
    }
    toast({
      title: "Offline queue synchronized",
      detail: "All queued scans were verified against the server replay lock.",
    });
  }

  const active = result === "idle" ? null : resultCopy[result];
  const ResultIcon = active?.icon;
  const throughputRatio = Math.min(
    100,
    Math.round((metrics.scanThroughput / metrics.arrivalRate) * 100),
  );

  return (
    <div className="view-stack">
      <section className="hero-row">
        <div>
          <p className="eyebrow">
            <ScanLine size={13} aria-hidden="true" />
            North Gate · Scanner 01
          </p>
          <h2>Fast check-in. Safe under pressure.</h2>
          <p className="hero-sub">
            Signed passes verify without exposing attendee data.
          </p>
        </div>
        <button
          type="button"
          className={`connection-toggle ${online ? "online" : "offline"}`}
          onClick={() => (online ? setOnline(false) : reconnect())}
          aria-pressed={!online}
        >
          {online ? (
            <Wifi size={18} aria-hidden="true" />
          ) : (
            <WifiOff size={18} aria-hidden="true" />
          )}
          <span>
            <strong>{online ? "Online" : "Offline mode"}</strong>
            <small>
              {online
                ? "Server replay checks active"
                : `${queue.length} scan${queue.length === 1 ? "" : "s"} queued`}
            </small>
          </span>
        </button>
      </section>

      <section className="scanner-grid">
        <div className="scan-stage" data-tour="scan-stage">
          <div className={`scan-frame ${result}`}>
            <span className="corner top-left" aria-hidden="true" />
            <span className="corner top-right" aria-hidden="true" />
            <span className="corner bottom-left" aria-hidden="true" />
            <span className="corner bottom-right" aria-hidden="true" />
            <div className="scan-readout" role="status">
              {ResultIcon && active ? (
                <>
                  <ResultIcon size={72} aria-hidden="true" />
                  <strong>{active.title}</strong>
                  <span>{active.detail}</span>
                </>
              ) : (
                <>
                  <QrCode size={72} aria-hidden="true" />
                  <strong>Ready to scan</strong>
                  <span>Camera preview represented in demo mode</span>
                </>
              )}
            </div>
          </div>
          <div className="scan-controls">
            {/* The label stays constant while the pass is being issued so the
                control keeps one accessible name; `aria-busy` carries the
                pending state instead. */}
            <button
              type="button"
              className="scan-button"
              onClick={scan}
              disabled={!token}
              aria-busy={!token}
            >
              <ScanLine size={18} aria-hidden="true" />
              Scan the signed demo pass
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setResult("idle")}
            >
              Reset scanner view
            </button>
          </div>
        </div>

        <aside className="scan-sidebar" aria-label="Gate status">
          <div className="panel">
            <div className="panel-head">
              <h3>Gate pulse</h3>
              <StatusPill
                severity={
                  metrics.arrivalRate / metrics.scanThroughput > 1.2
                    ? "critical"
                    : "watch"
                }
              />
            </div>
            <p className="gate-number">
              <strong>{metrics.scanThroughput}</strong>
              <span>people/min</span>
            </p>
            <p className="gate-note">
              {metrics.arrivalRate} people/min arriving. Each accepted demo scan
              improves throughput.
            </p>
            <div
              className="throughput-bar"
              role="meter"
              aria-label="Scanning capacity against arrival demand"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={throughputRatio}
              aria-valuetext={`${throughputRatio} percent of arrival demand`}
            >
              <i style={{ inlineSize: `${throughputRatio}%` }} />
            </div>
          </div>

          <p className="panel privacy-card">
            <ShieldCheck size={19} aria-hidden="true" />
            <span>
              <strong>Privacy by design</strong>
              QR contains event ID, ticket ID, nonce, audience, and expiry —
              never a name, email, or phone number.
            </span>
          </p>

          <div className="panel sync-queue">
            <div className="panel-head">
              <h3>Offline queue</h3>
              <span className="queue-count">{queue.length}</span>
            </div>
            {queue.length > 0 ? (
              <ul>
                {queue.map((item) => (
                  <li key={item.idempotencyKey}>
                    <CloudOff size={15} aria-hidden="true" />
                    <span>Signed pass ••••1042</span>
                    <small>Waiting</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="queue-empty">
                No pending scans. Disconnect to demonstrate resilient check-in.
              </p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
