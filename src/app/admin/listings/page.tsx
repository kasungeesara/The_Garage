import { Suspense } from "react";
import { ListingModeration } from "@/features/admin/moderation";
export const metadata = { title: "Listings" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <ListingModeration />
    </Suspense>
  );
}
