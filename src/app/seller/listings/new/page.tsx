import { Suspense } from "react";
import { ListingFormPage } from "@/features/seller/listing-form";
export const metadata = { title: "New" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <ListingFormPage />
    </Suspense>
  );
}
