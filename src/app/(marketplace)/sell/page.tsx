import { Suspense } from "react";
import { StoreSettings } from "@/features/seller/store-settings";
export const metadata = { title: "Sell" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <StoreSettings onboarding />
    </Suspense>
  );
}
