import { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  subValue?: string | number;
  icon?: ReactNode;
  accent?: "blue" | "emerald" | "amber" | "violet" | "rose" | "slate";
  size?: "default" | "large";
}

const ACCENT_STYLES: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

export function KpiCard({
  label,
  value,
  subLabel,
  subValue,
  icon,
  accent = "blue",
  size = "default",
}: KpiCardProps) {
  const isLarge = size === "large";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5 transition-shadow hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span
          className={`font-medium uppercase tracking-wide text-slate-500 ${
            isLarge ? "text-base" : "text-xs"
          }`}
        >
          {label}
        </span>
        {icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${ACCENT_STYLES[accent]}`}>
            {icon}
          </span>
        )}
      </div>
      <div className={`mt-2 font-bold text-slate-900 ${isLarge ? "text-5xl" : "text-2xl"}`}>
        {value}
      </div>
      {subValue !== undefined && (
        <div className="mt-1 text-xs font-medium text-slate-400">
          {subLabel ? `${subLabel}: ` : ""}
          {subValue}
        </div>
      )}
    </div>
  );
}
