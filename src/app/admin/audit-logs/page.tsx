import { Suspense } from "react";
import { AuditLogs } from "@/features/admin/content";
export const metadata = { title: "Audit Logs" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <AuditLogs />
    </Suspense>
  );
}
