"use client";

import { QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

/**
 * Signed event pass.
 *
 * The encoded token carries an event id, ticket id, nonce, audience, and
 * expiry — never a name, email, or phone number. The readable identity below
 * the graphic is what makes the pass usable at a gate; the QR itself stays
 * free of personal data even if it is photographed.
 */
export function EventPass({
  token,
  name,
  ticketSuffix,
}: {
  token: string;
  name: string;
  ticketSuffix: string;
}) {
  const ready = token.startsWith("ey");
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

      <div
        className="qr-wrap"
        role="img"
        aria-label={`Signed event pass QR code for ${name}, ticket ending ${ticketSuffix}. Contains no personal data.`}
      >
        {ready ? (
          <QRCodeSVG
            value={token}
            size={150}
            level="M"
            marginSize={2}
            title={`Signed pass for ${name}`}
          />
        ) : (
          <span className="qr-loading">
            <RefreshCw className="spin" aria-hidden="true" />
            <span className="visually-hidden">Issuing signed pass</span>
          </span>
        )}
      </div>

      <p className="pass-name">{name}</p>
      <p className="pass-ticket">
        Ticket <code>••••{ticketSuffix}</code> · No personal data in QR
      </p>
      <p className="secure-note">
        <ShieldCheck size={14} aria-hidden="true" />
        Signed · event-scoped · replay protected
      </p>
    </div>
  );
}
