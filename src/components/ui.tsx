import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

type Variant = "primary" | "ghost" | "quiet" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-amber text-ink hover:bg-amber-hi active:bg-amber-lo font-cond font-bold tracking-wide shadow-[0_6px_24px_-8px_rgba(249,171,25,0.55)]",
  ghost: "bg-raised text-fg hover:bg-line border border-line font-cond font-semibold",
  quiet: "text-dim hover:text-fg hover:bg-raised font-cond font-semibold",
  danger: "text-bad hover:bg-bad/10 border border-bad/30 font-cond font-semibold",
};

export function Button({
  variant = "ghost",
  busy,
  icon,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean; icon?: ReactNode }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 h-10 text-[15px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${className}`}
    >
      {busy ? <LoaderCircle size={17} className="spin" /> : icon}
      {children}
    </button>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`bg-panel border border-line rounded-2xl ${className}`}>{children}</section>;
}

export function PageHeader({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-6 mb-7">
      <div className="max-w-[62ch]">
        <h1 className="font-display text-[28px] leading-none uppercase text-fg">{title}</h1>
        {lead && <p className="text-dim mt-3 text-[15.5px]">{lead}</p>}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

export function Dot({ tone }: { tone: "good" | "warn" | "bad" | "faint" | "amber" }) {
  const c = { good: "bg-good", warn: "bg-warn", bad: "bg-bad", faint: "bg-faint", amber: "bg-amber" }[tone];
  return <span className={`inline-block size-2 rounded-full ${c}`} aria-hidden />;
}

export function Tag({ children, tone = "faint" }: { children: ReactNode; tone?: "good" | "warn" | "bad" | "faint" | "amber" }) {
  const c = {
    good: "text-good bg-good/10",
    warn: "text-warn bg-warn/10",
    bad: "text-bad bg-bad/10",
    faint: "text-dim bg-raised",
    amber: "text-amber bg-amber/10",
  }[tone];
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12.5px] font-medium ${c}`}>{children}</span>;
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-dim py-16 justify-center">
      <LoaderCircle size={20} className="spin text-amber" />
      {label}
    </div>
  );
}
