import { Suspense } from "react";
import { ListingsPage } from "@/features/seller/listings";
export const metadata = { title: "Listings" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <ListingsPage />
    </Suspense>
  );
}
