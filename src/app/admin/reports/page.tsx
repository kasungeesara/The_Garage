import { Suspense } from "react";
import { ReportsPage } from "@/features/admin/moderation";
export const metadata = { title: "Reports" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <ReportsPage />
    </Suspense>
  );
}
