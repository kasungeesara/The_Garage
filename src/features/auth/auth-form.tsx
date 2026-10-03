"use client";
import { api } from "@/lib/api";
import { auth } from "@/features/auth/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMarketplace } from "@/providers/marketplace-provider";
import { Field, ButtonLink } from "@/components/ui/kit";
import { PartArt } from "@/components/ui/part-art";
import { Icon } from "@/components/ui/icons";
const titles = {
  login: [
    "Welcome back.",
    "Your next part is waiting. Sign in to your workspace.",
  ],
  register: [
    "Your journey starts here.",
    "Create your profile and make yourself at home.",
  ],
  "forgot-password": [
    "Let’s get you back in.",
    "Enter your account email and we’ll send a reset link.",
  ],
  "reset-password": [
    "A fresh start.",
    "Choose a new password for your account.",
  ],

};
export function AuthForm({ mode }: { mode: keyof typeof titles }) {
  const { refresh, toast } = useMarketplace();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="auth-shell">
      <aside className="auth-story">
        <div>
          <Link className="brand" href="/">
            <span className="brand-mark">
              <Icon name="box" />
            </span>
            <span>
              AutoPart<span className="brand-light">Hub</span>
            </span>
          </Link>
        </div>
        <div>
          <PartArt />
          <p className="eyebrow">EVERY PART HAS A NEXT CHAPTER</p>
          <h2>
            Find your fit.
            <br />
            <span>Keep moving.</span>
          </h2>
          <p>
            A better way to discover vehicle parts and connect with local
            sellers across Sri Lanka.
          </p>
        </div>
        <small>Your parts. Your people. Your next chapter.</small>
      </aside>
      <main className="auth-content">
        <div className="auth-form">
          <p className="eyebrow">YOUR AUTOPART HUB</p>
          <h1>{titles[mode][0]}</h1>
          <p className="muted">{titles[mode][1]}</p>
          {success ? (
            <div className="success-box">
              {mode === "forgot-password" ? "If an eligible account exists, a reset link will arrive shortly." : "Your password was reset. Sign in with your new password."}
              <div className="button-row"><ButtonLink href="/auth/login">Back to sign in</ButtonLink></div>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault(); if (pending) return;
                setError("");
                const data = new FormData(e.currentTarget);
                const email = String(data.get("email") || "").trim();
                const password = String(data.get("password") || "");
                if (mode === "reset-password" && password !== data.get("confirm")) { setError("Passwords do not match."); return; }
                setPending(true);
                try {
                  if (mode === "forgot-password") { await api("auth/forgot-password", {email}); setSuccess(true); return; }
                  if (mode === "reset-password") {
                    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
                    if (!token) throw new Error("Open the password reset link from your email.");
                    await api("auth/reset-password", {token, password});
                    window.history.replaceState(null, "", window.location.pathname);
                    await refresh(); setSuccess(true); return;
                  }
                  if (mode === "register") {
                    await auth.signup({email,password,name:String(data.get("name")).trim(),phone:String(data.get("phone")).trim(),city:String(data.get("city"))});
                  } else { await auth.login(email,password); }
                  await refresh();
                  toast(mode === "register" ? "Account created. Welcome!" : "Welcome back.");
                  router.replace("/dashboard");
                } catch(e) { setError(e instanceof Error ? e.message : "Unable to sign in. Please retry."); }
                finally { setPending(false); }
              }}
            >
              {mode === "register" && (
                <Field label="Full name">
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    placeholder="e.g. Kasun Perera"
                  />
                </Field>
              )}
              {mode !== "reset-password" && (
                <Field label="Email address">
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                  />
                </Field>
              )}
              {mode !== "forgot-password" && (
                <Field label="Password">
                  <input
                    name="password"
                    type="password"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    minLength={mode === "login" ? 1 : 8}
                    maxLength={128}
                    required
                    placeholder="At least 8 characters"
                  />
                </Field>
              )}
              {mode === "reset-password" && (
                <Field label="Confirm password">
                  <input
                    name="confirm"
                    type="password"
                    minLength={8}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                  />
                </Field>
              )}
              {mode === "register" && (
                <>
                  <div className="form-grid">
                    <Field label="Phone">
                      <input
                        name="phone"
                        type="tel"
                        required
                        pattern="(?:0|\+94)[0-9 ]{9,12}"
                        placeholder="077 123 4567"
                      />
                    </Field>
                    <Field label="City">
                      <select name="city">
                        <option>Colombo</option>
                        <option>Kandy</option>
                        <option>Galle</option>
                        <option>Gampaha</option>
                        <option>Kurunegala</option>
                      </select>
                    </Field>
                  </div>
                  <label className="check-row">
                    <input type="checkbox" required />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" className="text-button">
                        terms
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-button">
                        privacy notice
                      </Link>
                      .
                    </span>
                  </label>
                </>
              )}
              {mode === "login" && (
                <div style={{ textAlign: "right", margin: "-5px 0 22px" }}>
                  <Link className="text-button" href="/auth/forgot-password">
                    Forgot password?
                  </Link>
                </div>
              )}
              {error && (
                <p className="error-text" role="alert">
                  {error}
                </p>
              )}
              <button className="btn btn-primary" disabled={pending}>
                {pending ? "Please wait…" : mode === "login"
                  ? "Sign in"
                  : mode === "register"
                    ? "Create account"
                    : mode === "forgot-password"
                      ? "Send reset link"
                      : "Reset password"}
                <Icon name="arrow" size={16} />
              </button>
            </form>
          )}
          <p className="auth-footer">
            {mode === "login" ? (
              <>
                New here? <Link href="/auth/register">Create an account</Link>
              </>
            ) : (
              <>
                Already have an account? <Link href="/auth/login">Sign in</Link>
              </>
            )}
          </p>
          <p className="auth-footer">
            <Link href="/">← Back to marketplace</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
