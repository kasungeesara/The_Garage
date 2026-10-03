import { Suspense } from "react";
import { ReviewsPage } from "@/features/account/reviews";
export const metadata = { title: "Reviews" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <ReviewsPage />
    </Suspense>
  );
}
