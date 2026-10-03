import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
export const metadata = { title: "Register" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <AuthForm mode="register" />
    </Suspense>
  );
}
