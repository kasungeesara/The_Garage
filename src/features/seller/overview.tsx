"use client";
import Link from "next/link";
import { useState } from "react";
import { useMarketplace } from "@/providers/marketplace-provider";
import { money } from "@/types/marketplace";
import {
  PageHeading,
  Stat,
  Panel,
  ButtonLink,
  Badge,
} from "@/components/ui/kit";
import { Icon } from "@/components/ui/icons";
export function SellerOverview() {
  const { state } = useMarketplace();
  const parts = state.parts.filter((p) => p.seller === state.store.slug);
  return (
    <>
      <PageHeading
        eyebrow="YOUR BUSINESS, IN MOTION"
        title="Let’s keep things moving."
        description="A clear view of your listings, customers and what comes next."
        action={
          <ButtonLink href="/seller/listings/new">
            <Icon name="plus" size={16} />
            Create listing
          </ButtonLink>
        }
      />
      <div className="stats-grid">
        <Stat
          label="Active listings"
          value={parts.filter((p) => p.status === "Published").length}
          detail="Visible in the marketplace"
          icon="box"
        />
        <Stat
          label="Listing views"
          value={parts.reduce((n, p) => n + p.views, 0).toLocaleString()}
          detail="Recorded listing views"
        />
        <Stat
          label="Customer enquiries"
          value={state.enquiries.length}
          detail="Your next opportunity"
          icon="chat"
        />
        <Stat
          label="Awaiting approval"
          value={parts.filter((p) => p.status === "Pending").length}
          detail="In the moderation queue"
          icon="clock"
        />
      </div>
      <div className="two-columns">
        <Panel
          title="Your storefront at a glance"
          action={<Link href="/seller/analytics">View analytics →</Link>}
        >
          <p className="muted">Listing views · Last 7 days</p>
          <BarChart />
        </Panel>
        <Panel title="Make your next move">
          <div className="activity-item">
            <span className="activity-icon">
              <Icon name="box" />
            </span>
            <div>
              <strong>Give your parts their best chance</strong>
              <p>
                Clear photos and accurate compatibility make a better listing.
              </p>
              <Link className="text-button" href="/seller/listings/new">
                Create a listing →
              </Link>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-icon">
              <Icon name="chat" />
            </span>
            <div>
              <strong>A quick reply goes a long way</strong>
              <p>
                {state.enquiries.filter((e) => e.status === "New").length} new
                enquiries are waiting.
              </p>
              <Link className="text-button" href="/seller/enquiries">
                Open your inbox →
              </Link>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-icon">
              <Icon name="user" />
            </span>
            <div>
              <strong>Show customers who you are</strong>
              <p>Keep your store details up to date.</p>
              <Link className="text-button" href="/seller/settings">
                Edit storefront →
              </Link>
            </div>
          </div>
        </Panel>
      </div>
      <Panel
        title="Your latest listings"
        action={<Link href="/seller/listings">Manage all →</Link>}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>LISTING</th>
                <th>PRICE</th>
                <th>VIEWS</th>
                <th>STATUS</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {parts.slice(0, 5).map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.title}</strong>
                    <small>
                      {p.brand} {p.model}
                    </small>
                  </td>
                  <td>{money(p.price)}</td>
                  <td>{p.views}</td>
                  <td>
                    <Badge>{p.status}</Badge>
                  </td>
                  <td>
                    <Link
                      className="text-button"
                      href={`/seller/listings/${p.id}/edit`}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
export function BarChart({ period = "week" }: { period?: string }) {
  const {state} = useMarketplace();
  const days = period === "month" ? 30 : 7;
  const dates = Array.from({length:days},(_,i)=>{const d=new Date();d.setUTCDate(d.getUTCDate()-days+1+i);return d.toISOString().slice(0,10);});
  const values = dates.map(day=>state.analytics.find(row=>row.day===day)?.views ?? 0);
  const labels = dates.map(day=>day.slice(5));
  return (
    <div
      className="chart"
      role="img"
      aria-label={`Listing views: ${labels.map((l, i) => `${l} ${values[i]}`).join(", ")}`}
    >
      {values.map((v, i) => (
        <div className="chart-column" key={i}>
          <span>{v}</span>
          <div
            className="chart-bar"
            style={{ height: `${(v / Math.max(1, ...values)) * 78}%` }}
          />
          <small>{labels[i]}</small>
        </div>
      ))}
    </div>
  );
}
export function AnalyticsPage({ admin = false }: { admin?: boolean }) {
  const { state } = useMarketplace();
  const [period, setPeriod] = useState("week");
  const parts = admin
    ? state.parts
    : state.parts.filter((p) => p.seller === state.store.slug);
  return (
    <>
      <PageHeading
        eyebrow="TURN ACTIVITY INTO INSIGHT"
        title={admin ? "Marketplace analytics" : "Your performance"}
        description="Understand what people are exploring with recorded listing activity."
        action={
          <select
            className="input"
            style={{ width: "auto" }}
            aria-label="Analytics period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        }
      />
      <div className="stats-grid">
        <Stat
          label="Total listing views"
          value={parts.reduce((sum, p) => sum + p.views, 0)}
          detail="Recorded listing views"
        />
        <Stat
          label="Listings"
          value={parts.length}
          detail="Across all statuses"
          icon="box"
        />
        <Stat
          label="Enquiries"
          value={state.enquiries.length}
          detail="Your conversations"
          icon="chat"
        />
        <Stat
          label="Saved parts"
          value={state.favourites.length}
          detail="Saved in your account"
          icon="heart"
        />
      </div>
      <div className="two-columns">
        <Panel title="Views over time">
          <BarChart period={period} />
        </Panel>
        <Panel title="Popular categories">
          {["Brakes", "Engine", "Lighting", "Suspension"].map((c) => (
            <div key={c}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <span>{c}</span>
                <span>
                  {parts.filter((p) => p.category === c).length} listings
                </span>
              </div>
              <div className="progress-track">
                <span
                  style={{
                    width: `${(parts.filter((p) => p.category === c).length / Math.max(parts.length, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </Panel>
      </div>
      <Panel title="Listing performance">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>LISTING</th>
                <th>VIEWS</th>
                <th>ENQUIRIES</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {[...parts]
                .sort((a, b) => b.views - a.views)
                .map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td>{p.views}</td>
                    <td>
                      {state.enquiries.filter((e) => e.partId === p.id).length}
                    </td>
                    <td>
                      <Badge>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
