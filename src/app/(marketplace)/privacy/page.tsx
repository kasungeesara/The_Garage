import { Suspense } from "react";
import { InformationPage } from "@/features/marketplace/information";
export const metadata = { title: "Privacy" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <InformationPage kind="privacy" />
    </Suspense>
  );
}
