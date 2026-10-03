"use client";
import { api } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";
import { Panel, Field, ButtonLink } from "@/components/ui/kit";
import { Icon } from "@/components/ui/icons";
const content: Record<
  string,
  {
    eyebrow: string;
    title: string;
    description: string;
    sections: [string, string][];
  }
> = {
  about: {
    eyebrow: "OUR STORY",
    title: "Keeping Sri Lanka moving. One part at a time.",
    description:
      "A dedicated home for the parts, people and knowledge that keep your vehicle on the road.",
    sections: [
      [
        "The right connections",
        "Finding a replacement part should not mean endless calls and uncertain compatibility. AutoPart Hub brings structured listings and local sellers into one searchable marketplace.",
      ],
      [
        "Built around real journeys",
        "Explore by vehicle brand, model, year and location. Compare condition, save promising parts and ask sellers the questions that matter before arranging a purchase.",
      ],
      [
        "A marketplace with care",
        "Seller profiles, reviews, listing moderation and reports are designed to make the experience clearer for everyone. Listings and conversations are managed through your account.",
      ],
    ],
  },
  safety: {
    eyebrow: "BUY WITH CONFIDENCE",
    title: "A safer journey starts here.",
    description:
      "A few practical checks can make a big difference when buying vehicle parts.",
    sections: [
      [
        "Confirm the fit",
        "Compare the exact manufacturer part number, vehicle model, engine variant and production year. Ask a qualified mechanic if you are unsure.",
      ],
      [
        "Inspect before paying",
        "Arrange an inspection in a suitable public place or established shop. Check condition, included accessories and any return arrangements directly with the seller.",
      ],
      [
        "Keep your information private",
        "Never share passwords or one-time codes. Be cautious about requests for advance transfers or pressure to complete a deal quickly.",
      ],
      [
        "Know what verification means",
        "A seller verification badge is a profile review indicator, not a mechanical inspection, warranty or guarantee that a part is genuine.",
      ],
      [
        "Something does not look right?",
        "Use the report action on a listing so moderators can review it. Keep relevant conversation details and avoid proceeding until your concerns are resolved.",
      ],
    ],
  },
  terms: {
    eyebrow: "PLATFORM GUIDELINES · DEMO DRAFT",
    title: "Terms of use",
    description:
      "A plain-language preview of how this marketplace is intended to work. These draft terms are not a published service agreement.",
    sections: [
      [
        "Using the marketplace",
        "Provide accurate account and listing information. Advertise only parts you are entitled to sell, and describe their condition and compatibility honestly.",
      ],
      [
        "Transactions between users",
        "The initial marketplace connects buyers and sellers through enquiries. Payment, inspection, collection, warranties and returns are arranged directly between those parties.",
      ],
      [
        "Listings and conduct",
        "Misleading, counterfeit, abusive or unlawful content is not permitted. Moderators may review reports and restrict content or accounts according to published policies.",
      ],
      [
        "Preview limitations",
        "Sellers are responsible for listing accuracy. Inspect parts and confirm compatibility before arranging payment or collection.",
      ],
    ],
  },
  privacy: {
    eyebrow: "YOUR INFORMATION · DRAFT",
    title: "Privacy, explained simply.",
    description:
      "Account, listing and conversation data is stored by the marketplace service.",
    sections: [
      [
        "What the service stores",
        "We store account details, listings, photos, enquiries and account preferences on the marketplace server. Session cookies keep you signed in.",
      ],
      [
        "Account data requests",
        "Contact support to request access to or removal of your account data.",
      ],
      [
        "The future service",
        "A production privacy policy will need to specify the operator, processing purposes, retention periods, service providers and user rights before launch.",
      ],
      [
        "Contact and privacy requests",
        "Use the contact form to send questions or account data requests to the marketplace team.",
      ],
    ],
  },
};
const faqs = [
  [
    "How do I find a compatible part?",
    "Use the brand, model, compatible year and other filters. Before purchasing, compare the part number and check with the seller or your mechanic.",
  ],
  [
    "Can I buy and pay through AutoPart Hub?",
    "The initial release uses direct enquiries. Arrange inspection, payment and collection directly with the seller; there is no online checkout.",
  ],
  [
    "How do I become a seller?",
    "Open Start selling, complete the individual or business profile and create your first listing. Listings can be submitted for moderation.",
  ],
  [
    "What do the condition labels mean?",
    "New parts have not been installed; used parts have been previously fitted; reconditioned parts have undergone restoration. Ask for the details of any repair or testing.",
  ],
  [
    "What does a verified seller badge mean?",
    "It indicates a seller profile review. It does not certify every part or guarantee mechanical condition.",
  ],
  [
    "Can I save parts for later?",
    "Yes. Use the heart on a listing and find it under Saved parts in your customer workspace.",
  ],
  [
    "Who creates the listings?",
    "Registered sellers submit listings for moderation. Contact the seller to confirm current availability and compatibility.",
  ],
];
export function InformationPage({ kind }: { kind: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (kind === "contact")
    return (
      <>
        <div className="info-hero">
          <div className="container">
            <p className="eyebrow">LET’S TALK</p>
            <h1>A question? We’re all ears.</h1>
            <p className="muted">
              Questions about the marketplace, seller tools or finding your next
              part? Start here.
            </p>
          </div>
        </div>
        <div className="container section equal-columns">
          <div>
            <h2 style={{ fontSize: 25, fontWeight: 650 }}>How can we help?</h2>
            <p className="muted" style={{ margin: "15px 0 25px" }}>
              For a specific part’s availability or compatibility, contact the
              seller from the listing page.
            </p>
            <Panel title="Find an answer faster">
              <p className="muted">
                Our help guide covers buying, selling and staying safe.
              </p>
              <div className="button-row">
                <ButtonLink href="/faq" secondary>
                  Visit the help center
                  <Icon name="arrow" size={16} />
                </ButtonLink>
              </div>
            </Panel>
          </div>
          <Panel title="Send a message">
            {sent ? (
              <div className="success-box">
                Your message has been received. Our team will review it.
                <button
                  className="text-button"
                  style={{ display: "block", marginTop: 12 }}
                  onClick={() => setSent(false)}
                >
                  Write another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault(); if(pending)return;
                  const data = new FormData(e.currentTarget); setError("");setPending(true);
                  try { await api("contact",Object.fromEntries(data)); setSent(true); }
                  catch(e){setError(e instanceof Error?e.message:"Unable to send message");}
                  finally{setPending(false);}
                }}
              >
                <Field label="Your name">
                  <input required name="name" placeholder="Full name" />
                </Field>
                <Field label="Email address">
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                  />
                </Field>
                <Field label="Topic">
                  <select name="topic">
                    <option>General question</option>
                    <option>Selling on AutoPart Hub</option>
                    <option>Report a concern</option>
                  </select>
                </Field>
                <Field label="Message">
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    placeholder="Tell us a little more…"
                  />
                </Field>
                {error && <p role="alert" className="error-text">{error}</p>}
                <button className="btn btn-primary" disabled={pending}>
                  {pending ? "Sending…" : "Send message"}
                  <Icon name="arrow" size={16} />
                </button>
              </form>
            )}
          </Panel>
        </div>
      </>
    );
  if (kind === "faq")
    return (
      <>
        <div className="info-hero">
          <div className="container">
            <p className="eyebrow">THE HELP CENTER</p>
            <h1>
              Good questions.
              <br />
              Clear answers.
            </h1>
            <p className="muted">
              Everything you need to get started with AutoPart Hub.
            </p>
          </div>
        </div>
        <div className="container section prose">
          {faqs.map(([q, a]) => (
            <details className="faq-item" key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
          <div className="button-row">
            <ButtonLink href="/contact">Still need a hand?</ButtonLink>
          </div>
        </div>
      </>
    );
  const c = content[kind] || content.about;
  return (
    <>
      <div className="info-hero">
        <div className="container">
          <p className="eyebrow">{c.eyebrow}</p>
          <h1>{c.title}</h1>
          <p className="muted">{c.description}</p>
        </div>
      </div>
      <div className="container section prose">
        {c.sections.map(([h, p]) => (
          <section key={h}>
            <h2>{h}</h2>
            <p>{p}</p>
          </section>
        ))}
        <div className="button-row">
          <ButtonLink href="/parts">
            Explore the marketplace
            <Icon name="arrow" size={16} />
          </ButtonLink>
          <Link className="btn btn-secondary" href="/contact">
            Get in touch
          </Link>
        </div>
      </div>
    </>
  );
}
