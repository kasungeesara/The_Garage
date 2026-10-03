"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMarketplace } from "@/providers/marketplace-provider";
import { PageHeading, Field, Panel, ButtonLink } from "@/components/ui/kit";
import { Icon } from "@/components/ui/icons";
export function StoreSettings({
  onboarding = false,
}: {
  onboarding?: boolean;
}) {
  const { state, update, toast, ready } = useMarketplace();
  const router = useRouter();
  const [step, setStep] = useState(0);
  if (!ready) return <div className="container section">Loading your account…</div>;
  if (!state.user) return <div className="container section"><h1>Start selling</h1><p>Sign in or create an account to set up your store.</p><ButtonLink href="/auth/login">Sign in</ButtonLink></div>;
  return (
    <div className={onboarding ? "container section" : ""}>
      <PageHeading
        eyebrow={onboarding ? "YOUR NEXT CHAPTER" : "YOUR PUBLIC IDENTITY"}
        title={onboarding ? "Let’s build your storefront." : "Store settings"}
        description={
          onboarding
            ? "From individual enthusiasts to established shops, there’s a place for your parts here."
            : "Introduce your business and give customers a reason to connect."
        }
        action={
          !onboarding ? (
            <ButtonLink href={`/sellers/${state.store.slug}`} secondary>
              View public store ↗
            </ButtonLink>
          ) : undefined
        }
      />
      <div className="equal-columns">
        <Panel title={onboarding ? "Seller profile" : "Store information"}>
          <form
            key={JSON.stringify(state.store)}
            onSubmit={async (e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              const store = {
                slug: state.store.slug,
                reference: String(d.get("reference") || state.store.reference || ""),
                name: String(d.get("name")),
                city: String(d.get("city")),
                type: String(d.get("type")),
                description: String(d.get("description")),
              };
              if (!(await update((s) => ({
                ...s,
                store,
                verifications: onboarding
                  ? [
                      {
                        id: crypto.randomUUID(),
                        name: store.name,
                        city: store.city,
                        status: "Pending",
                      },
                      ...s.verifications,
                    ]
                  : s.verifications,
              })))) return;
              toast(
                onboarding
                  ? "Seller profile created. Verification is pending."
                  : "Store details saved",
              );
              if (onboarding) router.push("/seller");
            }}
          >
            <Field label="Seller type">
              <select name="type" defaultValue={state.store.type}>
                <option>Business</option>
                <option>Individual</option>
              </select>
            </Field>
            <Field label="Store / display name">
              <input
                name="name"
                required
                defaultValue={onboarding ? "" : state.store.name}
                placeholder="e.g. Precision Auto Parts"
              />
            </Field>
            <Field label="Location">
              <select name="city" defaultValue={state.store.city}>
                {["Colombo", "Kandy", "Galle", "Gampaha", "Kurunegala"].map(
                  (c) => (
                    <option key={c}>{c}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="About your store">
              <textarea
                name="description"
                required
                minLength={20}
                defaultValue={onboarding ? "" : state.store.description}
                placeholder="Tell customers what you specialise in."
              />
            </Field>
            {onboarding && (
              <>
                <Field label="Business registration / identity reference">
                  <input name="reference" required minLength={3} maxLength={200} placeholder="Business registration or identity reference" />
                  <small>
                    Only marketplace administrators can see this reference.
                  </small>
                </Field>
                <label className="check-row">
                  <input required type="checkbox" />I agree to provide accurate
                  listings and follow the marketplace guidelines.
                </label>
              </>
            )}
            <button className="btn btn-primary">
              {onboarding ? "Create seller profile" : "Save store settings"}
              <Icon name="arrow" size={16} />
            </button>
          </form>
        </Panel>
        <div className="stack">
          <div className="welcome-banner">
            <div>
              <p className="eyebrow">A STOREFRONT THAT WORKS FOR YOU</p>
              <h2>
                Local expertise.
                <br />
                An island-wide audience.
              </h2>
              <p>
                Keep your listings organised, answer enquiries and let your
                reputation grow.
              </p>
            </div>
          </div>
          <Panel title="How selling works">
            {[
              [
                "Create your profile",
                "Tell customers who you are and where to find you.",
              ],
              [
                "List your parts",
                "Add clear photos, compatibility details and a fair price.",
              ],
              [
                "Connect and arrange",
                "Respond to enquiries and arrange the transaction directly.",
              ],
            ].map(([title, description], i) => (
              <div className="activity-item" key={title}>
                <span className="avatar">0{i + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </Panel>
          {!onboarding && (
            <Panel title="Verification">
              <p className="muted">
                Request an administrator review of your seller profile.
              </p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 15 }}
                disabled={step === 1}
                onClick={async () => {
                  if (!(await update((s) => ({
                    ...s,
                    verifications: [
                      {
                        id: crypto.randomUUID(),
                        name: s.store.name,
                        city: s.store.city,
                        status: "Pending",
                      },
                      ...s.verifications,
                    ],
                  })))) return;
                  setStep(1);
                  toast("Verification request added to the admin queue");
                }}
              >
                {step === 1 ? "Request submitted" : "Request verification"}
              </button>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
