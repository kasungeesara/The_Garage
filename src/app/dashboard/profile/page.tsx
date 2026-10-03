import { Suspense } from "react";
import { ProfilePage } from "@/features/account/profile";
export const metadata = { title: "Profile" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <ProfilePage />
    </Suspense>
  );
}
