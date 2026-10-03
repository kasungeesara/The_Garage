import { Suspense } from "react";
import { Collection } from "@/features/account/overview";
export const metadata = { title: "Favourites" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <Collection />
    </Suspense>
  );
}
