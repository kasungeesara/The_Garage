"use client";
import Link from "next/link";
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactNode,
  type ReactElement,
} from "react";
import { Icon } from "./icons";
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function ButtonLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      className={`btn ${secondary ? "btn-secondary" : "btn-primary"}`}
      href={href}
    >
      {children}
    </Link>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      className={`badge badge-${String(children).toLowerCase().replaceAll(" ", "-")}`}
    >
      {children}
    </span>
  );
}
export function EmptyState({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <Icon name="box" size={38} />
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {href && <ButtonLink href={href}>{label || "Browse parts"}</ButtonLink>}
    </div>
  );
}
export function Stat({
  label,
  value,
  detail,
  icon = "chart",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <Icon name={icon} />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span id={`${id}-label`}>{label}</span>
      {Children.map(children, (child) =>
        isValidElement(child) &&
        typeof child.type === "string" &&
        ["input", "select", "textarea"].includes(child.type)
          ? cloneElement(
              child as ReactElement<{
                id?: string;
                "aria-labelledby"?: string;
              }>,
              { id, "aria-labelledby": `${id}-label` },
            )
          : child,
      )}
    </label>
  );
}
export function Panel({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="panel">
      {title && (
        <div className="panel-heading">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
