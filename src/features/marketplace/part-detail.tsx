"use client";
/* Listing photos are served by the marketplace media API. */
/* eslint-disable @next/next/no-img-element */
import { api } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMarketplace, findSeller } from "@/providers/marketplace-provider";
import { money } from "@/types/marketplace";
import { PartArt } from "@/components/ui/part-art";
import { Icon } from "@/components/ui/icons";
import {
  Badge,
  Panel,
  Field,
  EmptyState,
  ButtonLink,
} from "@/components/ui/kit";
import { PartCard } from "./part-card";
export function PartDetail({ slug }: { slug: string }) {
  const { state, update, toast, ready, refresh } = useMarketplace();
  const router = useRouter();
  const [report, setReport] = useState(false);
  const [contact, setContact] = useState(false);
  const [photo, setPhoto] = useState(0);
  const part = state.parts.find((p) => p.slug === slug);
  const id = part?.id;
  useEffect(() => {
    if (!id || !ready) return;
    void api(`listings/${id}/view`, {}).then(() => refresh()).catch(() => {});
  }, [id, ready, refresh]);
  if (!part || !findSeller(state, part.seller) || !["Published", "Sold"].includes(part.status))
    return (
      <div className="container section">
        <EmptyState
          title={ready ? "This part is unavailable" : "Loading part…"}
          description="Explore other available components in the marketplace."
          href="/parts"
        />
      </div>
    );
  const seller = findSeller(state, part.seller)!;
  const saved = state.favourites.includes(part.id);
  return (
    <section className="section">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/parts">Parts</Link>
          <span>/</span>
          <span>{part.category}</span>
        </div>
        <div className="detail-grid">
          <div>
            <div className="detail-image">
              {part.images?.length ? (
                <img
                  src={part.images[photo] || part.images[0]}
                  alt={part.title}
                  style={{
                    width: "100%",
                    height: 390,
                    objectFit: "contain",
                    background: "#f0f3f5",
                  }}
                />
              ) : (
                <PartArt category={part.category} />
              )}
            </div>
            {part.images && (
              <div className="thumb-row">
                {part.images.map((src, i) => (
                  <button
                    key={i}
                    className={photo === i ? "active" : ""}
                    aria-label={`View photo ${i + 1}`}
                    onClick={() => setPhoto(i)}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
            <div className="notice">
              {part.images?.length
                ? "Seller-provided photos."
                : "Product illustration shown."}{" "}
              Confirm compatibility and condition with the seller before
              purchase.
            </div>
            <Panel title="About this part">
              <p className="muted">{part.description}</p>
              <dl className="spec-grid">
                {[
                  ["Brand", part.brand],
                  ["Model", part.model],
                  ["Compatible years", part.year],
                  ["Fuel type", part.fuel],
                  ["Transmission", part.transmission],
                  ["Condition", part.condition],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <Badge>{part.condition}</Badge>
              <Badge>{part.status}</Badge>
            </div>
            <h1>{part.title}</h1>
            <p className="muted">
              {part.brand} {part.model} · {part.year} · {part.city}
            </p>
            <p className="detail-price">{money(part.price)}</p>
            <p className="muted">
              Contact the seller to confirm availability and arrange collection.
            </p>
            <div className="button-row">
              <a className="btn btn-primary" href="#enquire">
                <Icon name="chat" size={17} />
                Enquire about this part
              </a>
              <button
                className="btn btn-secondary"
                aria-pressed={saved}
                onClick={async () => {
                  if (!(await update((s) => ({
                    ...s,
                    favourites: saved
                      ? s.favourites.filter((i) => i !== part.id)
                      : [...s.favourites, part.id],
                  })))) return;
                  toast(saved ? "Part removed from favourites" : "Part saved");
                }}
              >
                <Icon name="heart" size={17} />
                {saved ? "Saved" : "Save"}
              </button>
            </div>
            <div className="seller-mini">
              <span className="avatar">{seller.initials}</span>
              <div>
                <h3>{seller.name}</h3>
                <p>
                  {seller.verified ? "✓ Verified seller · " : ""}★{" "}
                  {seller.rating} · {seller.city}
                </p>
              </div>
              <Link
                href={`/sellers/${seller.slug}`}
                aria-label="View seller store"
              >
                <Icon name="arrow" />
              </Link>
            </div>
            <button
              className="text-button"
              style={{ marginTop: 14 }}
              onClick={() => setContact(!contact)}
            >
              {contact ? "Hide contact details" : "Show seller contact"}
            </button>
            {contact && (
              <div className="notice">
                Use the enquiry form to contact this seller. Your conversation is private.
              </div>
            )}
            <div id="enquire" style={{ marginTop: 28 }}>
              <Panel title="Ask the seller">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    const eid = crypto.randomUUID();
                    if (!(await update((s) => ({
                      ...s,
                      enquiries: [
                        {
                          id: eid,
                          partId: part.id,
                          subject: part.title,
                          status: "New",
                          messages: [
                            {
                              text: String(data.get("message")),
                              from: "You",
                              time: new Date().toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                            },
                          ],
                        },
                        ...s.enquiries,
                      ],
                    })))) return;
                    toast("Enquiry sent");
                    router.push("/dashboard/enquiries/" + eid);
                  }}
                >
                  <Field label="Your message">
                    <textarea
                      name="message"
                      required
                      minLength={10}
                      defaultValue={`Hi, is this ${part.title.toLowerCase()} still available? I would like to confirm compatibility.`}
                    />
                  </Field>
                  <button
                    className="btn btn-dark"
                    disabled={part.status === "Sold"}
                  >
                    Send enquiry
                    <Icon name="arrow" size={16} />
                  </button>
                  {part.status === "Sold" && (
                    <p className="muted">This part has been sold.</p>
                  )}
                </form>
              </Panel>
            </div>
            <div className="button-row">
              <Link className="text-button" href="/safety">
                Tips for buying safely
              </Link>
              <button
                className="text-button"
                onClick={() => setReport(!report)}
              >
                Report this listing
              </button>
            </div>
            {report && (
              <form
                className="panel"
                style={{ marginTop: 18 }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const reason = String(
                    new FormData(e.currentTarget).get("reason"),
                  );
                  if (!(await update((s) => ({
                    ...s,
                    reports: [
                      {
                        id: crypto.randomUUID(),
                        subject: part.title,
                        partId: part.id,
                        reason,
                        status: "Open",
                      },
                      ...s.reports,
                    ],
                  })))) return;
                  setReport(false);
                  toast("Report submitted");
                }}
              >
                <Field label="Reason for reporting">
                  <select name="reason">
                    <option>Incorrect or misleading information</option>
                    <option>Suspected counterfeit part</option>
                    <option>Inappropriate content</option>
                    <option>Duplicate listing</option>
                  </select>
                </Field>
                <button className="btn btn-secondary">Submit report</button>
              </form>
            )}
          </div>
        </div>
        <div className="section">
          <div className="section-heading">
            <h2>More parts to explore</h2>
            <ButtonLink href="/parts" secondary>
              Browse all
            </ButtonLink>
          </div>
          <div className="parts-grid">
            {state.parts
              .filter((p) => p.status === "Published" && p.id !== part.id)
              .slice(0, 3)
              .map((p) => (
                <PartCard part={p} key={p.id} />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export function SellerStore({ slug }: { slug: string }) {
  const { state } = useMarketplace();
  const seller = findSeller(state, slug);
  if (!seller)
    return (
      <div className="container section">
        <EmptyState
          title="Store not found"
          description="Find more sellers through the marketplace."
          href="/parts"
        />
      </div>
    );
  const own = slug === state.store.slug;
  return (
    <>
      <header className="store-hero">
        <div className="container store-heading">
          <span className="avatar">{seller.initials}</span>
          <div>
            {seller.verified && <Badge>Verified</Badge>}
            <h1>{own ? state.store.name : seller.name}</h1>
            <p>
              {own ? state.store.city : seller.city} · Member since{" "}
              {seller.since} · ★ {seller.rating}
            </p>
            <p style={{ marginTop: 15, maxWidth: 660 }}>
              {own ? state.store.description : seller.description}
            </p>
          </div>
        </div>
      </header>
      <div className="container section">
        <div className="section-heading">
          <h2>From this seller</h2>
          <a href="#seller-reviews" className="text-button">
            Read reviews ↓
          </a>
        </div>
        <div className="parts-grid four">
          {state.parts
            .filter((p) => p.seller === slug && p.status === "Published")
            .map((p) => (
              <PartCard part={p} key={p.id} />
            ))}
        </div>
        <div id="seller-reviews" className="section">
          <Panel title="What customers are saying">
            {state.reviews.filter((r) => r.seller === slug).length ? (
              state.reviews
                .filter((r) => r.seller === slug)
                .map((r) => (
                  <div className="review-card" key={r.id}>
                    <strong>{r.name}</strong>
                    <div className="review-stars">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </div>
                    <p>{r.text}</p>
                    {r.reply && (
                      <div className="review-reply">
                        <strong>Seller response</strong>
                        <p>{r.reply}</p>
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <p className="muted">No reviews yet.</p>
            )}
            <div className="button-row">
              <ButtonLink href="/dashboard/reviews" secondary>
                Write a review
              </ButtonLink>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
