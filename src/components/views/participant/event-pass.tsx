"use client";

import { QrCode, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { PassState } from "../../hooks/use-signed-pass";

/**
 * Signed event pass.
 *
 * The encoded token carries an event id, ticket id, nonce, audience, and
 * expiry — never a name, email, or phone number. The readable identity below
 * the graphic is what makes the pass usable at a gate; the QR itself stays
 * free of personal data even if it is photographed.
 *
 * Issuing can fail, so the card has three states. A failure says so and offers
 * a retry rather than leaving a spinner that never resolves.
 */
export function EventPass({
  state,
  onRetry,
}: {
  state: PassState;
  onRetry: () => void;
}) {
  return (
    <div className="panel pass-card" data-tour="pass">
      <div className="panel-head">
        <div>
          <p className="eyebrow">
            <QrCode size={13} aria-hidden="true" />
            Signed event pass
          </p>
          <h3>Your check-in QR</h3>
        </div>
        <ShieldCheck size={19} aria-hidden="true" />
      </div>

      {state.status === "ready" ? (
        <>
          <div
            className="qr-wrap"
            role="img"
            aria-label={`Signed event pass QR code for ${state.pass.name}, ticket ending ${state.pass.ticketSuffix}. Contains no personal data.`}
          >
            <QRCodeSVG
              value={state.pass.token}
              size={150}
              level="M"
              marginSize={2}
              title={`Signed pass for ${state.pass.name}`}
            />
          </div>
          <p className="pass-name">{state.pass.name}</p>
          <p className="pass-ticket">
            Ticket <code>••••{state.pass.ticketSuffix}</code> · No personal data
            in QR
          </p>
          <p className="secure-note">
            <ShieldCheck size={14} aria-hidden="true" />
            Signed · event-scoped · replay protected
          </p>
        </>
      ) : state.status === "issuing" ? (
        <div className="qr-wrap" aria-busy="true">
          <span className="qr-loading">
            <RefreshCw className="spin" aria-hidden="true" />
            <span className="visually-hidden">Issuing signed pass</span>
          </span>
        </div>
      ) : (
        <div className="pass-error" role="alert">
          <TriangleAlert size={26} aria-hidden="true" />
          <strong>Pass could not be issued</strong>
          <p>{state.error}</p>
          <button type="button" className="secondary-button" onClick={onRetry}>
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
