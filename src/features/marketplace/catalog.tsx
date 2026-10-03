"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { useMarketplace } from "@/providers/marketplace-provider";
import { PartCard } from "./part-card";
import { PageHeading, Field, EmptyState } from "@/components/ui/kit";
import { Icon } from "@/components/ui/icons";
import { PartArt } from "@/components/ui/part-art";
export function Catalog() {
  const { state } = useMarketplace();
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const get = (k: string) => params.get(k) || "";
  const change = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== "page") next.delete("page");
    router.replace("/parts?" + next.toString(), { scroll: false });
  };
  const parts = state.parts
    .filter((p) => p.status === "Published")
    .filter((p) =>
      get("q")
        .toLowerCase()
        .split(/\s+/)
        .every((word) =>
          `${p.title} ${p.brand} ${p.model} ${p.category}`
            .toLowerCase()
            .includes(word),
        ),
    )
    .filter((p) =>
      [
        "category",
        "brand",
        "model",
        "condition",
        "city",
        "fuel",
        "transmission",
      ].every((k) => !get(k) || String(p[k as keyof typeof p]) === get(k)),
    )
    .filter((p) => !get("min") || p.price >= Number(get("min")))
    .filter((p) => !get("max") || p.price <= Number(get("max")))
    .filter(
      (p) =>
        !get("year") ||
        (Number(get("year")) >= Number(p.year.slice(0, 4)) &&
          Number(get("year")) <= Number(p.year.slice(-4))),
    );
  if (get("sort") === "low") parts.sort((a, b) => a.price - b.price);
  else if (get("sort") === "high") parts.sort((a, b) => b.price - a.price);
  else parts.sort((a, b) => Number(b.featured) - Number(a.featured));
  const page = Math.max(
    1,
    Math.min(Number(get("page")) || 1, Math.ceil(parts.length / 6) || 1),
  );
  const filterOptions: Record<string, string[]> = {
    category: state.references.Categories,
    brand: state.references.Brands,
    model: [
      ...new Set([
        ...state.references.Models,
        ...state.parts.map((p) => p.model),
      ]),
    ],
    condition: ["New", "Used", "Reconditioned"],
    city: state.references.Locations,
    fuel: ["Petrol", "Diesel", "Hybrid", "Electric"],
    transmission: ["Automatic", "Manual"],
  };
  return (
    <section className="section section-soft">
      <div className="container">
        <PageHeading
          eyebrow="THE MARKETPLACE"
          title="Find your next part."
          description="Good journeys start with the right fit. Search parts from sellers across Sri Lanka."
        />
        <div className="catalog-layout">
          <aside className={`filters ${open ? "filters-open" : ""}`}>
            <div className="section-heading">
              <h2>Refine your search</h2>
              <button
                className="text-button"
                onClick={() => router.replace("/parts")}
              >
                Reset
              </button>
            </div>
            {Object.entries(filterOptions).map(([key, options]) => (
              <Field
                key={key}
                label={
                  key === "city"
                    ? "Location"
                    : key.charAt(0).toUpperCase() + key.slice(1)
                }
              >
                <select
                  value={get(key)}
                  onChange={(e) => change(key, e.target.value)}
                >
                  <option value="">
                    All {key === "city" ? "locations" : key + "s"}
                  </option>
                  {options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
            ))}
            <Field label="Compatible year">
              <input
                type="number"
                min="1980"
                max="2030"
                placeholder="e.g. 2018"
                value={get("year")}
                onChange={(e) => change("year", e.target.value)}
              />
            </Field>
            <Field label="Min. price (LKR)">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={get("min")}
                onChange={(e) => change("min", e.target.value)}
              />
            </Field>
            <Field label="Max. price (LKR)">
              <input
                type="number"
                min="0"
                placeholder="Any price"
                value={get("max")}
                onChange={(e) => change("max", e.target.value)}
              />
            </Field>
          </aside>
          <div>
            <form
              style={{ display: "flex", gap: 10, marginBottom: 20 }}
              onSubmit={(e) => {
                e.preventDefault();
                change(
                  "q",
                  String(new FormData(e.currentTarget).get("q") || ""),
                );
              }}
            >
              <input
                className="input"
                key={get("q")}
                name="q"
                defaultValue={get("q")}
                aria-label="Search parts"
                placeholder="Part name, vehicle brand or model"
              />
              <button className="btn btn-dark">
                <Icon name="search" size={17} />
                Search
              </button>
            </form>
            <div className="catalog-toolbar">
              <span>
                <strong>{parts.length}</strong> parts found
              </span>
              <button
                className="btn btn-secondary btn-small filter-toggle"
                onClick={() => setOpen(!open)}
              >
                <Icon name="filter" size={16} />
                Filters
              </button>
              <select
                className="input"
                aria-label="Sort parts"
                value={get("sort")}
                onChange={(e) => change("sort", e.target.value)}
              >
                <option value="">Featured first</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </div>
            <div className="filter-chips">
              {Array.from(params.entries())
                .filter(([k]) => !["sort", "page"].includes(k))
                .map(([k, v]) => (
                  <button key={k} onClick={() => change(k, "")}>
                    {v} ×
                  </button>
                ))}
            </div>
            {parts.length ? (
              <>
                <div className="parts-grid">
                  {parts.slice((page - 1) * 6, page * 6).map((p) => (
                    <PartCard part={p} key={p.id} />
                  ))}
                </div>
                <nav className="pagination" aria-label="Results pages">
                  {Array.from(
                    { length: Math.ceil(parts.length / 6) },
                    (_, i) => (
                      <button
                        className={page === i + 1 ? "active" : ""}
                        aria-current={page === i + 1 ? "page" : undefined}
                        onClick={() => change("page", String(i + 1))}
                        key={i}
                      >
                        {i + 1}
                      </button>
                    ),
                  )}
                </nav>
              </>
            ) : (
              <EmptyState
                title="No matching parts yet"
                description="Try another model, widen your price range or clear a filter."
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
export function Directory({ kind }: { kind: "categories" | "brands" }) {
  const { state } = useMarketplace();
  return (
    <section className="section section-soft">
      <div className="container">
        <PageHeading
          eyebrow="FIND YOUR FIT"
          title={
            kind === "brands"
              ? "Built for your brand."
              : "Every system. Every essential."
          }
          description={
            kind === "brands"
              ? "Start with your vehicle’s manufacturer and explore compatible parts."
              : "From the engine bay to the finishing touches, find the category you need."
          }
        />
        <div className={kind === "brands" ? "brand-grid" : "category-grid"}>
          {(kind === "brands"
            ? state.references.Brands
            : state.references.Categories
          ).map((item) => (
            <Link
              href={`/parts?${kind === "brands" ? "brand" : "category"}=${encodeURIComponent(item)}`}
              className={kind === "brands" ? "brand-card" : "category-card"}
              key={item}
            >
              {kind === "brands" ? (
                <span className="brand-monogram">{item.slice(0, 1)}</span>
              ) : (
                <PartArt category={item} />
              )}
              <div>
                <h3>{item}</h3>
                <p className="muted">
                  {
                    state.parts.filter(
                      (p) =>
                        p.status === "Published" &&
                        (kind === "brands" ? p.brand : p.category) === item,
                    ).length
                  }{" "}
                  available parts
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
