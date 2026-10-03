import { Suspense } from "react";
import { AdminNews } from "@/features/admin/content";
export const metadata = { title: "News" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <AdminNews />
    </Suspense>
  );
}
