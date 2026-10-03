import { Suspense } from "react";
import { InformationPage } from "@/features/marketplace/information";
export const metadata = { title: "Faq" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <InformationPage kind="faq" />
    </Suspense>
  );
}
