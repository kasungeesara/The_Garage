"use client";
import Link from "next/link";
import { useMarketplace } from "@/providers/marketplace-provider";
import {
  PageHeading,
  Stat,
  Panel,
  ButtonLink,
  EmptyState,
  Badge,
} from "@/components/ui/kit";
import { Icon } from "@/components/ui/icons";
import { PartCard } from "@/features/marketplace/part-card";
export function CustomerOverview() {
  const { state } = useMarketplace();
  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL PIT STOP"
        title={`Good to see you, ${(state.user?.name || "there").split(" ")[0]}.`}
        description="Your saved finds, conversations and next steps. All in one place."
        action={
          <ButtonLink href="/parts">
            Find parts
            <Icon name="arrow" size={16} />
          </ButtonLink>
        }
      />
      <div className="stats-grid">
        <Stat
          label="Saved parts"
          value={state.favourites.length}
          detail="Your shortlist, ready to explore"
          icon="heart"
        />
        <Stat
          label="Enquiries"
          value={state.enquiries.length}
          detail="Conversations with sellers"
          icon="chat"
        />
        <Stat
          label="Recently viewed"
          value={state.recent.length}
          detail="Pick up where you left off"
          icon="clock"
        />
        <Stat
          label="Unread updates"
          value={state.notifications.filter((n) => !n.read).length}
          detail="Stay in the loop"
          icon="bell"
        />
      </div>
      <div className="welcome-banner">
        <div>
          <p className="eyebrow">FROM SEARCHING TO SELLING</p>
          <h2>Have a part someone’s looking for?</h2>
          <p>
            Turn your spare parts into someone else’s next journey. Set up your
            seller profile in a few simple steps.
          </p>
        </div>
        <ButtonLink href="/sell">
          Start selling
          <Icon name="arrow" size={16} />
        </ButtonLink>
      </div>
      <div className="two-columns">
        <Panel
          title="Recent conversations"
          action={<Link href="/dashboard/enquiries">View all →</Link>}
        >
          {state.enquiries.slice(0, 3).map((e) => (
            <Link
              href={`/dashboard/enquiries/${e.id}`}
              className="activity-item"
              key={e.id}
            >
              <span className="activity-icon">
                <Icon name="chat" />
              </span>
              <div>
                <strong>{e.subject}</strong>
                <p>{e.messages.at(-1)?.text}</p>
              </div>
              <Badge>{e.status}</Badge>
            </Link>
          ))}
        </Panel>
        <Panel title="Your next steps">
          <Link href="/dashboard/profile" className="activity-item">
            <span className="activity-icon">
              <Icon name="user" />
            </span>
            <div>
              <strong>Make yourself at home</strong>
              <p>Update your profile and contact preferences.</p>
            </div>
          </Link>
          <Link href="/safety" className="activity-item">
            <span className="activity-icon">
              <Icon name="shield" />
            </span>
            <div>
              <strong>Buy with confidence</strong>
              <p>A few checks before your next purchase.</p>
            </div>
          </Link>

        </Panel>
      </div>
      <div className="section-heading">
        <h2>On your shortlist</h2>
        <Link href="/dashboard/favourites">All saved parts →</Link>
      </div>
      <div className="parts-grid">
        {state.parts
          .filter((p) => state.favourites.includes(p.id))
          .slice(0, 3)
          .map((p) => (
            <PartCard part={p} key={p.id} />
          ))}
      </div>
    </>
  );
}
export function Collection({ recent = false }: { recent?: boolean }) {
  const { state, update, toast } = useMarketplace();
  const ids = recent ? state.recent : state.favourites;
  const items = ids
    .map((id) => state.parts.find((p) => p.id === id))
    .filter((p) => p !== undefined);
  return (
    <>
      <PageHeading
        eyebrow="YOUR COLLECTION"
        title={
          recent
            ? "Pick up where you left off."
            : "Your next great find, saved."
        }
        description={
          recent
            ? "Parts you recently explored."
            : "Keep your favourite parts together while you decide."
        }
        action={
          recent ? (
            <button
              className="btn btn-secondary"
              onClick={async () => {
                if (!(await update((s) => ({ ...s, recent: [] })))) return;
                toast("Viewing history cleared");
              }}
            >
              Clear history
            </button>
          ) : (
            <ButtonLink href="/parts">Explore parts</ButtonLink>
          )
        }
      />
      {items.length ? (
        <div className="parts-grid">
          {items.map((p) => (
            <PartCard key={p.id} part={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            recent ? "Your journey starts here" : "Your shortlist is waiting"
          }
          description={
            recent
              ? "Open a part to see it here later."
              : "Tap the heart on a part to save it for later."
          }
          href="/parts"
        />
      )}
    </>
  );
}
