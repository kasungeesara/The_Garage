"use client";
import { useMarketplace, findSeller } from "@/providers/marketplace-provider";

import { PageHeading, Panel, Field } from "@/components/ui/kit";
export function ReviewsPage({ seller = false }: { seller?: boolean }) {
  const { state, update, toast } = useMarketplace();
  const eligibleSellers = state.sellers.filter(
    (s) =>
      findSeller(state, s.slug)?.verified &&
      state.enquiries.some(
        (e) =>
          ["Replied", "Closed"].includes(e.status) &&
          state.parts.some((p) => p.id === e.partId && p.seller === s.slug),
      ),
  );
  const reviews = seller
    ? state.reviews.filter((r) => r.seller === state.store.slug)
    : state.reviews.filter(
        (r) => r.authorId === state.user?.id,
      );
  return (
    <>
      <PageHeading
        eyebrow={seller ? "TRUST, EARNED EVERY DAY" : "SHARE YOUR EXPERIENCE"}
        title={seller ? "Customer reviews" : "Your reviews"}
        description={
          seller
            ? "See what customers are saying and respond with care."
            : "Help others by sharing a clear, honest account of your experience."
        }
      />
      <div className="equal-columns">
        <Panel title={seller ? "Recent feedback" : "Your published reviews"}>
          {reviews.length ? (
            reviews.map((r) => (
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
                {seller && (
                  <form
                    style={{ marginTop: 15 }}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const reply = String(
                        new FormData(e.currentTarget).get("reply"),
                      );
                      if (!(await update((s) => ({
                        ...s,
                        reviews: s.reviews.map((x) =>
                          x.id === r.id ? { ...x, reply } : x,
                        ),
                      })))) return;
                      toast("Review response saved");
                    }}
                  >
                    <Field
                      label={
                        r.reply
                          ? "Edit your response"
                          : "Respond to this review"
                      }
                    >
                      <textarea
                        name="reply"
                        required
                        defaultValue={r.reply}
                        minLength={5}
                      />
                    </Field>
                    <button className="btn btn-secondary btn-small">
                      Save response
                    </button>
                  </form>
                )}
              </div>
            ))
          ) : (
            <p className="muted">You haven’t written a review yet.</p>
          )}
        </Panel>
        {seller ? (
          <Panel title="Your reputation">
            <div className="rating-summary">
              <strong>
                {reviews.length
                  ? (
                      reviews.reduce((sum, r) => sum + r.rating, 0) /
                      reviews.length
                    ).toFixed(1)
                  : "—"}
              </strong>
              <div>
                <div className="review-stars">★★★★★</div>
                <p className="muted">
                  Based on {reviews.length} reviews
                </p>
              </div>
            </div>
            <p className="muted">
              Useful replies address the customer’s experience, provide context
              and keep personal details private.
            </p>
          </Panel>
        ) : (
          <Panel title="Write a seller review">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const d = new FormData(form);
                if (!(await update((s) => ({
                  ...s,
                  reviews: [
                    {
                      id: crypto.randomUUID(),
                      seller: String(d.get("seller")),
                      name: s.user?.name || "Account",
                      rating: Number(d.get("rating")),
                      text: String(d.get("text")),
                      reply: "",
                    },
                    ...s.reviews,
                  ],
                })))) return;
                form.reset();
                toast("Your review was published");
              }}
            >
              <Field label="Seller">
                <select name="seller">
                  {eligibleSellers.map((s) => (
                    <option value={s.slug} key={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Your rating">
                <select name="rating">
                  <option value="5">5 — Excellent</option>
                  <option value="4">4 — Good</option>
                  <option value="3">3 — Okay</option>
                  <option value="2">2 — Disappointing</option>
                  <option value="1">1 — Poor</option>
                </select>
              </Field>
              <Field label="Your experience">
                <textarea
                  name="text"
                  required
                  minLength={15}
                  placeholder="What went well? What could be better?"
                />
              </Field>
              <label className="check-row">
                <input type="checkbox" required />I confirm this describes my
                experience with this seller.
              </label>
              <button
                className="btn btn-primary"
                disabled={!eligibleSellers.length}
              >
                Publish review
              </button>
              <p className="muted" style={{ fontSize: 11, marginTop: 15 }}>
                You can review verified sellers after a replied or closed
                enquiry with a seller reply.
              </p>
            </form>
          </Panel>
        )}
      </div>
    </>
  );
}
