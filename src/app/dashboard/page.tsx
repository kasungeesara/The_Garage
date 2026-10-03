import { Suspense } from "react";
import { CustomerOverview } from "@/features/account/overview";
export const metadata = { title: "Dashboard" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <CustomerOverview />
    </Suspense>
  );
}
