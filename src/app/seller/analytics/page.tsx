import { Suspense } from "react";
import { AnalyticsPage } from "@/features/seller/overview";
export const metadata = { title: "Analytics" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <AnalyticsPage />
    </Suspense>
  );
}
