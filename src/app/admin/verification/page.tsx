import { Suspense } from "react";
import { VerificationPage } from "@/features/admin/moderation";
export const metadata = { title: "Verification" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <VerificationPage />
    </Suspense>
  );
}
