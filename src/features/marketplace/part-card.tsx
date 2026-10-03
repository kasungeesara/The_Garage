"use client";
/* Listing photos are served by the marketplace media API. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { type Part, money } from "@/types/marketplace";
import { useMarketplace, findSeller } from "@/providers/marketplace-provider";
import { PartArt } from "@/components/ui/part-art";
import { Badge } from "@/components/ui/kit";
import { Icon } from "@/components/ui/icons";
export function PartCard({ part }: { part: Part }) {
  const { state, update, toast } = useMarketplace();
  const saved = state.favourites.includes(part.id);
  const seller = findSeller(state, part.seller);
  return (
    <article className="part-card">
      <div className="part-image">
        <Link href={`/parts/${part.slug}`} tabIndex={-1} aria-hidden="true">
          {part.images?.[0] ? (
            <img
              className="part-art"
              style={{ objectFit: "cover" }}
              src={part.images[0]}
              alt=""
            />
          ) : (
            <PartArt category={part.category} />
          )}
        </Link>
        <Badge>{part.featured ? "Featured" : part.condition}</Badge>
        <button
          className={`save-btn ${saved ? "saved" : ""}`}
          aria-label={`${saved ? "Unsave" : "Save"} ${part.title}`}
          aria-pressed={saved}
          onClick={async () => {
            if (!(await update((s) => ({
              ...s,
              favourites: saved
                ? s.favourites.filter((id) => id !== part.id)
                : [...s.favourites, part.id],
            })))) return;
            toast(saved ? "Removed from saved parts" : "Added to saved parts");
          }}
        >
          <Icon name="heart" size={16} />
        </button>
      </div>
      <div className="part-content">
        <div className="part-meta">
          <span>{part.category}</span>
          <span>{part.condition}</span>
        </div>
        <h3>
          <Link href={`/parts/${part.slug}`}>{part.title}</Link>
        </h3>
        <p className="part-fit">
          {part.brand} {part.model} · {part.year}
        </p>
        <p className="part-price">{money(part.price)}</p>
        <div className="part-bottom">
          <span>
            <Icon name="pin" size={12} />
            {part.city}
          </span>
          <span>
            {seller?.verified && <Icon name="shield" size={12} />}{" "}
            {seller?.name || "Independent seller"}
          </span>
        </div>
      </div>
    </article>
  );
}
