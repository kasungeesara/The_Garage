"use client";
import Link from "next/link";
import { useState } from "react";
import { useMarketplace } from "@/providers/marketplace-provider";
import {
  PageHeading,
  Panel,
  Badge,
  EmptyState,
  ButtonLink,
} from "@/components/ui/kit";
export function EnquiriesPage({ seller = false }: { seller?: boolean }) {
  const { state } = useMarketplace();
  const [filter, setFilter] = useState("All");
  const base = seller ? "/seller" : "/dashboard";
  const items = state.enquiries.filter(
    (e) =>
      (filter === "All" || e.status === filter) &&
      (seller ? e.sellerId === state.user?.id : e.buyerId === state.user?.id),
  );
  return (
    <>
      <PageHeading
        eyebrow={
          seller ? "YOUR CUSTOMER CONNECTIONS" : "KEEP THE CONVERSATION GOING"
        }
        title="Enquiries"
        description={
          seller
            ? "Respond to questions and help customers find the right fit."
            : "Ask questions, confirm compatibility and arrange your next step."
        }
      />
      <div className="tabs">
        {["All", "New", "Read", "Replied", "Closed"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <Panel>
        {items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PART / CONVERSATION</th>
                  <th>LAST MESSAGE</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.subject}</strong>
                      <small>{e.messages.length} messages</small>
                    </td>
                    <td
                      style={{
                        maxWidth: 280,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {e.messages.at(-1)?.text}
                    </td>
                    <td>
                      <Badge>{e.status}</Badge>
                    </td>
                    <td>
                      <Link
                        className="btn btn-secondary btn-small"
                        href={`${base}/enquiries/${e.id}`}
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No conversations here"
            description="Enquiries will appear here as you connect with sellers."
            href="/parts"
          />
        )}
      </Panel>
    </>
  );
}
export function ConversationPage({
  id,
  seller = false,
}: {
  id: string;
  seller?: boolean;
}) {
  const { state, update, toast } = useMarketplace();
  const base = seller ? "/seller" : "/dashboard";
  const item = state.enquiries.find((e) => e.id === id);
  if (!item)
    return (
      <EmptyState
        title="Conversation not found"
        description="Return to your inbox to find your other enquiries."
        href={`${base}/enquiries`}
        label="Back to enquiries"
      />
    );
  const part = state.parts.find((p) => p.id === item.partId);
  return (
    <>
      <PageHeading
        eyebrow="YOUR INBOX"
        title={item.subject}
        description="Keep compatibility details and arrangements in one conversation."
        action={
          <ButtonLink href={`${base}/enquiries`} secondary>
            ← All enquiries
          </ButtonLink>
        }
      />
      <Panel
        title={
          seller ? "Conversation with customer" : "Conversation with seller"
        }
        action={
          <select
            className="input"
            style={{ width: "auto" }}
            aria-label="Enquiry status"
            value={item.status}
            onChange={async (e) => {
              if (!(await update((s) => ({
                ...s,
                enquiries: s.enquiries.map((x) =>
                  x.id === id ? { ...x, status: e.target.value } : x,
                ),
              })))) return;
              toast("Conversation status updated");
            }}
          >
            {["New", "Read", "Replied", "Closed"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        }
      >
        {part && (
          <Link className="text-button" href={`/parts/${part.slug}`}>
            View related listing ↗
          </Link>
        )}
        <div className="conversation">
          {item.messages.map((m, i) => (
            <div
              key={i}
              className={`message ${(seller ? m.from === "Seller" : m.from === "You") ? "mine" : ""}`}
            >
              {m.text}
              <small>
                {m.from} · {m.time}
              </small>
            </div>
          ))}
        </div>
        <form
          className="message-compose"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const text = String(new FormData(form).get("message") || "").trim();
            if (!text) return;
            if (!(await update((s) => ({
              ...s,
              enquiries: s.enquiries.map((x) =>
                x.id === id
                  ? {
                      ...x,
                      status: seller ? "Replied" : "New",
                      messages: [
                        ...x.messages,
                        {
                          text,
                          from: seller ? "Seller" : "You",
                          time: new Date().toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        },
                      ],
                    }
                  : x,
              ),
              notifications:
                seller && s.preferences.enquiries
                  ? [
                      {
                        id: crypto.randomUUID(),
                        text: `Seller replied about ${item.subject}.`,
                        read: false,
                      },
                      ...s.notifications,
                    ]
                  : s.notifications,
            })))) return;
            form.reset();
            toast("Reply sent");
          }}
        >
          <input
            className="input"
            name="message"
            required
            aria-label="Reply message"
            placeholder={
              item.status === "Closed"
                ? "Reopen this enquiry to reply"
                : "Write a reply…"
            }
            disabled={item.status === "Closed"}
          />
          <button
            className="btn btn-primary"
            disabled={item.status === "Closed"}
          >
            Send reply
          </button>
        </form>
      </Panel>
      <p className="muted" style={{ marginTop: 15, fontSize: 11 }}>
        Messages are visible only to you and the other participant.
      </p>
    </>
  );
}
