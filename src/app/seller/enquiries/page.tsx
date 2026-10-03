import { Suspense } from "react";
import { EnquiriesPage } from "@/features/account/enquiries";
export const metadata = { title: "Enquiries" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <EnquiriesPage seller />
    </Suspense>
  );
}
