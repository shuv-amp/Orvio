"use client";

import Link from "next/link";

/**
 * Root-layout error boundary. Must render its own html/body.
 * Security: digest only, never a stack trace.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main id="main-content">
          <h1>Something went wrong</h1>
          <p role="status">Orvio Pulse could not recover this screen.</p>
          <p>
            <button type="button" onClick={() => reset()}>
              Try again
            </button>{" "}
            <Link href="/">Control tower</Link>
          </p>
          {error.digest ? <p>Error reference: {error.digest}</p> : null}
        </main>
      </body>
    </html>
  );
}
