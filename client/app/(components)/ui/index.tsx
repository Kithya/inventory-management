import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export const formatCurrency = (value: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(Number.isFinite(value) ? value : 0);

export const formatNumber = (value: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(Number.isFinite(value) ? value : 0);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

export const initials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl dark:text-white">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="w-full shrink-0 sm:w-auto">{actions}</div>
      ) : null}
    </header>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface ${className}`}>
      {title || description || action ? (
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            {title ? (
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "blue" | "emerald" | "amber" | "violet";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
  };

  return (
    <div className="surface flex min-w-0 items-center gap-4 p-4">
      <div className={`rounded-lg p-2.5 ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-950 dark:text-white">
          {value}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      </div>
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    warning:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
    danger: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="surface flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
      <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </p>
    </div>
  );
}

export function ErrorState({
  title = "Unable to load this data",
  description = "Check that the API is running, then try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="surface flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-red-50 p-3 text-red-600 dark:bg-red-950/60 dark:text-red-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {onRetry ? (
        <button className="button-secondary mt-5" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Inbox className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export function TablePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
      <button
        aria-label="Go to previous page"
        className="button-secondary h-8 px-3 text-xs"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span className="min-w-20 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
        Page {page} of {totalPages}
      </span>
      <button
        aria-label="Go to next page"
        className="button-secondary h-8 px-3 text-xs"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
