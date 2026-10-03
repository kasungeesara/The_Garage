"use client";
import Link from "next/link";
import { useMarketplace } from "@/providers/marketplace-provider";
import {
  PageHeading,
  Stat,
  Panel,
  ButtonLink,
  Badge,
} from "@/components/ui/kit";
import { Icon } from "@/components/ui/icons";
import { BarChart } from "@/features/seller/overview";
export function AdminOverview() {
  const { state } = useMarketplace();
  return (
    <>
      <PageHeading
        eyebrow="MARKETPLACE OPERATIONS"
        title="A clear view. Better decisions."
        description="Monitor activity, review submissions and keep the marketplace moving."
        action={
          <ButtonLink href="/admin/listings">
            Review listings
            <Icon name="arrow" size={16} />
          </ButtonLink>
        }
      />
      <div className="stats-grid">
        <Stat
          label="Marketplace users"
          value={state.users.length}
          detail="Registered accounts"
          icon="user"
        />
        <Stat
          label="Published listings"
          value={state.parts.filter((p) => p.status === "Published").length}
          detail="Currently visible to buyers"
          icon="box"
        />
        <Stat
          label="Pending reviews"
          value={
            state.parts.filter((p) => p.status === "Pending").length +
            state.verifications.filter((v) => v.status === "Pending").length
          }
          detail="Listings and seller applications"
          icon="shield"
        />
        <Stat
          label="Open reports"
          value={state.reports.filter((r) => r.status === "Open").length}
          detail="Awaiting moderator review"
          icon="bell"
        />
      </div>
      <div className="two-columns">
        <Panel
          title="Marketplace activity"
          action={<Link href="/admin/analytics">View analytics →</Link>}
        >
          <p className="muted">
            Listing views · Last 7 days
          </p>
          <BarChart />
        </Panel>
        <Panel title="Needs your attention">
          {[
            [
              "/admin/listings",
              "Listing submissions",
              state.parts.filter((p) => p.status === "Pending").length,
              "box",
            ],
            [
              "/admin/verification",
              "Seller verification",
              state.verifications.filter((v) => v.status === "Pending").length,
              "shield",
            ],
            [
              "/admin/reports",
              "Open reports",
              state.reports.filter((r) => r.status === "Open").length,
              "bell",
            ],
          ].map(([href, label, count, icon]) => (
            <Link
              href={String(href)}
              key={String(href)}
              className="activity-item"
            >
              <span className="activity-icon">
                <Icon name={String(icon)} />
              </span>
              <div>
                <strong>{label}</strong>
                <p>{count} items waiting for a decision</p>
              </div>
              <Icon name="arrow" size={16} />
            </Link>
          ))}
        </Panel>
      </div>
      <div className="equal-columns">
        <Panel
          title="Recent listings"
          action={<Link href="/admin/listings">View queue →</Link>}
        >
          {state.parts.slice(0, 4).map((p) => (
            <div key={p.id} className="activity-item">
              <span className="activity-icon">
                <Icon name="box" />
              </span>
              <div>
                <strong>{p.title}</strong>
                <p>
                  {p.brand} {p.model} · {p.city}
                </p>
              </div>
              <Badge>{p.status}</Badge>
            </div>
          ))}
        </Panel>
        <Panel
          title="Recent admin activity"
          action={<Link href="/admin/audit-logs">Audit logs →</Link>}
        >
          {state.audit.slice(0, 5).map((a) => (
            <div className="activity-item" key={a.id}>
              <span className="activity-icon">
                <Icon name="clock" />
              </span>
              <div>
                <strong>{a.action}</strong>
                <p>{a.time}</p>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
