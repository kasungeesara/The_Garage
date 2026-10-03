export default function Loading() {
  return (
    <div
      className="marketplace empty-state"
      style={{ minHeight: "60vh" }}
      role="status"
    >
      <span className="avatar">AH</span>
      <p>Getting things ready…</p>
    </div>
  );
}
