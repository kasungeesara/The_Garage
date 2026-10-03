"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useMarketplace } from "@/providers/marketplace-provider";
import { PartArt } from "@/components/ui/part-art";
import { Icon } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/kit";
import { PartCard } from "./part-card";
import { ArticleCard } from "./news";
import { BeetleExploded } from "./components/beetle-exploded";
export function HomePage() {
  const { state } = useMarketplace();
  const router = useRouter();
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">
                <span className="live-dot" />
                SRI LANKA’S SPARE PARTS MARKETPLACE
              </p>
              <h1>
                Every part.
                <br />
                Every possibility.
                <br />
                <em>Find your fit.</em>
              </h1>
              <p className="hero-copy">
                From everyday essentials to that hard-to-find component.
                Discover quality parts from local sellers, all in one place.
              </p>
              <form
                className="hero-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push(
                    "/parts?q=" +
                      encodeURIComponent(
                        String(new FormData(e.currentTarget).get("q") || ""),
                      ),
                  );
                }}
              >
                <Icon name="search" />
                <input
                  name="q"
                  aria-label="Search parts"
                  placeholder="Try ‘Prius brake pads’"
                />
                <button className="btn btn-primary">
                  Find parts
                  <Icon name="arrow" size={16} />
                </button>
              </form>
              <div className="hero-tags">
                <span>POPULAR:</span>
                <Link href="/parts?brand=Toyota">Toyota</Link>
                <Link href="/parts?category=Brakes">Brake pads</Link>
                <Link href="/parts?category=Lighting">Headlights</Link>
              </div>
            </div>
            <div className="hero-visual hero-beetle-visual">
              <span className="hero-vertical">
                PRECISION · PERFORMANCE · PEACE OF MIND
              </span>
              <BeetleExploded />
              <div className="hero-sticker">
                <Icon name="shield" size={30} />
                <div>
                  <strong>A better way to buy</strong>Local sellers. Clear
                  compatibility.
                </div>
              </div>
            </div>
          </div>
          <div className="trust-strip">
            <span>
              <Icon name="shield" size={18} />
              Seller verification
            </span>
            <span>
              <Icon name="filter" size={18} />
              Find your exact fit
            </span>
            <span>
              <Icon name="chat" size={18} />
              Connect directly
            </span>
            <span>
              <Icon name="pin" size={18} />
              Across Sri Lanka
            </span>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">START WITH THE ESSENTIALS</p>
              <h2>What are you looking for?</h2>
            </div>
            <Link href="/categories">
              All categories <Icon name="arrow" size={17} />
            </Link>
          </div>
          <div className="category-grid">
            {state.references.Categories.slice(0, 6).map((c) => (
              <Link
                className="category-card"
                href={`/parts?category=${encodeURIComponent(c)}`}
                key={c}
              >
                <PartArt category={c} />
                <h3>{c}</h3>
                <small>Explore parts →</small>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">READY FOR YOUR NEXT JOURNEY</p>
              <h2>Parts worth a closer look</h2>
            </div>
            <Link href="/parts">
              Browse all parts
              <Icon name="arrow" size={17} />
            </Link>
          </div>
          <div className="parts-grid four">
            {state.parts
              .filter((p) => p.status === "Published")
              .sort((a, b) => Number(b.featured) - Number(a.featured))
              .slice(0, 4)
              .map((p) => (
                <PartCard part={p} key={p.id} />
              ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="seller-banner">
            <div>
              <p className="eyebrow">FOR PARTS PEOPLE, BY PARTS PEOPLE</p>
              <h2>Your stock. A wider audience.</h2>
              <p>
                Give your parts a storefront and connect with drivers across the
                island.
              </p>
            </div>
            <ButtonLink href="/sell">
              Start selling
              <Icon name="arrow" size={17} />
            </ButtonLink>
          </div>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A LITTLE KNOW-HOW GOES A LONG WAY</p>
              <h2>From the garage journal</h2>
            </div>
            <Link href="/news">
              Read the journal
              <Icon name="arrow" size={17} />
            </Link>
          </div>
          <div className="news-grid">
            {state.articles
              .filter((a) => a.status === "Published")
              .sort((a, b) => Number(b.featured) - Number(a.featured))
              .slice(0, 3)
              .map((a, i) => (
                <ArticleCard article={a} index={i} key={a.id} />
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
