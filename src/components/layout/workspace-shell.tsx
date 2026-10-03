"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icons";
import { useMarketplace } from "@/providers/marketplace-provider";
const menus = {
  customer: [
    ["/dashboard", "Overview", "grid"],
    ["/dashboard/favourites", "Saved parts", "heart"],
    ["/dashboard/recently-viewed", "Recently viewed", "clock"],
    ["/dashboard/enquiries", "Enquiries", "chat"],
    ["/dashboard/reviews", "My reviews", "star"],
    ["/dashboard/notifications", "Notifications", "bell"],
    ["/dashboard/profile", "Profile & settings", "settings"],
  ],
  seller: [
    ["/seller", "Overview", "grid"],
    ["/seller/listings", "My listings", "box"],
    ["/seller/listings/new", "Create listing", "plus"],
    ["/seller/enquiries", "Enquiries", "chat"],
    ["/seller/reviews", "Reviews", "star"],
    ["/seller/analytics", "Analytics", "chart"],
    ["/seller/settings", "Store settings", "settings"],
  ],
  admin: [
    ["/admin", "Overview", "grid"],
    ["/admin/users", "Users", "user"],
    ["/admin/verification", "Seller verification", "shield"],
    ["/admin/listings", "Listing moderation", "box"],
    ["/admin/reports", "Reports", "bell"],
    ["/admin/contact", "Support inbox", "chat"],
    ["/admin/news", "News & articles", "news"],
    ["/admin/reference-data", "Reference data", "grid"],
    ["/admin/featured", "Featured listings", "star"],
    ["/admin/analytics", "Analytics", "chart"],
    ["/admin/audit-logs", "Audit logs", "clock"],
  ],
};
export function WorkspaceShell({
  kind,
  children,
}: {
  kind: keyof typeof menus;
  children: ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { state, ready, logout } = useMarketplace();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!state.user) router.replace("/auth/login");
    else if (kind === "seller" && state.user.role === "Customer") router.replace("/sell");
  }, [ready, state.user, kind, router]);
  if (!ready || !state.user) return <div className="container section" role="status">Loading your account…</div>;
  if (kind === "admin" && state.user.role !== "Admin") return <div className="container section"><h1>Administrator access required</h1><Link href="/dashboard">Back to your account</Link></div>;
  if (kind === "seller" && state.user.role === "Customer") return <div className="container section">Opening seller registration…</div>;
  return (
    <div className={`workspace ${kind === "admin" ? "admin-workspace" : ""}`}>
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Icon name="box" />
          </span>
          <span>
            AutoPart<span className="brand-light">Hub</span>
          </span>
        </Link>
        <p className="sidebar-label">
          {kind === "admin"
            ? "CONTROL CENTER"
            : kind === "seller"
              ? "SELLER WORKSPACE"
              : "YOUR WORKSPACE"}
        </p>
        <nav aria-label={`${kind} navigation`}>
          {menus[kind].map(([href, label, icon]) => (
            <Link
              href={href}
              key={href}
              className={
                path === href ||
                (href.split("/").length > 2 &&
                  path.startsWith(href + "/") &&
                  !path.endsWith("/new"))
                  ? "selected"
                  : ""
              }
              onClick={() => setOpen(false)}
            >
              <Icon name={icon} size={19} />
              {label}
              {label === "Seller verification" && (
                <span className="nav-count">
                  {
                    state.verifications.filter((v) => v.status === "Pending")
                      .length
                  }
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="text-button" onClick={async () => {if(await logout()) router.replace("/auth/login");}}>Sign out</button>
          <Link href={kind === "customer" ? "/seller" : "/dashboard"}>
            <Icon name="arrow" size={17} />
            {kind === "customer" ? "Switch to seller" : "Customer workspace"}
          </Link>
          <Link href="/">
            <Icon name="logout" size={17} />
            Back to marketplace
          </Link>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="workspace-body">
        <header className="workspace-header">
          <button
            className="icon-btn workspace-toggle"
            aria-label="Toggle sidebar"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Icon name="menu" />
          </button>
          <div>
            <span className="workspace-breadcrumb">Workspace / </span>
            <strong>
              {kind === "admin"
                ? "Administration"
                : kind === "seller"
                  ? "Seller center"
                  : "My account"}
            </strong>
          </div>
          <div className="workspace-header-right">
            <span className="demo-pill">{state.user.role.toUpperCase()}</span>
            <Link
              href="/dashboard/notifications"
              className="icon-btn"
              aria-label="Notifications"
            >
              <Icon name="bell" />
            </Link>
            <span className="avatar">
              {kind === "admin"
                ? "AD"
                : (state.user?.name || "Account")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
            </span>
          </div>
        </header>
        <main className="workspace-content">{children}</main>
        <footer className="workspace-footer">
          AutoPart Hub ·{" "}
          {kind === "admin"
            ? "Administration"
            : "Your next journey starts with the right part."}
        </footer>
      </div>
    </div>
  );
}
