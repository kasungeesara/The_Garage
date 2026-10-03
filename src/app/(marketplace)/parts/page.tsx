import { Suspense } from "react";
import { Catalog } from "@/features/marketplace/catalog";
export const metadata = { title: "Parts" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <Catalog />
    </Suspense>
  );
}
