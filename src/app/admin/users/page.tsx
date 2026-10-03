import { Suspense } from "react";
import { UsersManagement } from "@/features/admin/moderation";
export const metadata = { title: "Users" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <UsersManagement />
    </Suspense>
  );
}
