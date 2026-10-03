import { Suspense } from "react";
import { SellerOverview } from "@/features/seller/overview";
export const metadata = { title: "Seller" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <SellerOverview />
    </Suspense>
  );
}
