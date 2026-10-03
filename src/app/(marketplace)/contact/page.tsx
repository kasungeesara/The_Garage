import { Suspense } from "react";
import { InformationPage } from "@/features/marketplace/information";
export const metadata = { title: "Contact" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <InformationPage kind="contact" />
    </Suspense>
  );
}
