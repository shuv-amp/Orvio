import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orvio Pulse — Event Operations, Before They Break",
  description: "A predictive event operations platform for check-in, team formation, judging, announcements, and live recovery.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f5ef" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // A per-request render lets Next attach the nonce generated in proxy.ts.
  await connection();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
