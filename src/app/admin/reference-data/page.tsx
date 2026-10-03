import { Suspense } from "react";
import { ReferenceData } from "@/features/admin/content";
export const metadata = { title: "Reference Data" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <ReferenceData />
    </Suspense>
  );
}
