import { Suspense } from "react";
import { Directory } from "@/features/marketplace/catalog";
export const metadata = { title: "Brands" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <Directory kind="brands" />
    </Suspense>
  );
}
