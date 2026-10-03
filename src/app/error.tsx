"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="marketplace empty-state" style={{ minHeight: "70vh" }}>
      <h1>Something interrupted your journey.</h1>
      <p className="muted">Try loading this page again.</p>
      <button className="btn btn-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
