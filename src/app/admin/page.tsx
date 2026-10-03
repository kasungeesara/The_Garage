import { Suspense } from "react";
import { AdminOverview } from "@/features/admin/overview";
export const metadata = { title: "Admin" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <AdminOverview />
    </Suspense>
  );
}
