"use client";
import { api } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useMarketplace } from "@/providers/marketplace-provider";
import { PageHeading, Panel, Field, ButtonLink } from "@/components/ui/kit";
export function ProfilePage() {
  const { state, update, toast, logout, refresh } = useMarketplace();
  const router = useRouter();
  const [emailPending, setEmailPending] = useState(false);

  const user = state.user || {
    name: "",
    email: "",
    phone: "",
    city: "Colombo",
  };
  return (
    <>
      <PageHeading
        eyebrow="MAKE IT YOURS"
        title="Profile & settings"
        description="Your details, communication preferences and account controls."
      />
      <div className="equal-columns">
        <div className="stack">
          <Panel title="Personal information">
            <form
              key={JSON.stringify(user)}
              onSubmit={async (e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                if (!(await update((s) => ({
                  ...s,
                  user: {
                    ...s.user!,
                    name: String(d.get("name")),
                    email: String(d.get("email")),
                    phone: String(d.get("phone")),
                    city: String(d.get("city")),
                  },
                })))) return;
                toast("Profile saved");
              }}
            >
              <Field label="Full name">
                <input name="name" required defaultValue={user.name} />
              </Field>
              <Field label="Email address">
                <input
                  name="email"
                  type="email"
                  readOnly
                  required
                  defaultValue={user.email}
                />
              </Field>
              <div className="form-grid">
                <Field label="Phone number">
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={user.phone}
                    required
                  />
                </Field>
                <Field label="City">
                  <select name="city" defaultValue={user.city}>
                    {["Colombo", "Kandy", "Galle", "Gampaha", "Kurunegala"].map(
                      (c) => (
                        <option key={c}>{c}</option>
                      ),
                    )}
                  </select>
                </Field>
              </div>
              <button className="btn btn-primary">Save changes</button>
            </form>
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Notification preferences">
            <p className="muted">Choose which updates you’d like to receive.</p>
            <label className="check-row">
              <input
                type="checkbox"
                checked={state.preferences.enquiries}
                onChange={async (e) => {
                  if (!(await update((s) => ({
                    ...s,
                    preferences: {
                      ...s.preferences,
                      enquiries: e.target.checked,
                    },
                  })))) return;
                  toast("Preference updated");
                }}
              />
              In-app enquiry updates
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={state.preferences.email}
                onChange={async (e) => {
                  if (!(await update((s) => ({
                    ...s,
                    preferences: { ...s.preferences, email: e.target.checked },
                  })))) return;
                  toast(
                    "Email preference saved.",
                  );
                }}
              />
              Email notifications
            </label>
          </Panel>
          <Panel title="Change account email">
            <p className="muted">Enter your current password to change your email address. You will need to sign in again.</p>
            <form style={{marginTop:16}} onSubmit={async e=>{
              e.preventDefault();if(emailPending)return;const form=e.currentTarget;const data=new FormData(form);setEmailPending(true);
              try{await api("auth/change-email",{email:data.get("email"),password:data.get("password")});form.reset();await refresh();router.replace("/auth/login");toast("Email updated. Sign in with your new address.");}
              catch(e){toast(e instanceof Error?e.message:"Unable to request email change");}
              finally{setEmailPending(false);}
            }}>
              <Field label="New email address"><input name="email" type="email" required autoComplete="email"/></Field>
              <Field label="Current password"><input name="password" type="password" required maxLength={128} autoComplete="current-password"/></Field>
              <button className="btn btn-secondary" disabled={emailPending}>{emailPending?"Saving…":"Update email"}</button>
            </form>
          </Panel>
          <Panel title="Account access">
            <p className="muted">
              Manage your password and sign-in below.
            </p>
            <div className="button-row">
              <ButtonLink href="/auth/forgot-password" secondary>
                Reset password
              </ButtonLink>

            </div>
            <div className="button-row">
              <button
                className="text-button"
                onClick={async () => {
                  if (!(await logout())) return;
                  router.push("/auth/login");
                }}
              >
                Sign out
              </button>
            </div>
          </Panel>

        </div>
      </div>
    </>
  );
}
export function NotificationsPage() {
  const { state, update, toast } = useMarketplace();
  return (
    <>
      <PageHeading
        eyebrow="STAY IN THE LOOP"
        title="Your updates"
        description="New replies and marketplace activity, at a glance."
        action={
          <button
            className="btn btn-secondary"
            onClick={async () => {
              if (!(await update((s) => ({
                ...s,
                notifications: s.notifications.map((n) => ({
                  ...n,
                  read: true,
                })),
              })))) return;
              toast("All notifications marked as read");
            }}
          >
            Mark all as read
          </button>
        }
      />
      <Panel>
        {state.notifications.length ? (
          state.notifications.map((n) => (
            <div className="activity-item" key={n.id}>
              <span className="avatar">{n.read ? "✓" : "•"}</span>
              <div>
                <strong>{n.text}</strong>
                <p>{n.read ? "Read" : "Unread"}</p>
              </div>
              {!n.read && (
                <button
                  className="text-button"
                  onClick={async () =>
                    { await update((s) => ({
                      ...s,
                      notifications: s.notifications.map((x) =>
                        x.id === n.id ? { ...x, read: true } : x,
                      ),
                    })); }
                  }
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="muted">You’re all caught up.</p>
        )}
      </Panel>
    </>
  );
}
