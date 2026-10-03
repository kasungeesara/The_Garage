import { WorkspaceShell } from "@/components/layout/workspace-shell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell kind="customer">{children}</WorkspaceShell>;
}
