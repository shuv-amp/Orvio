"use client";

import Link from "next/link";

/**
 * App Router error boundary. Security: never render `error.stack`.
 * A11y: semantic heading, status text, and keyboard-recoverable actions.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="page-content">
      <h1>Something went wrong</h1>
      <p role="status">
        The previous view hit a runtime error. Your demo data is still local to
        this browser session. Try again or return to the control tower.
      </p>
      <p>
        <button
          type="button"
          className="primary-button"
          onClick={() => reset()}
        >
          Try again
        </button>{" "}
        <Link href="/">Control tower</Link>
      </p>
      {error.digest ? (
        <p>
          Error reference: <code>{error.digest}</code>
        </p>
      ) : null}
    </main>
  );
}
