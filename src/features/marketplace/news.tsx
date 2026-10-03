"use client";
import Link from "next/link";
import { useState } from "react";
import { useMarketplace } from "@/providers/marketplace-provider";
import type { Article } from "@/types/marketplace";
import { Icon } from "@/components/ui/icons";
import { PageHeading, EmptyState, ButtonLink } from "@/components/ui/kit";
export function ArticleCard({
  article,
  index = 0,
}: {
  article: Article;
  index?: number;
}) {
  return (
    <article className="news-card">
      <Link
        href={`/news/${article.slug}`}
        className={`news-cover cover-${index % 3}`}
        aria-label={article.title}
      >
        <Icon
          name={
            index % 3 === 0 ? "settings" : index % 3 === 1 ? "box" : "shield"
          }
        />
      </Link>
      <div className="news-card-body">
        <small>
          {article.category.toUpperCase()} · {article.date}
        </small>
        <h3>
          <Link href={`/news/${article.slug}`}>{article.title}</Link>
        </h3>
        <p>{article.excerpt}</p>
      </div>
    </article>
  );
}
export function NewsIndex() {
  const { state } = useMarketplace();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const items = state.articles.filter(
    (a) =>
      a.status === "Published" &&
      (category === "All" || a.category === category) &&
      `${a.title} ${a.excerpt}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="section section-soft">
      <div className="container">
        <PageHeading
          eyebrow="THE GARAGE JOURNAL"
          title="A little knowledge. A better journey."
          description="Buying guides, parts explained and practical advice for life on the road."
        />
        <input
          className="input"
          style={{ maxWidth: 440, marginBottom: 25 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search articles"
          placeholder="Search the journal…"
        />
        <div className="tabs">
          {["All", "Buying guides", "Parts explained", "Maintenance"].map(
            (c) => (
              <button
                key={c}
                className={category === c ? "active" : ""}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ),
          )}
        </div>
        {items.length ? (
          <div className="news-grid">
            {items.map((a, i) => (
              <ArticleCard article={a} index={i} key={a.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No articles found"
            description="Try a different search or category."
          />
        )}
      </div>
    </section>
  );
}
export function ArticlePage({ slug }: { slug: string }) {
  const { state, ready } = useMarketplace();
  const a = state.articles.find(
    (a) => a.slug === slug && a.status === "Published",
  );
  if (!a)
    return (
      <div className="container section">
        <EmptyState
          title={ready ? "Article not found" : "Loading article…"}
          description="Explore the latest from the garage journal."
          href="/news"
          label="All articles"
        />
      </div>
    );
  return (
    <>
      <header className="article-hero">
        <div className="container">
          <Link href="/news" className="eyebrow">
            ← THE GARAGE JOURNAL
          </Link>
          <h1>{a.title}</h1>
          <p>
            {a.category} · {a.date} · AutoPart Hub editorial
          </p>
        </div>
      </header>
      <div className="container section prose">
        <p style={{ fontSize: 19, color: "#244255" }}>{a.excerpt}</p>
        <div className="article-body muted">{a.body}</div>
        <div className="notice">
          Editorial content is general guidance. Ask a qualified mechanic about
          your specific vehicle.
        </div>
        <ButtonLink href="/parts">Find parts for your vehicle</ButtonLink>
      </div>
    </>
  );
}
