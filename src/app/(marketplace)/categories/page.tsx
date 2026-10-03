import { Suspense } from "react";
import { Directory } from "@/features/marketplace/catalog";
export const metadata = { title: "Categories" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <Directory kind="categories" />
    </Suspense>
  );
}
