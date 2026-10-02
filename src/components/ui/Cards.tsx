"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "sm" }: StatusBadgeProps) {
  const norm = status?.toUpperCase() || "";

  let bg = "bg-slate-100 text-slate-700 border-slate-200";

  // Success / Emerald
  if (["PAID", "CONVERTED", "PRESENT", "COMPLETED", "ACTIVE", "QUALIFIED", "HIGH", "APPROVED", "RESOLVED"].includes(norm)) {
    bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  // Warning / Amber
  if (["PENDING", "FOLLOW_UP", "LATE", "MEDIUM", "IN_PROGRESS", "CONTACTED", "ACTION_NEEDED", "HALF_DAY", "OPTIONAL"].includes(norm)) {
    bg = "bg-amber-50 text-amber-700 border-amber-200";
  }
  // Danger / Red
  if (["LOST", "OVERDUE", "ABSENT", "URGENT", "FAILED", "REJECTED", "CANCELLED", "CLOSED"].includes(norm)) {
    bg = "bg-rose-50 text-rose-700 border-rose-200";
  }
  // Primary Blue / Purple
  if (["NEW", "LEAVE", "ADMIN", "OPEN", "PRO", "ENTERPRISE", "LOW", "WORK_FROM_HOME", "WFH", "NATIONAL", "FESTIVAL"].includes(norm)) {
    bg = "bg-blue-50 text-blue-700 border-blue-200 font-bold";
  }
  // Indigo / Purple / Sunday
  if (["MANAGER", "SHIFTS", "TASK", "LEAD", "SUNDAY", "COMPANY_OFF", "GENERATED", "HOLD"].includes(norm)) {
    bg = "bg-indigo-50 text-indigo-700 border-indigo-200";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold uppercase tracking-wider rounded-md border font-mono",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        bg,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      <span>{status?.replace(/_/g, " ")}</span>
    </span>
  );
}

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: string;
  comparisonText?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  trend,
  comparisonText,
  isPositive = true,
  icon: Icon,
  iconColor = "text-blue-600 bg-blue-50 border-blue-200",
  className,
  onClick,
}: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex flex-col justify-between shadow-sm",
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight font-mono">{value}</div>
        {(trend || comparisonText) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {trend && (
              <span
                className={cn(
                  "font-bold font-mono px-1.5 py-0.5 rounded text-[11px]",
                  isPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {trend}
              </span>
            )}
            {comparisonText && <span className="text-slate-500 text-[11px] truncate">{comparisonText}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
