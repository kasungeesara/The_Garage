"use client";
import Link from "next/link";
import { useState } from "react";
import { useMarketplace } from "@/providers/marketplace-provider";
import { type ListingStatus, money } from "@/types/marketplace";
import {
  PageHeading,
  Panel,
  ButtonLink,
  Badge,
  EmptyState,
} from "@/components/ui/kit";
export function ListingsPage() {
  const { state, update, toast } = useMarketplace();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const parts = state.parts.filter(
    (p) =>
      p.seller === state.store.slug &&
      (filter === "All" || p.status === filter) &&
      p.title.toLowerCase().includes(query.toLowerCase()),
  );
  const status = async (id: string, value: ListingStatus) => {
    if (!(await update((s) => ({
      ...s,
      parts: s.parts.map((p) => (p.id === id ? { ...p, status: value } : p)),
    })))) return;
    toast(`Listing moved to ${value.toLowerCase()}`);
  };
  return (
    <>
      <PageHeading
        eyebrow="YOUR STOCK, YOUR STOREFRONT"
        title="My listings"
        description="Manage your parts from the first draft to their next journey."
        action={
          <ButtonLink href="/seller/listings/new">+ Create listing</ButtonLink>
        }
      />
      <div className="tabs">
        {[
          "All",
          "Published",
          "Pending",
          "Draft",
          "Paused",
          "Sold",
          "Archived",
          "Rejected",
        ].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <input
        className="input"
        style={{ maxWidth: 380, marginBottom: 20 }}
        placeholder="Search your listings…"
        aria-label="Search your listings"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {deleting && (
        <div className="notice">
          Delete this listing? This removes it from the
          marketplace and saved collections.
          <div className="button-row">
            <button
              className="btn btn-danger btn-small"
              onClick={async () => {
                if (!(await update((s) => ({
                  ...s,
                  parts: s.parts.filter((p) => p.id !== deleting),
                  favourites: s.favourites.filter((id) => id !== deleting),
                  recent: s.recent.filter((id) => id !== deleting),
                })))) return;
                setDeleting(null);
                toast("Listing deleted");
              }}
            >
              Delete listing
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <Panel>
        {parts.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>LISTING</th>
                  <th>PRICE</th>
                  <th>STATUS</th>
                  <th>VIEWS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.title}</strong>
                      <small>
                        {p.brand} {p.model} · {p.city}
                      </small>
                    </td>
                    <td>{money(p.price)}</td>
                    <td>
                      <Badge>{p.status}</Badge>
                    </td>
                    <td>{p.views}</td>
                    <td>
                      <div className="table-actions">
                        <Link
                          className="btn btn-secondary btn-small"
                          href={`/seller/listings/${p.id}/edit`}
                        >
                          Edit
                        </Link>
                        <select
                          className="input"
                          aria-label={`Change status of ${p.title}`}
                          value=""
                          onChange={(e) => {
                            if (e.target.value === "delete") setDeleting(p.id);
                            else if (e.target.value)
                              status(p.id, e.target.value as ListingStatus);
                          }}
                        >
                          <option value="">Actions</option>
                          {p.status === "Published" && (
                            <>
                              <option value="Paused">Pause</option>
                              <option value="Sold">Mark sold</option>
                            </>
                          )}
                          {p.status === "Paused" && (
                            <option value="Published">Resume</option>
                          )}
                          {["Draft", "Rejected", "Archived", "Sold"].includes(
                            p.status,
                          ) && <option value="Pending">Submit / renew</option>}
                          {p.status !== "Archived" && (
                            <option value="Archived">Archive</option>
                          )}
                          <option value="delete">Delete</option>
                        </select>
                        {p.status === "Published" && (
                          <Link
                            href={`/parts/${p.slug}`}
                            className="text-button"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No listings here yet"
            description="Create a listing or try a different filter."
            href="/seller/listings/new"
            label="Create listing"
          />
        )}
      </Panel>
    </>
  );
}
