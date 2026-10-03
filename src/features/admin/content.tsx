"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMarketplace, auditEntry } from "@/providers/marketplace-provider";
import { type Article } from "@/types/marketplace";
import {
  PageHeading,
  Panel,
  Field,
  ButtonLink,
  Badge,
  EmptyState,
} from "@/components/ui/kit";
export function AdminNews() {
  const { state, update, toast } = useMarketplace();
  return (
    <>
      <PageHeading
        eyebrow="THE GARAGE JOURNAL"
        title="News & articles"
        description="Create helpful content, manage drafts and publish to the journal."
        action={
          <ButtonLink href="/admin/news/new">+ Write an article</ButtonLink>
        }
      />
      <Panel>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ARTICLE</th>
                <th>CATEGORY</th>
                <th>STATUS</th>
                <th>FEATURED</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.title}</strong>
                    <small>{a.date}</small>
                  </td>
                  <td>{a.category}</td>
                  <td>
                    <Badge>{a.status}</Badge>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Feature article ${a.title}`}
                      checked={a.featured}
                      onChange={async (e) => {
                        const featured = e.target.checked;
                        if (!(await update((s) => ({
                          ...s,
                          articles: s.articles.map((x) =>
                            x.id === a.id ? { ...x, featured } : x,
                          ),
                          audit: [
                            auditEntry(
                              `${featured ? "Featured" : "Unfeatured"} article: ${a.title}`,
                            ),
                            ...s.audit,
                          ],
                        })))) return;
                        toast("Article updated");
                      }}
                    />
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        href={`/admin/news/${a.id}/edit`}
                        className="btn btn-secondary btn-small"
                      >
                        Edit
                      </Link>
                      <button
                        className="text-button"
                        onClick={async () => {
                          const status =
                            a.status === "Published" ? "Draft" : "Published";
                          if (!(await update((s) => ({
                            ...s,
                            articles: s.articles.map((x) =>
                              x.id === a.id ? { ...x, status } : x,
                            ),
                            audit: [
                              auditEntry(`${status}: ${a.title}`),
                              ...s.audit,
                            ],
                          })))) return;
                          toast("Article status updated");
                        }}
                      >
                        {a.status === "Published" ? "Unpublish" : "Publish"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
export function ArticleEditor({ id }: { id?: string }) {
  const { state, ready } = useMarketplace();
  if (!ready) return <p className="muted">Loading editor…</p>;
  const article = state.articles.find((a) => a.id === id);
  if (id && !article)
    return (
      <EmptyState
        title="Article not found"
        description="Open an article from your content library."
        href="/admin/news"
        label="All articles"
      />
    );
  return <Editor key={id || "new"} article={article} />;
}
function Editor({ article }: { article?: Article }) {
  const { update, toast } = useMarketplace();
  const router = useRouter();
  return (
    <>
      <PageHeading
        eyebrow="MAKE SOMETHING WORTH READING"
        title={article ? "Edit article" : "A new story starts here."}
        description="Share practical guidance with the AutoPart Hub community."
        action={
          <ButtonLink href="/admin/news" secondary>
            ← All articles
          </ButtonLink>
        }
      />
      <Panel title="Article details">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            const id = article?.id || crypto.randomUUID();
            const title = String(d.get("title"));
            const status = String(d.get("status"));
            const a: Article = {
              id,
              title,
              slug:
                article?.slug ||
                title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "") +
                  "-" +
                  id.slice(0, 5),
              category: String(d.get("category")),
              excerpt: String(d.get("excerpt")),
              body: String(d.get("body")),
              status,
              featured: article?.featured || false,
              date:
                article?.date ||
                new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
            };
            if (!(await update((s) => ({
              ...s,
              articles: article
                ? s.articles.map((x) => (x.id === id ? a : x))
                : [a, ...s.articles],
              audit: [auditEntry(`${status} article: ${title}`), ...s.audit],
            })))) return;
            toast("Article saved");
            router.push("/admin/news");
          }}
        >
          <Field label="Title">
            <input
              name="title"
              required
              defaultValue={article?.title}
              placeholder="Give your story a clear, useful title"
            />
          </Field>
          <div className="form-grid">
            <Field label="Category">
              <select name="category" defaultValue={article?.category}>
                <option>Buying guides</option>
                <option>Parts explained</option>
                <option>Maintenance</option>
              </select>
            </Field>
            <Field label="Publication status">
              <select name="status" defaultValue={article?.status || "Draft"}>
                <option>Draft</option>
                <option>Published</option>
              </select>
            </Field>
          </div>
          <Field label="Short introduction">
            <textarea
              name="excerpt"
              required
              minLength={15}
              defaultValue={article?.excerpt}
              placeholder="A short summary for the article card."
            />
          </Field>
          <Field label="Article body">
            <textarea
              name="body"
              required
              minLength={40}
              defaultValue={article?.body}
              style={{ minHeight: 320 }}
              placeholder="Write your article. Separate paragraphs with a blank line."
            />
          </Field>
          <div className="form-footer">
            <button className="btn btn-primary">Save article</button>
          </div>
        </form>
      </Panel>
    </>
  );
}
export function ReferenceData() {
  const { state, update, toast } = useMarketplace();
  const [tab, setTab] = useState("Categories");
  const [removing, setRemoving] = useState<string | null>(null);
  return (
    <>
      <PageHeading
        eyebrow="THE MARKETPLACE FOUNDATION"
        title="Reference data"
        description="Maintain the categories, brands, models and locations used to organise parts."
      />
      <div className="tabs">
        {Object.keys(state.references).map((k) => (
          <button
            key={k}
            className={tab === k ? "active" : ""}
            onClick={() => {
              setTab(k);
              setRemoving(null);
            }}
          >
            {k}
          </button>
        ))}
      </div>
      <Panel title={tab}>
        <form
          style={{ display: "flex", gap: 12 }}
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const value = String(new FormData(form).get("value")).trim();
            if (!value) return;
            if (
              state.references[tab].some(
                (v) => v.toLowerCase() === value.toLowerCase(),
              )
            ) {
              toast("That value already exists.");
              return;
            }
            if (!(await update((s) => ({
              ...s,
              references: {
                ...s.references,
                [tab]: [...s.references[tab], value],
              },
              audit: [
                auditEntry(`Added ${tab.toLowerCase()}: ${value}`),
                ...s.audit,
              ],
            })))) return;
            form.reset();
            toast("Reference value added");
          }}
        >
          <input
            className="input"
            name="value"
            required
            aria-label={`New ${tab.toLowerCase()} value`}
            placeholder={`Add to ${tab.toLowerCase()}…`}
          />
          <button className="btn btn-primary">Add value</button>
        </form>
        <div className="reference-list">
          {state.references[tab].map((v) => (
            <span key={v}>
              {v}
              <button aria-label={`Remove ${v}`} onClick={() => setRemoving(v)}>
                ×
              </button>
            </span>
          ))}
        </div>
        {removing && (
          <div className="notice">
            Remove “{removing}” from {tab.toLowerCase()}? Existing listing
            labels will remain intact.
            <div className="button-row">
              <button
                className="btn btn-danger btn-small"
                onClick={async () => {
                  if (!(await update((s) => ({
                    ...s,
                    references: {
                      ...s.references,
                      [tab]: s.references[tab].filter((v) => v !== removing),
                    },
                    audit: [
                      auditEntry(`Removed ${tab.toLowerCase()}: ${removing}`),
                      ...s.audit,
                    ],
                  })))) return;
                  setRemoving(null);
                  toast("Reference value removed");
                }}
              >
                Remove
              </button>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setRemoving(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Panel>
    </>
  );
}
export function AuditLogs() {
  const { state } = useMarketplace();
  const [query, setQuery] = useState("");
  const logs = state.audit.filter((a) =>
    a.action.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="A RECORD OF EVERY DECISION"
        title="Audit logs"
        description="Read-only history of administrative actions recorded by the server."
      />
      <input
        className="input"
        style={{ maxWidth: 440, marginBottom: 22 }}
        aria-label="Search audit logs"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search actions…"
      />
      <Panel>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ACTION</th>
                <th>ACTOR</th>
                <th>DATE & TIME</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((a) => (
                <tr key={a.id}>
                  <td style={{ whiteSpace: "normal", minWidth: 250 }}>
                    {a.action}
                  </td>
                  <td>Demo administrator</td>
                  <td>{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!logs.length && (
          <EmptyState
            title="No matching activity"
            description="Actions will appear as you use the admin tools."
          />
        )}
      </Panel>
    </>
  );
}
