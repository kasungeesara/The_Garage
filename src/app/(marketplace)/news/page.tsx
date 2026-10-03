import { Suspense } from "react";
import { NewsIndex } from "@/features/marketplace/news";
export const metadata = { title: "News" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <NewsIndex />
    </Suspense>
  );
}
