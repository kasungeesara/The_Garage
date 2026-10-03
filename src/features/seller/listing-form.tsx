"use client";
/* Listing photos are served by the marketplace media API. */
/* eslint-disable @next/next/no-img-element */
import { api } from "@/lib/api";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMarketplace } from "@/providers/marketplace-provider";
import { type Part } from "@/types/marketplace";
import {
  PageHeading,
  Panel,
  Field,
  ButtonLink,
  EmptyState,
} from "@/components/ui/kit";
import { Icon } from "@/components/ui/icons";
type Values = {
  title: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  startYear: string;
  endYear: string;
  fuel: string;
  transmission: string;
  price: string;
  condition: string;
  city: string;
};
const blank: Values = {
  title: "",
  description: "",
  category: "Brakes",
  brand: "Toyota",
  model: "",
  startYear: "2016",
  endYear: "2023",
  fuel: "Petrol",
  transmission: "Automatic",
  price: "",
  condition: "New",
  city: "Colombo",
};
export function ListingFormPage({ id }: { id?: string }) {
  const { state, ready } = useMarketplace();
  if (!ready) return <p className="muted">Loading your listing…</p>;
  const part = state.parts.find(
    (p) => p.id === id && p.seller === state.store.slug,
  );
  if (id && !part)
    return (
      <EmptyState
        title="Listing not found"
        description="Choose a listing from your workspace."
        href="/seller/listings"
        label="My listings"
      />
    );
  return <ListingForm key={id || "new"} part={part} />;
}
function ListingForm({ part }: { part?: Part }) {
  const { state, update, toast } = useMarketplace();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(
    part
      ? {
          title: part.title,
          description: part.description,
          category: part.category,
          brand: part.brand,
          model: part.model,
          startYear: part.year.slice(0, 4),
          endYear: part.year.slice(-4),
          fuel: part.fuel,
          transmission: part.transmission,
          price: String(part.price),
          condition: part.condition,
          city: part.city,
        }
      : blank,
  );
  const [images, setImages] = useState<string[]>(part?.images || []);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const field = (
    key: keyof Values,
    label: string,
    options?: string[],
    type = "text",
  ) => (
    <Field label={label}>
      {options ? (
        <select
          value={values[key]}
          onChange={(e) => setValues({ ...values, [key]: e.target.value })}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          required
          type={type}
          min={type === "number" ? (key === "price" ? 1 : 1980) : undefined}
          max={type === "number" && key !== "price" ? 2030 : undefined}
          value={values[key]}
          onChange={(e) => setValues({ ...values, [key]: e.target.value })}
        />
      )}
    </Field>
  );
  async function upload(files: FileList | null) {
    if (!files) return;
    setError("");
    const selected = Array.from(files);
    if (images.length + selected.length > 10) {
      setError("Choose a maximum of 10 photos.");
      return;
    }
    if (
      selected.some(
        (f) =>
          !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
          f.size > 5 * 1024 * 1024,
      )
    ) {
      setError("Use JPG, PNG or WebP photos, up to 5 MB each.");
      return;
    }
    setUploading(true);
    try {
      const results = await Promise.all(
        selected.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const img = new Image();
              const url = URL.createObjectURL(file);
              img.onload = () => {
                const canvas = document.createElement("canvas");
                const ratio = Math.min(
                  1,
                  640 / Math.max(img.width, img.height),
                );
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                const context = canvas.getContext("2d");
                if (!context) {
                  URL.revokeObjectURL(url);
                  reject();
                  return;
                }
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                const result = canvas.toDataURL("image/jpeg", 0.65);
                URL.revokeObjectURL(url);
                resolve(result);
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                reject();
              };
              img.src = url;
            }),
        ),
      );
      const uploaded: string[] = [];
      for (const image of results) uploaded.push((await api<{url:string}>("media", {image})).url);
      setImages((prev) => [...prev, ...uploaded]);
    } catch {
      setError("One of these images could not be opened. Try another photo.");
    } finally {
      setUploading(false);
    }
  }
  async function save(draft: boolean) {
    if (!values.title.trim()) {
      setError("Give your listing a title before saving.");
      setStep(0);
      return;
    }
    if (
      !draft &&
      (!values.description.trim() ||
        !values.model.trim() ||
        Number(values.price) <= 0 ||
        Number(values.startYear) > Number(values.endYear))
    ) {
      setError(
        "Complete the description, model, valid price and compatible year range.",
      );
      return;
    }
    if (!draft && !images.length && !part) {
      setError("Add at least one photo before submitting.");
      setStep(2);
      return;
    }
    const id = part?.id || crypto.randomUUID();
    const item: Part = {
      id,
      slug:
        part?.slug ||
        values.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
          "-" +
          id.slice(0, 6),
      title: values.title,
      description: values.description,
      category: values.category,
      brand: values.brand,
      model: values.model,
      year: `${values.startYear}–${values.endYear}`,
      fuel: values.fuel,
      transmission: values.transmission,
      price: Number(values.price) || 0,
      condition: values.condition,
      city: values.city,
      seller: state.store.slug || "",
      status: draft ? "Draft" : "Pending",
      featured: part?.featured || false,
      views: part?.views || 0,
      images,
    };
    if (!(await update((s) => ({
      ...s,
      parts: part
        ? s.parts.map((p) => (p.id === id ? item : p))
        : [item, ...s.parts],
    })))) return;
    toast(
      draft
        ? "Draft saved. You can continue later."
        : "Listing submitted for moderation",
    );
    router.push("/seller/listings");
  }
  function next(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (step === 1 && Number(values.startYear) > Number(values.endYear)) {
      setError("End year must be the same as or after the start year.");
      return;
    }
    if (step < 3) setStep(step + 1);
    else save(false);
  }
  return (
    <>
      <PageHeading
        eyebrow="A GREAT LISTING STARTS HERE"
        title={part ? "Edit your listing" : "Give your part a next chapter."}
        description="Clear details and good photos help the right customer find you."
        action={
          <ButtonLink href="/seller/listings" secondary>
            ← My listings
          </ButtonLink>
        }
      />
      <div className="form-narrow">
        <div className="stepper">
          {[
            "01 · Basics",
            "02 · Compatibility",
            "03 · Photos",
            "04 · Review",
          ].map((s, i) => (
            <button
              key={s}
              className={step === i ? "active" : ""}
              onClick={() => {
                if (i < step) setStep(i);
              }}
              disabled={i > step}
            >
              {s}
            </button>
          ))}
        </div>
        <Panel
          title={
            [
              "Tell us about the part",
              "Make the fit clear",
              "Show it from every angle",
              "Ready for a closer look?",
            ][step]
          }
        >
          <form onSubmit={next}>
            {step === 0 && (
              <>
                <div className="form-grid">
                  <div className="full">{field("title", "Listing title")}</div>
                  {field("category", "Category", state.references.Categories)}
                  {field("condition", "Condition", [
                    "New",
                    "Used",
                    "Reconditioned",
                  ])}
                  {field("price", "Price (LKR)", undefined, "number")}
                  {field("city", "Location", state.references.Locations)}
                </div>
                <Field label="Description">
                  <textarea
                    required
                    minLength={20}
                    value={values.description}
                    onChange={(e) =>
                      setValues({ ...values, description: e.target.value })
                    }
                    placeholder="Describe the part, its condition and what is included."
                  />
                </Field>
              </>
            )}
            {step === 1 && (
              <div className="form-grid">
                {field("brand", "Vehicle brand", state.references.Brands)}
                {field("model", "Vehicle model")}
                {field("startYear", "From year", undefined, "number")}
                {field("endYear", "To year", undefined, "number")}
                {field("fuel", "Fuel type", [
                  "Petrol",
                  "Diesel",
                  "Hybrid",
                  "Electric",
                ])}
                {field("transmission", "Transmission", ["Automatic", "Manual"])}
              </div>
            )}
            {step === 2 && (
              <>
                <div className="upload-zone">
                  <Icon name="upload" size={30} />
                  <strong>
                    {uploading ? "Preparing photos…" : "Add your part photos"}
                  </strong>
                  <p className="muted">
                    JPG, PNG or WebP · Up to 5 MB each · Maximum 10
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    aria-label="Upload listing photos"
                    disabled={uploading || images.length >= 10}
                    onChange={(e) => {
                      void upload(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div className="upload-grid">
                  {images.map((src, i) => (
                    <div className="upload-tile" key={i}>
                      <img src={src} alt={`Part photo ${i + 1}`} />
                      <p>{i === 0 ? "★ Cover photo" : `Photo ${i + 1}`}</p>
                      <div className="button-row">
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setImages([
                                src,
                                ...images.filter((_, n) => n !== i),
                              ])
                            }
                          >
                            Make cover
                          </button>
                        )}
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...images];
                              [next[i - 1], next[i]] = [next[i], next[i - 1]];
                              setImages(next);
                            }}
                          >
                            Move left
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setImages(images.filter((_, n) => n !== i))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="muted" style={{ marginTop: 15 }}>
                  {images.length}/10 photos · The first photo is your cover.
                </p>
              </>
            )}
            {step === 3 && (
              <>
                <dl className="spec-grid">
                  {[
                    ["Title", values.title],
                    ["Price", `Rs. ${values.price}`],
                    ["Category", values.category],
                    ["Condition", values.condition],
                    ["Vehicle", `${values.brand} ${values.model}`],
                    ["Years", `${values.startYear}–${values.endYear}`],
                    ["Location", values.city],
                    ["Photos", String(images.length)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="muted" style={{ marginTop: 20 }}>
                  {values.description}
                </p>
                <div className="notice">
                  Your listing will enter the moderation queue and appear publicly after approval.
                </div>
                <label className="check-row">
                  <input type="checkbox" required />I confirm these details
                  accurately describe the part.
                </label>
              </>
            )}
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <div className="form-footer">
              <button
                type="button"
                className="text-button"
                onClick={() => save(true)}
                disabled={uploading}
              >
                Save draft
              </button>
              {step > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </button>
              )}
              <button className="btn btn-primary" disabled={uploading}>
                {step === 3 ? "Submit for approval" : "Continue →"}
              </button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}
