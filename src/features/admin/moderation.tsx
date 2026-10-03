"use client";
/* Listing photos are served by the marketplace media API. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { useMarketplace, auditEntry } from "@/providers/marketplace-provider";
import { money, type ListingStatus } from "@/types/marketplace";
import {
  PageHeading,
  Panel,
  Badge,
  EmptyState,
  Field,
} from "@/components/ui/kit";
import { PartArt } from "@/components/ui/part-art";
export function ListingModeration() {
  const { state, update, toast } = useMarketplace();
  const [filter, setFilter] = useState("Pending");
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const parts = state.parts.filter(
    (p) => filter === "All" || p.status === filter,
  );
  const current = state.parts.find((p) => p.id === selected);
  async function decide(status: ListingStatus) {
    if (!current) return;
    if (status === "Rejected" && !reason.trim()) {
      toast("Add a reason before rejecting this listing.");
      return;
    }
    const action = `${status}: ${current.title}${reason ? " — " + reason : ""}`;
    if (!(await update((s) => ({
      ...s,
      parts: s.parts.map((p) => (p.id === current.id ? { ...p, status } : p)),
      audit: [auditEntry(action), ...s.audit],
      notifications: [
        { id: crypto.randomUUID(), text: action, read: false },
        ...s.notifications,
      ],
    })))) return;
    setSelected(null);
    setReason("");
    toast("Moderation decision saved");
  }
  return (
    <>
      <PageHeading
        eyebrow="MARKETPLACE QUALITY"
        title="Listing moderation"
        description="Review details, check compatibility and make a clear approval decision."
      />
      <div className="tabs">
        {["Pending", "Published", "Rejected", "All"].map((f) => (
          <button
            className={filter === f ? "active" : ""}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {current && (
        <Panel
          title={`Review: ${current.title}`}
          action={
            <button className="text-button" onClick={() => setSelected(null)}>
              Close review
            </button>
          }
        >
          <div className="equal-columns">
            <div>
              {current.images?.[0] ? (
                <img
                  src={current.images[0]}
                  alt={current.title}
                  style={{ height: 220, width: "100%", objectFit: "contain" }}
                />
              ) : (
                <PartArt category={current.category} />
              )}
              <p className="muted" style={{ marginTop: 15 }}>
                {current.description}
              </p>
            </div>
            <div>
              <dl className="spec-grid">
                {[
                  ["Price", money(current.price)],
                  ["Condition", current.condition],
                  ["Vehicle", `${current.brand} ${current.model}`],
                  ["Years", current.year],
                  ["Location", current.city],
                  ["Seller", current.seller],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <div style={{ marginTop: 20 }}>
                <Field label="Moderation note (required for rejection)">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain any changes the seller needs to make."
                  />
                </Field>
              </div>
              <div className="button-row">
                <button
                  className="btn btn-primary"
                  onClick={() => decide("Published")}
                >
                  Approve listing
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => decide("Rejected")}
                >
                  Reject listing
                </button>
              </div>
            </div>
          </div>
        </Panel>
      )}
      <div style={{ marginTop: 22 }}>
        <Panel>
          {parts.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>LISTING</th>
                    <th>SELLER</th>
                    <th>PRICE</th>
                    <th>STATUS</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.title}</strong>
                        <small>
                          {p.brand} {p.model}
                        </small>
                      </td>
                      <td>{p.seller}</td>
                      <td>{money(p.price)}</td>
                      <td>
                        <Badge>{p.status}</Badge>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => {
                            setSelected(p.id);
                            setReason("");
                          }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="The queue is clear"
              description="New seller submissions will appear here for review."
            />
          )}
        </Panel>
      </div>
    </>
  );
}
export function UsersManagement() {
  const { state, update, toast } = useMarketplace();
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const users = state.users.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="PEOPLE OF AUTOPART HUB"
        title="Users & accounts"
        description="Review registered users and manage account standing."
      />
      <input
        className="input"
        style={{ maxWidth: 420, marginBottom: 22 }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email…"
        aria-label="Search users"
      />
      {confirm && (
        <div className="notice">
          Change this account’s status? The action will be recorded in the audit log.
          <div className="button-row">
            <button
              className="btn btn-primary btn-small"
              onClick={async () => {
                const user = state.users.find((u) => u.id === confirm)!;
                const status =
                  user.status === "Active" ? "Suspended" : "Active";
                if (!(await update((s) => ({
                  ...s,
                  users: s.users.map((u) =>
                    u.id === confirm ? { ...u, status } : u,
                  ),
                  audit: [
                    auditEntry(`${status} account: ${user.name}`),
                    ...s.audit,
                  ],
                })))) return;
                setConfirm(null);
                toast("Account status updated");
              }}
            >
              Confirm
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <Panel>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>USER</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                  </td>
                  <td>{u.role}</td>
                  <td>
                    <Badge>{u.status}</Badge>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setConfirm(u.id)}
                    >
                      {u.status === "Active" ? "Suspend" : "Restore"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!users.length && (
          <EmptyState
            title="No matching users"
            description="Try a different name or email."
          />
        )}
      </Panel>
    </>
  );
}
export function VerificationPage() {
  const { state, update, toast } = useMarketplace();
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="BUILDING A TRUSTED MARKETPLACE"
        title="Seller verification"
        description="Review seller profiles and record verification decisions."
      />
      <Panel>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SELLER</th>
                <th>LOCATION</th>
                <th>STATUS</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.verifications.map((v) => (
                <tr key={v.id}>
                  <td>
                    <strong>{v.name}</strong>
                    <small>Seller verification request</small>
                  </td>
                  <td>{v.city}</td>
                  <td>
                    <Badge>{v.status}</Badge>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setSelected(v.id);
                        setNote("");
                      }}
                    >
                      Review profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {selected && (
        <div style={{ marginTop: 22 }}>
          <Panel
            title={state.verifications.find((v) => v.id === selected)?.name}
          >
            <div className="notice">
              Reference: {state.verifications.find(v => v.id === selected)?.reference || "Not provided"}
            </div>
            <Field label="Review notes">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Record the outcome of your review."
              />
            </Field>
            <div className="button-row">
              {["Approved", "Rejected"].map((status) => (
                <button
                  className={`btn ${status === "Approved" ? "btn-primary" : "btn-danger"}`}
                  key={status}
                  onClick={async () => {
                    if (!note.trim()) {
                      toast("Please add a review note.");
                      return;
                    }
                    const name = state.verifications.find(
                      (v) => v.id === selected,
                    )?.name;
                    if (!(await update((s) => ({
                      ...s,
                      verifications: s.verifications.map((v) =>
                        v.id === selected ? { ...v, status } : v,
                      ),
                      audit: [
                        auditEntry(`${status} verification: ${name} — ${note}`),
                        ...s.audit,
                      ],
                    })))) return;
                    setSelected(null);
                    toast("Verification decision saved");
                  }}
                >
                  {status === "Approved" ? "Approve seller" : "Reject request"}
                </button>
              ))}
              <button
                className="btn btn-secondary"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
export function ReportsPage() {
  const { state, update, toast } = useMarketplace();
  const [filter, setFilter] = useState("Open");
  return (
    <>
      <PageHeading
        eyebrow="COMMUNITY SAFETY"
        title="Reports & concerns"
        description="Review reports from the community and record a resolution."
      />
      <div className="tabs">
        {["Open", "Resolved", "Dismissed", "All"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="stack">
        {state.reports
          .filter((r) => filter === "All" || r.status === filter)
          .map((r) => (
            <Panel
              key={r.id}
              title={r.subject}
              action={<Badge>{r.status}</Badge>}
            >
              <p className="muted">{r.reason}</p>
              {r.status === "Open" && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const d = new FormData(e.currentTarget);
                    const status = String(d.get("status"));
                    const note = String(d.get("note"));
                    if (!(await update((s) => ({
                      ...s,
                      reports: s.reports.map((x) =>
                        x.id === r.id ? { ...x, status } : x,
                      ),
                      audit: [
                        auditEntry(`${status} report: ${r.subject} — ${note}`),
                        ...s.audit,
                      ],
                    })))) return;
                    toast("Report resolution saved");
                  }}
                >
                  <div className="form-grid" style={{ marginTop: 20 }}>
                    <Field label="Decision">
                      <select name="status">
                        <option>Resolved</option>
                        <option>Dismissed</option>
                      </select>
                    </Field>
                    <Field label="Resolution note">
                      <input
                        name="note"
                        required
                        minLength={5}
                        placeholder="How was this report handled?"
                      />
                    </Field>
                  </div>
                  <button className="btn btn-primary btn-small">
                    Save resolution
                  </button>
                </form>
              )}
            </Panel>
          ))}
        {!state.reports.some(
          (r) => filter === "All" || r.status === filter,
        ) && (
          <EmptyState
            title="No reports in this queue"
            description="Reports from listing pages will appear here."
          />
        )}
      </div>
    </>
  );
}
export function FeaturedPage() {
  const { state, update, toast } = useMarketplace();
  return (
    <>
      <PageHeading
        eyebrow="CURATE THE MARKETPLACE"
        title="Featured listings"
        description="Choose published listings to highlight in marketplace discovery."
      />
      <Panel>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>LISTING</th>
                <th>CATEGORY</th>
                <th>FEATURED</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.parts
                .filter((p) => p.status === "Published")
                .map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td>{p.category}</td>
                    <td>
                      <input
                        aria-label={`Feature ${p.title}`}
                        type="checkbox"
                        checked={p.featured}
                        onChange={async (e) => {
                          const featured = e.target.checked;
                          if (!(await update((s) => ({
                            ...s,
                            parts: s.parts.map((x) =>
                              x.id === p.id ? { ...x, featured } : x,
                            ),
                            audit: [
                              auditEntry(
                                `${featured ? "Featured" : "Unfeatured"} listing: ${p.title}`,
                              ),
                              ...s.audit,
                            ],
                          })))) return;
                          toast("Featured selection updated");
                        }}
                      />
                    </td>
                    <td>
                      <Link href={`/parts/${p.slug}`} className="text-button">
                        Preview ↗
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
