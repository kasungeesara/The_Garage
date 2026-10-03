import { Suspense } from "react";
import { ArticleEditor } from "@/features/admin/content";
export const metadata = { title: "New" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section muted">Loading your workspace…</div>
      }
    >
      <ArticleEditor />
    </Suspense>
  );
}
