import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="page-content">
      <h1>Page not found</h1>
      <p>
        That route is not part of the Orvio Pulse demo. Open the control tower
        or a role workspace instead.
      </p>
      <p>
        <Link href="/">Control tower</Link>
        {" · "}
        <Link href="/participant">Participant</Link>
        {" · "}
        <Link href="/judge">Judge</Link>
        {" · "}
        <Link href="/scanner">Scanner</Link>
      </p>
    </main>
  );
}
