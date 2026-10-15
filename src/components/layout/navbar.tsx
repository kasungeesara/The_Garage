"use client";
import Link from "next/link";
import { GarageLogo } from "@/components/layout/garage-logo";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMarketplace } from "@/providers/marketplace-provider";
import { Icon } from "@/components/ui/icons";
export function NavBar() {
  const { state } = useMarketplace();
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const links = [
    ["/parts", "Find parts"],
    ["/categories", "Categories"],
    ["/brands", "Brands"],
    ["/news", "The journal"],
    ["/seller-plans", "Seller Plans"],
  ];
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <GarageLogo preload />
        </Link>
        <nav
          className={`public-nav ${open ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={path.startsWith(href) ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link href="/sell" className="btn btn-primary sell-nav">
            <Icon name="plus" size={16} />
            Sell a part
          </Link>
          <Link
            href={state.user ? "/dashboard" : "/auth/login"}
            className="account-chip"
          >
            <span className="avatar">
              {state.user ? (
                state.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
              ) : (
                <Icon name="user" size={18} />
              )}
            </span>
            <span className="account-copy">
              <small>{state.user ? "MY ACCOUNT" : "WELCOME BACK"}</small>
              <strong>{state.user?.name || "Sign in"}</strong>
            </span>
          </Link>
          <button
            className="icon-btn mobile-toggle"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>
    </header>
  );
}
