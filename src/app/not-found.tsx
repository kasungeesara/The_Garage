import Link from "next/link";
export default function NotFound() {
  return (
    <main
      className="marketplace empty-state"
      style={{ minHeight: "100vh", borderRadius: 0 }}
    >
      <p className="eyebrow">404 · A WRONG TURN</p>
      <h1 style={{ fontSize: 36, fontWeight: 700 }}>
        Let’s get you back on the road.
      </h1>
      <p className="muted">
        This page doesn’t exist. Your next part might be just a search away.
      </p>
      <Link href="/parts" className="btn btn-primary">
        Explore the marketplace →
      </Link>
    </main>
  );
}
