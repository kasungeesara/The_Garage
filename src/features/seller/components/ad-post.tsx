"use client";

import { ChangeEvent, FormEvent, useState } from "react";

type AdType = "vehicle" | "spare";

type AdForm = {
  title: string;
  description: string;
  price: string;
  location: string;
  contactName: string;
  contactPhone: string;

  // Vehicle
  make: string;
  model: string;
  year: string;
  mileage: string;
  fuelType: string;
  transmission: string;

  // Spare
  partName: string;
  partNumber: string;
  compatibleWith: string;
  partCondition: string;
};

const INITIAL_FORM: AdForm = {
  title: "",
  description: "",
  price: "",
  location: "",
  contactName: "",
  contactPhone: "",
  make: "",
  model: "",
  year: "",
  mileage: "",
  fuelType: "",
  transmission: "",
  partName: "",
  partNumber: "",
  compatibleWith: "",
  partCondition: "",
};

const MAX_IMAGES = 6;

const inputClass =
  "w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2";
const labelClass = "mb-1.5 block text-sm font-medium";
const cardClass = "rounded-xl border p-5 shadow-sm";

export default function AdPost() {
  const [adType, setAdType] = useState<AdType>("vehicle");
  const [form, setForm] = useState<AdForm>(INITIAL_FORM);
  const [images, setImages] = useState<File[]>([]);

  const onImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    setImages((prev) => [...prev, ...selected].slice(0, MAX_IMAGES));
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: connect to API / server action
    console.log({ adType, ...form, images });
  };

  const setField = (key: keyof AdForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <section
      className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8"
      style={{
        color: "var(--text-color, #061B2D)",
      }}
    >
      <div
        className="mb-6 rounded-2xl p-6"
        style={{
          background:
            "linear-gradient(135deg, var(--primary-color, #061B2D), var(--secondary-color, #F36A20))",
          color: "var(--on-primary-color, #ffffff)",
        }}
      >
        <h1 className="text-2xl font-bold sm:text-3xl">Post an Ad</h1>
        <p className="mt-2 text-sm opacity-90">
          Create a professional listing for a vehicle or spare part.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div
          className={cardClass}
          style={{
            borderColor: "var(--border-color, #e2e8f0)",
            background: "var(--surface-color, #ffffff)",
          }}
        >
          <p className="mb-3 text-sm font-semibold">Ad Type</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdType("vehicle")}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition"
              style={{
                background:
                  adType === "vehicle"
                    ? "var(--primary-color, #F36A20)"
                    : "var(--muted-color, #f1f5f9)",
                color: adType === "vehicle" ? "#fff" : "var(--text-color, #061B2D)",
              }}
            >
              Vehicle
            </button>
            <button
              type="button"
              onClick={() => setAdType("spare")}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition"
              style={{
                background:
                  adType === "spare"
                    ? "var(--primary-color, #F36A20)"
                    : "var(--muted-color, #f1f5f9)",
                color: adType === "spare" ? "#fff" : "var(--text-color, #061B2D)",
              }}
            >
              Spare Parts
            </button>
          </div>
        </div>

        <div
          className={cardClass}
          style={{
            borderColor: "var(--border-color, #e2e8f0)",
            background: "var(--surface-color, #ffffff)",
          }}
        >
          <h2 className="mb-4 text-lg font-semibold">Ad Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Ad Title</label>
              <input
                className={inputClass}
                style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                placeholder={adType === "vehicle" ? "e.g., Toyota Axio 2018 for Sale" : "e.g., Genuine Brake Pads - Honda Fit"}
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                className={`${inputClass} min-h-[120px]`}
                style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                placeholder="Provide key details, condition, and any highlights..."
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div
          className={cardClass}
          style={{
            borderColor: "var(--border-color, #e2e8f0)",
            background: "var(--surface-color, #ffffff)",
          }}
        >
          <h2 className="mb-4 text-lg font-semibold">
            {adType === "vehicle" ? "Vehicle Specifications" : "Part Specifications"}
          </h2>

          {adType === "vehicle" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelClass}>Make</label>
                <input
                  className={inputClass}
                  style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                  value={form.make}
                  onChange={(e) => setField("make", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Model</label>
                <input
                  className={inputClass}
                  style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                  value={form.model}
                  onChange={(e) => setField("model", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Year</label>
                <input
                  type="number"
                  min={1950}
                  max={2100}
                  className={inputClass}
                  style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                  value={form.year}
                  onChange={(e) => setField("year", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Mileage (km)</label>
                <input
                  type="number"
                  className={inputClass}
                  style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                  value={form.mileage}
                  onChange={(e) => setField("mileage", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Fuel Type</label>
                <select
                  className={inputClass}
                  style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                  value={form.fuelType}
                  onChange={(e) => setField("fuelType", e.target.value)}
                >
                  <option value="">Select fuel type</option>
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Hybrid</option>
                  <option>Electric</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Transmission</label>
                <select
                  className={inputClass}
                  style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                  value={form.transmission}
                  onChange={(e) => setField("transmission", e.target.value)}
                >
                  <option value="">Select transmission</option>
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Part Name</label>
                <input
                  className={inputClass}
                  style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                  value={form.partName}
                  onChange={(e) => setField("partName", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Part Number</label>
                <input
                  className={inputClass}
                  style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                  value={form.partNumber}
                  onChange={(e) => setField("partNumber", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Compatible With</label>
                <input
                  className={inputClass}
                  style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                  placeholder="e.g., Toyota Corolla 2015-2018"
                  value={form.compatibleWith}
                  onChange={(e) => setField("compatibleWith", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Condition</label>
                <select
                  className={inputClass}
                  style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                  value={form.partCondition}
                  onChange={(e) => setField("partCondition", e.target.value)}
                >
                  <option value="">Select condition</option>
                  <option>Brand New</option>
                  <option>Used - Excellent</option>
                  <option>Used - Good</option>
                  <option>Refurbished</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div
          className={cardClass}
          style={{
            borderColor: "var(--border-color, #e2e8f0)",
            background: "var(--surface-color, #ffffff)",
          }}
        >
          <h2 className="mb-4 text-lg font-semibold">Price, Location & Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Price (LKR)</label>
              <input
                type="number"
                className={inputClass}
                style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                className={inputClass}
                style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Contact Name</label>
              <input
                className={inputClass}
                style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                value={form.contactName}
                onChange={(e) => setField("contactName", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Contact Phone</label>
              <input
                className={inputClass}
                style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                value={form.contactPhone}
                onChange={(e) => setField("contactPhone", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div
          className={cardClass}
          style={{
            borderColor: "var(--border-color, #e2e8f0)",
            background: "var(--surface-color, #ffffff)",
          }}
        >
          <h2 className="mb-4 text-lg font-semibold">Photos</h2>
          <div className="space-y-3">
            <label className={labelClass}>
              Upload up to {MAX_IMAGES} images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onImagesChange}
              disabled={images.length >= MAX_IMAGES}
              className={inputClass}
              style={{ borderColor: "var(--border-color, #e2e8f0)" }}
            />
            <p className="text-xs" style={{ color: "var(--muted-text-color, #64748b)" }}>
              {images.length}/{MAX_IMAGES} selected
            </p>

            {!!images.length && (
              <ul className="space-y-2">
                {images.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                  >
                    <span className="truncate pr-3">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-xs font-semibold"
                      style={{ color: "var(--primary-color, #F36A20)" }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="reset"
            onClick={() => setForm(INITIAL_FORM)}
            className="rounded-lg border px-5 py-2.5 text-sm font-semibold"
            style={{
              borderColor: "var(--border-color, #e2e8f0)",
              background: "var(--surface-color, #ffffff)",
            }}
          >
            Clear
          </button>
          <button
            type="submit"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
            style={{ background: "var(--primary-color, #F36A20)" }}
          >
            Publish Ad
          </button>
        </div>
      </form>
    </section>
  );
}
