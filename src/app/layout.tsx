import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { fontVariables } from "./fonts";
import "./globals.css";
import { THEME_BOOTSTRAP_SCRIPT, themeColor } from "@/lib/ui/theme";

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Orvio Pulse — Event operations, before they break",
    template: "%s · Orvio Pulse",
  },
  description:
    "Registration, signed QR check-in, team formation, judging, live leaderboard, and human-approved recovery.",
  applicationName: "Orvio Pulse",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "Orvio Pulse",
    title: "Orvio Pulse — Event operations, before they break",
    description:
      "Registration, signed QR check-in, team formation, judging, live leaderboard, and human-approved recovery.",
  },
  twitter: {
    card: "summary",
    title: "Orvio Pulse",
    description: "Event operations for check-in, teams, judging, and recovery.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: themeColor("light"),
  colorScheme: "light dark",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // A per-request render lets Next attach the nonce generated in proxy.ts.
  await connection();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // suppressHydrationWarning is required because the inline script below
    // rewrites these data attributes before React hydrates. It applies only to
    // this element's own attributes, not to anything rendered inside it.
    <html
      lang="en"
      className={fontVariables}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        {/*
          Applies the stored colour scheme and contrast before first paint.
          Without this the page would render light and then repaint dark for
          anyone who chose dark. The content is a module constant — no request
          data reaches it — and it carries the per-request CSP nonce.
        */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
