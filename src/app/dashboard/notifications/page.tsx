import { Suspense } from "react";
import { NotificationsPage } from "@/features/account/profile";
export const metadata = { title: "Notifications" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <NotificationsPage />
    </Suspense>
  );
}
