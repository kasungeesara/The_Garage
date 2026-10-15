"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMarketplace } from "@/providers/marketplace-provider";
import { PageHeading, Field, Panel, ButtonLink } from "@/components/ui/kit";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/icons";
export function StoreSettings({
  onboarding = false,
}: {
  onboarding?: boolean;
}) {
  const { state, update, toast, ready } = useMarketplace();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
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
            <ButtonLink href={state.sellers.find(s=>s.slug===state.store.slug)?.shop_active ? `/sellers/${state.store.slug}` : '/seller-plans'} secondary>
              {state.sellers.find(s=>s.slug===state.store.slug)?.shop_active ? 'View public store ↗' : 'Explore Shop Plan ↗'}
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
                phone: String(d.get("phone") || ""),
                whatsapp: String(d.get("whatsapp") || ""),
                logo: String(d.get("logo") || ""),
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
            <Field label="Phone"><input name="phone" type="tel" required defaultValue={state.store.phone || state.user.phone} maxLength={25} /></Field>
            <Field label="WhatsApp number (include country code)"><input name="whatsapp" type="tel" required defaultValue={state.store.whatsapp || state.user.phone.replace(/^0/, "94")} placeholder="94771234567" maxLength={25} /></Field>
            <Field label="Shop logo"><input name="logo" type="hidden" defaultValue={state.store.logo || ""} /><input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e => {
              const file=e.target.files?.[0]; const form=e.currentTarget.form; if(!file || !form)return;
              if(file.size>5*1024*1024){toast("Maximum logo size is 5 MB");return;}
              setUploading(true);const reader=new FileReader();reader.onerror=()=>{setUploading(false);toast("Unable to read logo");};reader.onload=async()=>{try{const result=await api<{url:string}>("media",{image:reader.result});(form.elements.namedItem("logo") as HTMLInputElement).value=result.url;toast("Logo uploaded. Save your settings to apply it.");}catch(error){toast(error instanceof Error?error.message:"Logo upload failed");}finally{setUploading(false);}};reader.readAsDataURL(file);
            }} /><small>JPG, PNG or WebP, up to 5 MB. Preserved when your plan expires.</small></Field>
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
            <button className="btn btn-primary" disabled={uploading}>
              {uploading ? "Uploading logo…" : onboarding ? "Create seller profile" : "Save store settings"}
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
