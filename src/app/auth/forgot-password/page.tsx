import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
export const metadata = { title: "Forgot Password" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <AuthForm mode="forgot-password" />
    </Suspense>
  );
}
