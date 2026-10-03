import { Suspense } from "react";
import { FeaturedPage } from "@/features/admin/moderation";
export const metadata = { title: "Featured" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <FeaturedPage />
    </Suspense>
  );
}
